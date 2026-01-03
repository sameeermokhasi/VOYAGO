from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import math

from app.database import get_db
from app.models import User, City, IntercityRide, UserRole, RideStatus
from app.schemas import CityCreate, CityResponse, IntercityRideCreate, IntercityRideResponse
from app.auth import get_current_active_user
from app.utils import calculate_distance

router = APIRouter()

def calculate_intercity_price(distance_km: float, vehicle_type: str, base_multiplier: float = 1.5) -> float:
    """Calculate intercity ride price"""
    base_fare = {
        "economy": 200,
        "premium": 350,
        "suv": 450,
        "luxury": 700
    }
    
    per_km_rate = {
        "economy": 12,
        "premium": 18,
        "suv": 22,
        "luxury": 30
    }
    
    base = base_fare.get(vehicle_type, 200)
    rate = per_km_rate.get(vehicle_type, 12)
    
    return (base + (distance_km * rate)) * base_multiplier



@router.get("/cities", response_model=List[CityResponse])
async def get_cities(db: Session = Depends(get_db)):
    """Get all active cities"""
    cities = db.query(City).filter(City.is_active == True).all()
    return cities

@router.post("/cities", response_model=CityResponse, status_code=status.HTTP_201_CREATED)
async def create_city(
    city_data: CityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new city (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    existing_city = db.query(City).filter(City.name == city_data.name).first()
    if existing_city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="City already exists"
        )
    
    new_city = City(**city_data.dict())
    db.add(new_city)
    db.commit()
    db.refresh(new_city)
    
    return new_city

@router.post("/rides", response_model=IntercityRideResponse, status_code=status.HTTP_201_CREATED)
async def create_intercity_ride(
    ride_data: IntercityRideCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create an intercity ride booking"""
    if current_user.role != UserRole.RIDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only riders can book intercity rides"
        )
    
    # Verify cities exist
    origin_city = db.query(City).filter(City.id == ride_data.origin_city_id).first()
    dest_city = db.query(City).filter(City.id == ride_data.destination_city_id).first()
    
    if not origin_city or not dest_city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Origin or destination city not found"
        )
    
    # Calculate distance if city coordinates are available
    distance = None
    if origin_city.lat and origin_city.lng and dest_city.lat and dest_city.lng:
        distance = calculate_distance(
            origin_city.lat, origin_city.lng,
            dest_city.lat, dest_city.lng
        )
    else:
        distance = 100  # Default distance
    
    # Calculate price
    price = calculate_intercity_price(distance, ride_data.vehicle_type.value)
    
    # Estimate duration (assuming average highway speed of 80 km/h)
    estimated_duration = distance / 80 if distance else 2
    
    new_ride = IntercityRide(
        rider_id=current_user.id,
        origin_city_id=ride_data.origin_city_id,
        destination_city_id=ride_data.destination_city_id,
        pickup_address=ride_data.pickup_address,
        dropoff_address=ride_data.dropoff_address,
        scheduled_date=ride_data.scheduled_date,
        vehicle_type=ride_data.vehicle_type,
        distance_km=distance,
        estimated_duration_hours=estimated_duration,
        price=price,
        passengers=ride_data.passengers
    )
    
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    
    return new_ride

@router.get("/rides", response_model=List[IntercityRideResponse])
async def get_intercity_rides(
    status: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get intercity rides for current user"""
    query = db.query(IntercityRide)
    
    if status:
        # Convert string to enum
        try:
            status_enum = RideStatus(status.lower())
            query = query.filter(IntercityRide.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status value"
            )
    
    if current_user.role == UserRole.RIDER:
        query = query.filter(IntercityRide.rider_id == current_user.id)
    elif current_user.role == UserRole.DRIVER:
        # For drivers, show their rides and pending rides
        query = query.filter(
            (IntercityRide.driver_id == current_user.id) | 
            (IntercityRide.status == RideStatus.PENDING)
        )
    
    rides = query.order_by(IntercityRide.scheduled_date.desc()).all()
    return rides

@router.get("/rides/available", response_model=List[IntercityRideResponse])
async def get_available_intercity_rides(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available intercity rides for drivers"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can view available rides"
        )
    
    rides = db.query(IntercityRide).filter(
        IntercityRide.status == RideStatus.PENDING
    ).order_by(IntercityRide.scheduled_date.desc()).all()
    
    return rides

@router.patch("/rides/{ride_id}/accept")
async def accept_intercity_ride(
    ride_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Accept an intercity ride (Driver only)"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can accept rides"
        )
    
    ride = db.query(IntercityRide).filter(IntercityRide.id == ride_id).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    if ride.status != RideStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not available"
        )
    
    ride.driver_id = current_user.id
    ride.status = RideStatus.ACCEPTED
    
    db.commit()
    db.refresh(ride)
    
    return {"message": "Intercity ride accepted successfully", "ride": ride}

@router.patch("/rides/{ride_id}/reject")
async def reject_intercity_ide(
    ride_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject an intercity ride (Driver only)"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can reject rides"
        )
    
    ride = db.query(IntercityRide).filter(IntercityRide.id == ride_id).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    if ride.status != RideStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not available for rejection"
        )
    
    # Just reset the ride to be available for other drivers
    # In a real implementation, you might want to notify the rider
    
    db.commit()
    db.refresh(ride)
    
    return {"message": "Intercity ride rejected successfully", "ride": ride}
