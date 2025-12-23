from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
import math
from datetime import datetime

from app.database import get_db
from app.database import get_db
from app.models import User, Ride, DriverProfile, RideStatus, UserRole, Transaction
from app.schemas import RideCreate, RideResponse, RideUpdate, RideRating, LocationUpdate
from app.auth import get_current_active_user
from app.websocket import manager

from app.routers.vacation_scheduler import schedule_next_ride

router = APIRouter()

from app.utils import calculate_fare, calculate_distance

def find_nearby_drivers(db: Session, pickup_lat: float, pickup_lng: float, max_distance_km: float = 50.0) -> List[User]:
    """Find drivers within specified distance of pickup location"""
    # Get all available drivers with location data
    drivers = db.query(User).join(DriverProfile).filter(
        and_(
            User.role == UserRole.DRIVER,
            User.is_active == True,
            DriverProfile.is_available == True,
            DriverProfile.current_lat != None,
            DriverProfile.current_lng != None
        )
    ).all()
    
    nearby_drivers = []
    for driver in drivers:
        if driver.driver_profile and driver.driver_profile.current_lat is not None and driver.driver_profile.current_lng is not None:
            try:
                distance = calculate_distance(
                    pickup_lat, pickup_lng,
                    float(driver.driver_profile.current_lat),
                    float(driver.driver_profile.current_lng)
                )
                if distance <= max_distance_km:
                    nearby_drivers.append(driver)
            except (ValueError, TypeError) as e:
                print(f"Error calculating distance for driver {driver.id}: {e}")
                continue
    
    print(f"Found {len(nearby_drivers)} nearby drivers for pickup at ({pickup_lat}, {pickup_lng})")
    for driver in nearby_drivers:
        print(f"  Driver {driver.id} at ({driver.driver_profile.current_lat}, {driver.driver_profile.current_lng})")
    
    return nearby_drivers


@router.post("/", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    ride_data: RideCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new ride request"""
    if current_user.role.value != UserRole.RIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only riders can create ride requests"
        )
    
    # Calculate distance
    distance = calculate_distance(
        float(ride_data.pickup_lat), float(ride_data.pickup_lng),
        float(ride_data.destination_lat), float(ride_data.destination_lng)
    )
    
    # Calculate estimated fare
    estimated_fare = calculate_fare(distance, ride_data.vehicle_type.value)
    
    # Estimate duration (assuming average speed of 40 km/h)
    duration = int((distance / 40) * 60)
    
    new_ride = Ride(
        rider_id=current_user.id,
        pickup_address=ride_data.pickup_address,
        pickup_lat=float(ride_data.pickup_lat),
        pickup_lng=float(ride_data.pickup_lng),
        destination_address=ride_data.destination_address,
        destination_lat=float(ride_data.destination_lat),
        destination_lng=float(ride_data.destination_lng),
        vehicle_type=ride_data.vehicle_type,
        distance_km=distance,
        duration_minutes=duration,
        estimated_fare=estimated_fare,
        scheduled_time=ride_data.scheduled_time
    )
    
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    
    # Find nearby drivers within 3km
    print(f"=== FINDING NEARBY DRIVERS FOR RIDE {new_ride.id} ===")
    print(f"Pickup location: ({ride_data.pickup_lat}, {ride_data.pickup_lng})")
    nearby_drivers = find_nearby_drivers(
        db, 
        float(ride_data.pickup_lat), 
        float(ride_data.pickup_lng), 
        max_distance_km=50.0
    )
    print(f"Found {len(nearby_drivers)} nearby drivers")
    
    notification_sent = False
    
    # Send WebSocket notification to nearby drivers
    if nearby_drivers:
        print(f"Sending notifications to {len(nearby_drivers)} drivers")
        for driver in nearby_drivers:
            # Refresh the driver to get actual values
            db.refresh(driver)
            try:
                print(f"Sending WebSocket message to driver {driver.id}")
                await manager.send_personal_message({
                    "type": "new_ride_request",
                    "ride_id": new_ride.id,
                    "pickup_address": new_ride.pickup_address,
                    "destination_address": new_ride.destination_address,
                    "distance_km": round(float(new_ride.distance_km or 0), 2),
                    "estimated_fare": round(float(new_ride.estimated_fare or 0), 2),
                    "vehicle_type": new_ride.vehicle_type.value if new_ride.vehicle_type is not None else "economy"
                }, int(driver.id) if driver.id is not None else 0)
                print(f"Successfully sent WebSocket message to driver {driver.id}")
                notification_sent = True
            except Exception as e:
                print(f"Failed to send WebSocket message to driver {driver.id}: {e}")
    else:
        print("No nearby drivers found")
    
    # If no notifications were sent to nearby drivers, broadcast to all connected drivers as fallback
    if not notification_sent:
        try:
            print("Broadcasting ride request to all connected drivers as fallback")
            await manager.broadcast({
                "type": "new_ride_request",
                "ride_id": new_ride.id,
                "pickup_address": new_ride.pickup_address,
                "destination_address": new_ride.destination_address,
                "distance_km": round(float(new_ride.distance_km or 0), 2),
                "estimated_fare": round(float(new_ride.estimated_fare or 0), 2),
                "vehicle_type": new_ride.vehicle_type.value if new_ride.vehicle_type is not None else "economy"
            })
            print("Broadcast message sent to all connected drivers")
        except Exception as e:
            print(f"Failed to broadcast ride request: {e}")

    return new_ride

@router.get("/available", response_model=List[RideResponse])
async def get_available_rides(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available rides for drivers"""
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()
        
    if user_role not in [UserRole.DRIVER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can view available rides"
        )
    
    # Get all pending rides without a driver
    rides = db.query(Ride).filter(
        and_(
            Ride.status == RideStatus.PENDING,
            Ride.driver_id == None
        )
    ).order_by(Ride.created_at.desc()).all()
    
    return rides

@router.get("/", response_model=List[RideResponse])
async def get_rides(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None
):
    """Get rides for current user"""
    query = db.query(Ride)
    
    try:
        # Robust role check
        user_role = current_user.role
        if hasattr(user_role, 'value'):
            user_role = user_role.value
        else:
            user_role = str(user_role).lower()
            
        print(f"DEBUG: get_rides user_id={current_user.id} role={user_role}")

        if user_role == UserRole.RIDER.value:
            query = query.filter(Ride.rider_id == current_user.id)
        elif user_role == UserRole.DRIVER.value:
            # For drivers, show their assigned rides and pending rides
            query = query.filter(
                or_(
                    Ride.driver_id == current_user.id,
                    and_(
                        Ride.status == RideStatus.PENDING,
                        Ride.driver_id == None
                    )
                )
            )
        elif user_role == UserRole.ADMIN.value or user_role == "admin":
             # Admin sees all rides
             pass
            
        if status:
            query = query.filter(Ride.status == status)
        
        rides = query.order_by(Ride.created_at.desc()).all()
        return rides
    except Exception as e:
        import traceback
        print(f"ERROR in get_rides: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/{ride_id}/rate", response_model=RideResponse)
async def rate_ride(
    ride_id: int,
    rating_data: RideRating,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Rate a completed ride"""
    import os
    
    # helper for logging
    def log_debug(msg):
        with open("rating_debug.log", "a") as f:
            f.write(f"{datetime.now()}: {msg}\n")
            
    log_debug(f"=== RATING RIDE {ride_id} ===")
    log_debug(f"User: {current_user.id} ({current_user.role})")
    log_debug(f"Data: {rating_data}")
    
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    
    if not ride:
        log_debug("Ride not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    log_debug(f"Ride found. Rider ID: {ride.rider_id}, Status: {ride.status}")
    
    # Robust ID comparison
    if str(ride.rider_id) != str(current_user.id):
        log_debug(f"Authorization failed. Rider ID: {ride.rider_id}, User ID: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate this ride"
        )
    
    current_status = str(ride.status).lower()
    expected = RideStatus.COMPLETED.value.lower()
    
    if current_status != expected:
        log_debug(f"Invalid status: {ride.status} (Expected: {RideStatus.COMPLETED.value})")
        # Double check if it's just a casing issue or different enum representation
        if "completed" not in current_status:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Can only rate completed rides (Current: {ride.status})"
            )
    
    try:
        ride.rating = int(str(rating_data.rating))
        ride.feedback = rating_data.feedback
        log_debug(f"Rating updated in object: {ride.rating}")
        
        # Update driver rating
        if ride.driver_id is not None:
            driver_profile = db.query(DriverProfile).filter(
                DriverProfile.user_id == ride.driver_id
            ).first()
            if driver_profile:
                # Commit ride rating first so it's included in the query
                db.commit()
                db.refresh(ride)
                
                # Now calculate average
                total_rated_rides = db.query(Ride).filter(
                    Ride.driver_id == ride.driver_id,
                    Ride.rating != None
                ).count()
                
                log_debug(f"Total rated rides for driver {ride.driver_id}: {total_rated_rides}")
                
                total_rating_sum = 0
                ratings = db.query(Ride.rating).filter(
                    Ride.driver_id == ride.driver_id,
                    Ride.rating != None
                ).all()
                
                for r in ratings:
                    try:
                        if r[0] is not None:
                            total_rating_sum += int(r[0])
                    except (ValueError, TypeError):
                        pass
                
                avg_rating = total_rating_sum / total_rated_rides if total_rated_rides > 0 else 5.0
                driver_profile.rating = float(str(round(avg_rating, 2)))
                log_debug(f"Driver rating updated to {driver_profile.rating}")
                
            else:
                 log_debug(f"Driver profile not found for user_id {ride.driver_id}")
        else:
             log_debug("No driver assigned to this ride")
                
        db.commit()
        db.refresh(ride)
        log_debug("Successfully committed to DB")
        return ride
        
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        log_debug(f"EXCEPTION: {e}\n{error_trace}")
        print(f"Failed to rate ride: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit rating: {str(e)}"
        )

@router.delete("/{ride_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_ride(
    ride_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a ride"""
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    # Check if the current user is the rider who booked the ride or an admin
    if ride.rider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this ride"
        )
    
    # Check if the ride is in a cancellable state
    if str(ride.status) in [RideStatus.COMPLETED.value, RideStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel this ride"
        )
    
    # Cancel the ride
    ride.status = RideStatus.CANCELLED.value
    db.commit()

    return None


@router.patch("/{ride_id}", response_model=RideResponse)
async def update_ride(
    ride_id: int,
    ride_update: RideUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update ride status (accept, start, complete, etc.)"""
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    # helper for role checking
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()
        
    print(f"DEBUG: update_ride {ride_id} status={ride_update.status} user={current_user.id} role={user_role}")
        

    # Helper to safe get status string
    def get_status_str(status_val):
        if hasattr(status_val, 'value'):
            return str(status_val.value)
        return str(status_val)

    # Permission checks based on status change
    if ride_update.status:
        new_status = ride_update.status
        current_status_str = get_status_str(ride.status)
        
        # Accepting a ride
        if new_status == "accepted":
            if user_role != UserRole.DRIVER.value:
                raise HTTPException(status_code=403, detail="Only drivers can accept rides")
            
            if current_status_str != RideStatus.PENDING.value:
                raise HTTPException(status_code=400, detail=f"Ride is not pending (current status: {current_status_str})")
                
            ride.driver_id = current_user.id
            ride.status = RideStatus.ACCEPTED.value
            
            # Send WebSocket notification to rider
            try:
                await manager.send_personal_message({
                    "type": "ride_accepted",
                    "ride_id": ride.id,
                    "driver_name": current_user.name,
                    "vehicle": f"{current_user.driver_profile.vehicle_color} {current_user.driver_profile.vehicle_model} ({current_user.driver_profile.vehicle_plate})" if current_user.driver_profile else "Unknown Vehicle"
                }, int(ride.rider_id))
            except Exception as e:
                print(f"Failed to send notification: {e}")
                
        # Starting a ride
        elif new_status == "in_progress":
            if user_role != UserRole.DRIVER.value:
                raise HTTPException(status_code=403, detail="Only drivers can start rides")
                
            if ride.driver_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not the assigned driver")
                
            if current_status_str != RideStatus.ACCEPTED.value:
                raise HTTPException(status_code=400, detail=f"Ride must be accepted before starting (current status: {current_status_str})")
                
            ride.status = RideStatus.IN_PROGRESS.value
            ride.start_time = datetime.now()
            
            # WebSocket notification
            try:
                await manager.send_personal_message({
                    "type": "ride_started",
                    "ride_id": ride.id
                }, int(ride.rider_id))
            except Exception as e:
                print(f"Failed to send notification: {e}")

        # Completing a ride
        elif new_status == "completed":
            if user_role != UserRole.DRIVER.value:
                raise HTTPException(status_code=403, detail="Only drivers can complete rides")
                
            if ride.driver_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not the assigned driver")
                
            if current_status_str != RideStatus.IN_PROGRESS.value:
                raise HTTPException(status_code=400, detail=f"Ride must be in progress before completing (current status: {current_status_str})")
                
            ride.status = RideStatus.COMPLETED.value
            ride.end_time = datetime.now()
            
            # Process Payment (80/20 Split)
            driver = db.query(User).filter(User.id == current_user.id).first()
            if driver:
                # Calculate Split
                total_fare = float(ride.final_fare or ride.estimated_fare or 0)
                driver_cut = total_fare * 0.80
                platform_cut = total_fare * 0.20
                
                # Credit Driver (80%)
                current_driver_balance = float(driver.wallet_balance or 0)
                driver.wallet_balance = current_driver_balance + driver_cut
                
                # Create Driver Transaction
                # Create Driver Transaction
                driver_txn = Transaction(
                    user_id=driver.id,
                    amount=driver_cut,
                    type="credit",
                    description=f"Payment from {ride.rider.name}"
                )
                db.add(driver_txn)
                
                # Credit Admin/Platform (20%)
                # Assuming Admin ID is 1. If not, just logging it for now.
                admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
                if admin_user:
                    current_admin_balance = float(admin_user.wallet_balance or 0)
                    admin_user.wallet_balance = current_admin_balance + platform_cut
                    
                    admin_txn = Transaction(
                        user_id=admin_user.id,
                        amount=platform_cut,
                        type="credit",
                        description=f"Platform Fee for ride #{ride.id} (20% of ₹{total_fare})"
                    )
                    db.add(admin_txn)
                else:
                    print(f"WARNING: No Admin user found to credit platform fee of {platform_cut}")
            
            # Check if this is part of a vacation and schedule next ride if so
            # DISABLED: Auto-scheduling is disabled to allow manual trigger via "Start Next Leg" button
            # if ride.vacation_id:
            #     try:
            #         await schedule_next_ride(db, ride.vacation_id)
            #     except Exception as e:
            #         print(f"Failed to schedule next vacation ride: {e}")
            
            # WebSocket notification
            try:
                await manager.send_personal_message({
                    "type": "ride_completed",
                    "ride_id": ride.id,
                    "fare": ride.estimated_fare
                }, int(ride.rider_id))
            except Exception as e:
                print(f"Failed to send notification: {e}")

    db.commit()
    db.refresh(ride)
    return ride
