from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from app.database import get_db
from app.database import get_db
from app.models import User, DriverProfile, UserRole, Ride, RideStatus, Transaction, SavedCard
from app.schemas import UserResponse, DriverProfileResponse, DriverProfileUpdate, DriverWithProfile, LocationUpdate, WalletAdd, UserUpdate, TransactionResponse, SavedCardCreate, SavedCardResponse
from app.auth import get_current_active_user
from app.websocket import manager

router = APIRouter()

@router.get("/me", response_model=DriverWithProfile)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    # If user is a driver, fetch their profile
    if current_user.role == UserRole.DRIVER:
        driver_profile = db.query(DriverProfile).filter(
            DriverProfile.user_id == current_user.id
        ).first()
        
        # Create a dict from the user model
        user_dict = UserResponse.from_orm(current_user).dict()
        
        if driver_profile:
            user_dict['driver_profile'] = DriverProfileResponse.from_orm(driver_profile).dict()
        else:
            user_dict['driver_profile'] = None
            
        return user_dict
        
    return current_user

@router.get("/me/debug", response_model=UserResponse)
async def get_current_user_debug(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user with debug information"""
    print(f"=== USER DEBUG ===")
    print(f"User ID: {current_user.id}")
    print(f"User Email: {current_user.email}")
    print(f"User Role: {current_user.role}")
    print(f"User Role Type: {type(current_user.role)}")
    print(f"UserRole.DRIVER: {UserRole.DRIVER}")
    print(f"UserRole.DRIVER Type: {type(UserRole.DRIVER)}")
    print(f"UserRole.DRIVER.value: {UserRole.DRIVER.value}")
    print(f"UserRole.DRIVER.value Type: {type(UserRole.DRIVER.value)}")
    print(f"Role comparison: {str(current_user.role) == str(UserRole.DRIVER.value)}")
    print(f"=== END USER DEBUG ===")
    
    # Also check if user has a driver profile
    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user.id
    ).first()
    
    print(f"Driver profile exists: {driver_profile is not None}")
    if driver_profile:
        print(f"Driver profile available: {driver_profile.is_available}")
    
    return current_user

@router.get("/drivers", response_model=List[DriverWithProfile])
async def get_drivers(
    db: Session = Depends(get_db),
    available_only: bool = False
):
    """Get list of drivers"""
    query = db.query(User).filter(User.role == UserRole.DRIVER)
    drivers = query.all()
    
    result = []
    for driver in drivers:
        driver_profile = db.query(DriverProfile).filter(
            DriverProfile.user_id == driver.id
        ).first()
        
        if available_only and driver_profile and not driver_profile.is_available:
            continue
        
        driver_dict = UserResponse.from_orm(driver).dict()
        if driver_profile:
            driver_dict['driver_profile'] = DriverProfileResponse.from_orm(driver_profile).dict()
        else:
            driver_dict['driver_profile'] = None
        result.append(driver_dict)
    
    return result

@router.patch("/driver/location", response_model=UserResponse)
async def update_driver_location(
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update driver's current location"""
    if current_user.role.value != UserRole.DRIVER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can update their location"
        )
    
    # Get or create driver profile
    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user.id
    ).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    # Update location
    driver_profile.current_lat = location_data.lat
    driver_profile.current_lng = location_data.lng
    
    db.commit()
    db.refresh(driver_profile)
    db.refresh(current_user)
    
    # Send WebSocket update to all riders with active rides with this driver
    active_rides = db.query(Ride).filter(
        and_(
            Ride.driver_id == current_user.id,
            Ride.status.in_([RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
        )
    ).all()
    
    for ride in active_rides:
        # Send location update to rider
        await manager.send_personal_message({
            "type": "driver_location_update",
            "ride_id": ride.id,
            "lat": location_data.lat,
            "lng": location_data.lng
        }, int(ride.rider_id))
    
    return current_user

@router.patch("/driver/availability", response_model=DriverWithProfile)
async def toggle_driver_availability(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Toggle driver availability status"""
    
    # Check if user is a driver
    if current_user.role != UserRole.DRIVER:  # Use direct enum comparison
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can update their availability"
        )
    
    # Get or create driver profile
    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user.id
    ).first()
    
    if not driver_profile:
        # Create driver profile if it doesn't exist
        driver_profile = DriverProfile(
            user_id=current_user.id,
            license_number=f"LIC{current_user.id:06d}",  # Generate a default license number
            is_available=True
        )
        db.add(driver_profile)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create driver profile: {str(e)}"
            )
        db.refresh(driver_profile)
    
    # Toggle availability
    # Toggle availability
    current_status = driver_profile.is_available
    if isinstance(current_status, str):
        current_status = current_status.lower() == 'true'
    
    driver_profile.is_available = not current_status
    
    try:
        db.commit()
        db.refresh(driver_profile)
        db.refresh(current_user)
        print(f"Driver {current_user.id} availability toggled to: {driver_profile.is_available}")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update availability: {str(e)}"
        )
    
    # Create response with driver profile
    user_dict = UserResponse.from_orm(current_user).dict()
    user_dict['driver_profile'] = DriverProfileResponse.from_orm(driver_profile).dict()
    
    return user_dict

@router.post("/wallet/add", response_model=UserResponse)
async def add_money_to_wallet(
    wallet_data: WalletAdd,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add money to user's wallet"""
    # Only riders can add money manually (drivers earn from rides)
    # But for testing/flexibility, we might allow both or restrict.
    # User request: "make the amount in the wallet initial amount to 0 in rider section only if he adds the amount"
    
    current_user.wallet_balance = float(current_user.wallet_balance or 0) + wallet_data.amount
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's transaction history"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).all()
    return transactions

@router.put("/me/driver", response_model=DriverProfileResponse)
async def update_driver_profile(
    profile_update: DriverProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update driver profile"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can update their driver profile"
        )
    
    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user.id
    ).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    if profile_update.vehicle_type is not None:
        driver_profile.vehicle_type = profile_update.vehicle_type
    if profile_update.vehicle_model is not None:
        driver_profile.vehicle_model = profile_update.vehicle_model
    if profile_update.vehicle_plate is not None:
        driver_profile.vehicle_plate = profile_update.vehicle_plate if profile_update.vehicle_plate.strip() else None
    if profile_update.vehicle_color is not None:
        driver_profile.vehicle_color = profile_update.vehicle_color
    if profile_update.license_number is not None:
        driver_profile.license_number = profile_update.license_number if profile_update.license_number.strip() else None
    if profile_update.aadhar_card_number is not None:
        driver_profile.aadhar_card_number = profile_update.aadhar_card_number if profile_update.aadhar_card_number.strip() else None
    if profile_update.city is not None:
        driver_profile.city = profile_update.city
        
    db.commit()
    db.refresh(driver_profile)
    return driver_profile

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.email is not None:
        # Check if email is taken
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.profile_picture is not None:
        current_user.profile_picture = user_update.profile_picture
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/cards", response_model=List[SavedCardResponse])
async def get_saved_cards(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's saved cards"""
    cards = db.query(SavedCard).filter(
        SavedCard.user_id == current_user.id
    ).order_by(SavedCard.created_at.desc()).all()
    return cards

@router.post("/cards", response_model=SavedCardResponse)
async def add_saved_card(
    card_data: SavedCardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a new saved card"""
    # check if card already exists (simple check by last4 for now)
    existing_card = db.query(SavedCard).filter(
        and_(
            SavedCard.user_id == current_user.id,
            SavedCard.last4 == card_data.last4,
            SavedCard.brand == card_data.brand
        )
    ).first()
    
    if existing_card:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Card already exists"
        )
        
    new_card = SavedCard(
        user_id=current_user.id,
        last4=card_data.last4,
        brand=card_data.brand,
        expiry_month=card_data.expiry_month,
        expiry_year=card_data.expiry_year,
        holder_name=card_data.holder_name
    )
    
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.delete("/cards/{card_id}")
async def delete_saved_card(
    card_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a saved card"""
    card = db.query(SavedCard).filter(
        and_(
            SavedCard.id == card_id,
            SavedCard.user_id == current_user.id
        )
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )
        
    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}