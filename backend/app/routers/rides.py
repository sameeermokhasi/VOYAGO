from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
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
from app.constants import CITY_COORDINATES

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

def match_location_tokens(driver_city: str, pickup_address: str) -> bool:
    """Check if driver city loosely matches pickup address using token overlap"""
    if not driver_city or not pickup_address:
        return False
        
    import re
    def get_tokens(text):
        return {w.lower() for w in re.split(r'[\s,-]+', str(text)) if len(w) > 2}
        
    driver_tokens = get_tokens(driver_city)
    pickup_tokens = get_tokens(pickup_address)
    
    # If ANY significant token matches, we consider it a match
    overlap = driver_tokens.intersection(pickup_tokens)
    return len(overlap) > 0

def find_drivers_by_city_string(db: Session, pickup_address: str) -> List[User]:
    """Find drivers matching the city string in pickup address"""
    nearby_drivers = []
    try:
        # Get all active drivers with a city set
        possible_drivers = db.query(User).join(DriverProfile).filter(
            and_(
                User.role == UserRole.DRIVER,
                User.is_active == True,
                DriverProfile.is_available == True,
                DriverProfile.city != None
            )
        ).all()
        
        print(f"Checking {len(possible_drivers)} active drivers for city match against: '{pickup_address}'")
        for driver in possible_drivers:
            driver_city = driver.driver_profile.city
            if match_location_tokens(driver_city, pickup_address):
                nearby_drivers.append(driver)
                print(f"  -> Match found: Driver {driver.id} (City: {driver_city})")
    except Exception as e:
        print(f"Error in string matching: {e}")
            
    return nearby_drivers


async def notify_drivers_task(ride_data: dict, driver_ids: List[int]):
    """Background task to send WebSocket notifications to drivers"""
    print(f"=== [BG TASK] Starting notification for ride {ride_data.get('ride_id')} to {len(driver_ids)} drivers ===")
    
    notification_sent = False
    
    # Notify specific drivers
    for driver_id in driver_ids:
        try:
            await manager.send_personal_message(ride_data, driver_id)
            print(f"-> [BG] Sent to driver {driver_id}")
            notification_sent = True
        except Exception as e:
            print(f"!!! [BG] Failed to send to driver {driver_id}: {e}")
            
    # Default broadcast if no specific notifications succeeded (or list was empty but we wanted to try)
    if not notification_sent and not driver_ids:
        try:
            print("=== [BG] Broadcasting to all drivers (fallback) ===")
            await manager.broadcast(ride_data)
        except Exception as e:
            print(f"!!! [BG] Broadcast failed: {e}")
            
    print("=== [BG TASK] Completed ===")

@router.post("/", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    ride_data: RideCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new ride request"""
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()

    if user_role != UserRole.RIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only riders can create ride requests"
        )

    # CHECK FOR EXISTING ACTIVE RIDE
    active_ride = db.query(Ride).filter(
        and_(
            Ride.rider_id == current_user.id,
            Ride.status.in_([RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
        )
    ).first()

    if active_ride:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active ride ({active_ride.status}). Please complete it first."
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
    
    # Find nearby drivers synchronously (should be fast)
    print(f"=== [STEP 1] FINDING NEARBY DRIVERS FOR RIDE {new_ride.id} ===")
    nearby_drivers = []
    try:
        nearby_drivers = find_nearby_drivers(
            db, 
            float(ride_data.pickup_lat), 
            float(ride_data.pickup_lng), 
            max_distance_km=50.0
        )
        print(f"=== [STEP 2] Found {len(nearby_drivers)} nearby drivers ===")
    except Exception as e:
        print(f"!!! ERROR finding drivers: {e}")
        
    # [STEP 2.5] ALSO FIND DRIVERS BY CITY STRING MATCH
    # This covers cases where GPS is stale/missing or user wants broad city match
    try:
        print(f"=== [STEP 2.5] Finding drivers by City String Match for '{ride_data.pickup_address}' ===")
        city_drivers = find_drivers_by_city_string(db, ride_data.pickup_address)
        print(f"=== [STEP 2.5] Found {len(city_drivers)} city-matched drivers ===")
        
        # Merge lists (avoid duplicates)
        nearby_drivers = list({d.id: d for d in (nearby_drivers + city_drivers)}.values())
        print(f"=== [STEP 2.5] Total Unique Drivers to Notify: {len(nearby_drivers)} ===")
    except Exception as e:
        print(f"!!! ERROR finding city drivers: {e}")
        
    # Prepare data for background task
    driver_ids = [int(d.id) for d in nearby_drivers if d.id is not None]
    
    notification_data = {
        "type": "new_ride_request",
        "ride_id": new_ride.id,
        "pickup_address": new_ride.pickup_address,
        "destination_address": new_ride.destination_address,
        "distance_km": round(float(new_ride.distance_km or 0), 2),
        "estimated_fare": round(float(new_ride.estimated_fare or 0), 2),
        "vehicle_type": new_ride.vehicle_type.value if new_ride.vehicle_type is not None else "economy"
    }

    # Offload notification to background task
    background_tasks.add_task(notify_drivers_task, notification_data, driver_ids)
    print("=== [STEP 3] Notification task queued ===")

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
    
    # Get driver's vehicle type
    driver_vehicle_type = None
    if current_user.driver_profile and current_user.driver_profile.vehicle_type:
        driver_vehicle_type = current_user.driver_profile.vehicle_type
    
    # DEBUG LOGGING TO FILE
    # with open("rides_debug.log", "a") as f:
    #     f.write(f"\n[{datetime.now()}] Checking rides for Driver {current_user.id} ({current_user.name})\n")
    #     f.write(f"Driver Vehicle Type: {driver_vehicle_type}\n")

    # print(f"DEBUG: Driver {current_user.id} Vehicle Check: {driver_vehicle_type} (Type: {type(driver_vehicle_type)})")

    # Get all pending rides without a driver and match vehicle type
    query_filters = [
        Ride.status == RideStatus.PENDING,
        Ride.driver_id == None
    ]
    
    # RELAXED FILTER: Temporarily DISABLED SQL filter to handle case sensitivity in Python
    # if driver_vehicle_type:
    #      print(f"DEBUG: Filtering for vehicle_type={driver_vehicle_type}")
    #      query_filters.append(Ride.vehicle_type == driver_vehicle_type)

    rides = db.query(Ride).filter(and_(*query_filters)).order_by(Ride.created_at.desc()).all()
    print(f"DEBUG: Found {len(rides)} pending rides before manual filtering")
    
    # with open("rides_debug.log", "a") as f:
    #     f.write(f"Found {len(rides)} pending rides in DB (Status=PENDING, Driver=None)\n")

    # 1. Filter by Vehicle Type (Strict Match)
    if driver_vehicle_type:
        try:
            # Normalize driver type to string
            driver_type_str = str(driver_vehicle_type.value if hasattr(driver_vehicle_type, 'value') else driver_vehicle_type).lower()
            
            with open("rides_debug.log", "a") as f:
                 f.write(f"Filtering for Driver Type: '{driver_type_str}'\n")

            filtered_rides = []
            for r in rides:
                # Normalize ride type to string
                ride_type_str = str(r.vehicle_type.value if hasattr(r.vehicle_type, 'value') else r.vehicle_type).lower()
                
                match = ride_type_str == driver_type_str
                with open("rides_debug.log", "a") as f:
                      f.write(f" - Ride {r.id}: Type='{ride_type_str}' Match={match}\n")

                if match:
                    filtered_rides.append(r)
                # else:
                #     print(f" - Skipping Ride {r.id}: Type mismatch ({ride_type_str} != {driver_type_str})")
            
            rides = filtered_rides
            print(f"DEBUG: Filtered to {len(rides)} rides matching vehicle type '{driver_type_str}'")
            
        except Exception as e:
            print(f"!!! Error in vehicle type filtering: {e}")
            with open("rides_debug.log", "a") as f:
                 f.write(f"ERROR filtering: {e}\n")
            pass

    # 2. Filter by Location (City Match) - TOKEN BASED
    # Uses the shared helper function for robust matching
    # 2. Filter by Location: Hybrid (City String OR GPS Distance)
    # Allows rides if EITHER the City Name matches OR the driver is physically nearby (GPS)
    if current_user.driver_profile:
        driver_profile = current_user.driver_profile
        driver_city = (driver_profile.city or "").strip().lower()
        driver_lat = driver_profile.current_lat
        driver_lng = driver_profile.current_lng
        
        # Only filter if we have some criteria to filter by (City or GPS)
        if driver_city or (driver_lat and driver_lng):
            print(f"DEBUG: Filtering rides for Driver: City='{driver_city}', Loc=({driver_lat}, {driver_lng})")
            
            location_filtered_rides = []
            for r in rides:
                # Condition A: String Match
                string_match = False
                if driver_city:
                    pickup = r.pickup_address.lower() if r.pickup_address else ""
                    string_match = match_location_tokens(driver_city, pickup)
                    
                # Condition B: GPS Distance (within 50km)
                distance_match = False
                if driver_lat is not None and driver_lng is not None and r.pickup_lat is not None and r.pickup_lng is not None:
                    try:
                        # calculate_distance imported from app.utils
                        dist = calculate_distance(float(driver_lat), float(driver_lng), float(r.pickup_lat), float(r.pickup_lng))
                        if dist <= 50.0:
                            distance_match = True
                    except Exception:
                        pass
                
                # If matched by EITHER, keep it
                if string_match or distance_match:
                    location_filtered_rides.append(r)
                else:
                    # Debug log why it failed? (Optional, skipping to save IO)
                    pass
            
            rides = location_filtered_rides
            print(f"DEBUG: Hybrid Filter kept {len(rides)} rides (String OR GPS)")


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
            
            # CHECK IF DRIVER ALREADY HAS AN ACTIVE RIDE
            active_driver_ride = db.query(Ride).filter(
                and_(
                    Ride.driver_id == current_user.id,
                    Ride.status.in_([RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
                )
            ).first()

            if active_driver_ride:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have an active ride. Complete it before accepting a new one."
                )

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
