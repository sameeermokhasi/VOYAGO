from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Vacation, Ride, DriverProfile, RideStatus, UserRole, VehicleType
from app.schemas import RideCreate
from app.auth import get_current_active_user
from app.utils import calculate_fare, calculate_distance

router = APIRouter()

def parse_schedule(vacation: Vacation) -> dict:
    """Parse the vacation schedule JSON data"""
    try:
        if vacation.schedule:
            return json.loads(vacation.schedule)
        return {}
    except json.JSONDecodeError:
        return {}

async def schedule_next_ride(db: Session, vacation_id: int) -> Optional[Ride]:
    """Schedule the next ride for a vacation based on current progress"""
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    if not vacation:
        return None

    # Get all existing rides for this vacation
    existing_rides = db.query(Ride).filter(Ride.vacation_id == vacation_id).order_by(Ride.created_at).all()
    ride_count = len(existing_rides)
    
    # Check if the previous ride is completed (unless it's the first ride)
    if ride_count > 0:
        last_ride = existing_rides[-1]
        if last_ride.status != RideStatus.COMPLETED:
            print(f"Cannot schedule next ride. Previous ride {last_ride.id} is not completed (Status: {last_ride.status})")
            return None
    
    # Parse schedule data
    schedule = parse_schedule(vacation)
    flight_details = {}
    if vacation.flight_details:
        try:
            flight_details = json.loads(vacation.flight_details)
        except json.JSONDecodeError:
            pass
            
    activities = []
    if vacation.activities:
        try:
            activities = json.loads(vacation.activities)
        except json.JSONDecodeError:
            pass

    # Determine which ride to create
    new_ride = None

    # City Coordinates Database
    # City Coordinates from constants
    from app.constants import CITY_COORDINATES

    def get_city_coords(city_name):
        if not city_name:
            return (12.9716, 77.5946) # Default to Bangalore
        
        city_lower = city_name.lower().strip()
        if city_lower in CITY_COORDINATES:
            return CITY_COORDINATES[city_lower]
        
        for key, coords in CITY_COORDINATES.items():
            if key in city_lower or city_lower in key:
                return coords
                
        return (12.9716, 77.5946) # Default fallback
    
    # Ride 0: Home -> Airport (Departure from Origin)
    if ride_count == 0:
        if flight_details.get('departureTime'):
            try:
                # Create ride from user's location to airport
                # Origin City logic
                origin_city = flight_details.get('departureCity', 'Bangalore')
                origin_lat, origin_lng = get_city_coords(origin_city)
                
                # Airport is usually ~30km away
                airport_lat = origin_lat + 0.2
                airport_lng = origin_lng + 0.2
                
                pickup_lat = origin_lat
                pickup_lng = origin_lng
                
                distance = calculate_distance(pickup_lat, pickup_lng, airport_lat, airport_lng)
                estimated_fare = calculate_fare(distance, vacation.vehicle_type.value if vacation.vehicle_type else "economy")
                
                new_ride = Ride(
                    rider_id=vacation.user_id,
                    vacation_id=vacation.id,
                    pickup_address="Home",
                    pickup_lat=pickup_lat,
                    pickup_lng=pickup_lng,
                    destination_address=f"{flight_details.get('departureCity', 'Airport')} Airport",
                    destination_lat=airport_lat,
                    destination_lng=airport_lng,
                    vehicle_type=vacation.vehicle_type or VehicleType.ECONOMY,
                    distance_km=distance,
                    duration_minutes=int((distance / 40) * 60),
                    estimated_fare=estimated_fare,
                    scheduled_time=datetime.now(), # Schedule immediately for demo
                    driver_id=vacation.driver_id # Assign to the vacation driver
                )
            except Exception as e:
                print(f"Failed to create departure ride: {e}")

    # Ride 1: Airport -> Hotel (Arrival at Destination)
    elif ride_count == 1:
        if flight_details.get('arrivalTime'):
            try:
                # Create ride from airport to hotel
                dest_city = vacation.destination or flight_details.get('arrivalCity', 'Goa')
                dest_lat, dest_lng = get_city_coords(dest_city)
                
                # Airport location
                airport_lat = dest_lat + 0.2
                airport_lng = dest_lng + 0.2
                
                # Hotel location
                hotel_lat = dest_lat
                hotel_lng = dest_lng
                
                distance = calculate_distance(airport_lat, airport_lng, hotel_lat, hotel_lng)
                estimated_fare = calculate_fare(distance, vacation.vehicle_type.value if vacation.vehicle_type else "economy")
                
                new_ride = Ride(
                    rider_id=vacation.user_id,
                    vacation_id=vacation.id,
                    pickup_address=f"{flight_details.get('arrivalCity', 'Destination')} Airport",
                    pickup_lat=airport_lat,
                    pickup_lng=airport_lng,
                    destination_address=vacation.hotel_name or "Hotel",
                    destination_lat=hotel_lat,
                    destination_lng=hotel_lng,
                    vehicle_type=vacation.vehicle_type or VehicleType.ECONOMY,
                    distance_km=distance,
                    duration_minutes=int((distance / 40) * 60),
                    estimated_fare=estimated_fare,
                    scheduled_time=datetime.now(),
                    driver_id=vacation.driver_id
                )
            except Exception as e:
                print(f"Failed to create arrival ride: {e}")

    # Rides 2 to N+1: Activities (Hotel -> Activity)
    elif ride_count <= len(activities) + 1:
        activity_index = ride_count - 2
        activity = activities[activity_index]
        try:
            dest_city = vacation.destination
            hotel_lat, hotel_lng = get_city_coords(dest_city)
            
            # Activity location randomized around city
            activity_lat = hotel_lat + (0.01 * (activity_index + 1))
            activity_lng = hotel_lng + (0.01 * (activity_index + 1))
            
            distance = calculate_distance(hotel_lat, hotel_lng, activity_lat, activity_lng)
            estimated_fare = calculate_fare(distance, vacation.vehicle_type.value if vacation.vehicle_type else "economy")
            
            new_ride = Ride(
                rider_id=vacation.user_id,
                vacation_id=vacation.id,
                pickup_address=vacation.hotel_name or "Hotel",
                pickup_lat=hotel_lat,
                pickup_lng=hotel_lng,
                destination_address=activity.get('location', 'Activity Location'),
                destination_lat=activity_lat,
                destination_lng=activity_lng,
                vehicle_type=vacation.vehicle_type or VehicleType.ECONOMY,
                distance_km=distance,
                duration_minutes=int((distance / 40) * 60),
                estimated_fare=estimated_fare,
                scheduled_time=datetime.now(),
                driver_id=vacation.driver_id
            )
        except Exception as e:
            print(f"Failed to create activity ride: {e}")

    # Last Ride: Hotel -> Airport (Departure from Destination)
    elif ride_count == len(activities) + 2:
        if flight_details.get('departureTime'):
            try:
                dest_city = vacation.destination or flight_details.get('arrivalCity', 'Goa')
                dest_lat, dest_lng = get_city_coords(dest_city)
                
                hotel_lat = dest_lat
                hotel_lng = dest_lng
                
                airport_lat = dest_lat + 0.2
                airport_lng = dest_lng + 0.2
                
                distance = calculate_distance(hotel_lat, hotel_lng, airport_lat, airport_lng)
                estimated_fare = calculate_fare(distance, vacation.vehicle_type.value if vacation.vehicle_type else "economy")
                
                new_ride = Ride(
                    rider_id=vacation.user_id,
                    vacation_id=vacation.id,
                    pickup_address=vacation.hotel_name or "Hotel",
                    pickup_lat=hotel_lat,
                    pickup_lng=hotel_lng,
                    destination_address=f"{dest_city} Airport",
                    destination_lat=airport_lat,
                    destination_lng=airport_lng,
                    vehicle_type=vacation.vehicle_type or VehicleType.ECONOMY,
                    distance_km=distance,
                    duration_minutes=int((distance / 40) * 60),
                    estimated_fare=estimated_fare,
                    scheduled_time=datetime.now(),
                    driver_id=vacation.driver_id
                )
            except Exception as e:
                print(f"Failed to create return ride: {e}")

    # Final Leg: Origin Airport -> Home
    elif ride_count == len(activities) + 3:
        try:
            origin_city = flight_details.get('departureCity', 'Bangalore')
            origin_lat, origin_lng = get_city_coords(origin_city)
            
            airport_lat = origin_lat + 0.2
            airport_lng = origin_lng + 0.2
            
            home_lat = origin_lat
            home_lng = origin_lng
            
            distance = calculate_distance(airport_lat, airport_lng, home_lat, home_lng)
            estimated_fare = calculate_fare(distance, vacation.vehicle_type.value if vacation.vehicle_type else "economy")
            
            new_ride = Ride(
                rider_id=vacation.user_id,
                vacation_id=vacation.id,
                pickup_address=f"{origin_city} Airport",
                pickup_lat=airport_lat,
                pickup_lng=airport_lng,
                destination_address="Home",
                destination_lat=home_lat,
                destination_lng=home_lng,
                vehicle_type=vacation.vehicle_type or VehicleType.ECONOMY,
                distance_km=distance,
                duration_minutes=int((distance / 40) * 60),
                estimated_fare=estimated_fare,
                scheduled_time=datetime.now(),
                driver_id=vacation.driver_id
            )
            print(f"Created final leg: {origin_city} Airport -> Home")
        except Exception as e:
            print(f"Failed to create final home ride: {e}")

    # All ride legs completed
    elif ride_count > len(activities) + 3:
        # Check if the last ride is completed
        if existing_rides and existing_rides[-1].status == RideStatus.COMPLETED:
            print(f"All rides completed for vacation {vacation_id}. Updating status.")
            vacation.status = "completed"
            db.commit()
            return None

    if new_ride:
        try:
            db.add(new_ride)
            db.commit()
            db.refresh(new_ride)
            print(f"Scheduled next ride for vacation {vacation_id}: {new_ride.id}")
            
            # Notify drivers about the new ride
            try:
                from app.websocket import manager
                await manager.send_personal_message({
                    "type": "new_ride_request",
                    "ride_id": new_ride.id,
                    "pickup_address": new_ride.pickup_address,
                    "destination_address": new_ride.destination_address,
                    "distance_km": new_ride.distance_km,
                    "estimated_fare": new_ride.estimated_fare,
                    "vehicle_type": new_ride.vehicle_type.value if new_ride.vehicle_type else "economy"
                }, int(new_ride.driver_id))
                print(f"Sent new ride request notification to driver {new_ride.driver_id}")
            except Exception as e:
                print(f"Failed to send WebSocket notification: {e}")
                
            return new_ride
        except Exception as e:
            db.rollback()
            print(f"Failed to save new ride: {e}")
            return None
            
    return None

@router.post("/vacation/{vacation_id}/schedule-rides")
async def schedule_vacation_rides(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually trigger scheduling of next ride (for testing/admin)"""
    ride = await schedule_next_ride(db, vacation_id)
    
    if ride:
        return {
            "message": "Next ride scheduled successfully",
            "ride": ride
        }
    else:
        return {
            "message": "No more rides to schedule for this vacation",
            "ride": None
        }