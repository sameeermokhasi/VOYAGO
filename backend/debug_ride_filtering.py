from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, User, DriverProfile, RideStatus
from app.utils import calculate_distance
import re

def debug_filtering_logic():
    db = SessionLocal()
    try:
        print("=== DEBUGGING RIDE VISIBILITY ===")
        
        # 1. Get Driver
        driver = db.query(User).filter(User.email == "driver4@voyago.com").first()
        if not driver or not driver.driver_profile:
            print("Driver 4 not found or has no profile.")
            return

        stmt_driver = f"Driver: {driver.name} (ID: {driver.id})"
        print(stmt_driver)
        driver_city = (driver.driver_profile.city or "").strip().lower()
        print(f"Driver City: '{driver_city}'")
        d_lat = driver.driver_profile.current_lat
        d_lng = driver.driver_profile.current_lng
        print(f"Driver Location: ({d_lat}, {d_lng})")
        d_vehicle_type = driver.driver_profile.vehicle_type
        print(f"Driver Vehicle: {d_vehicle_type} (Type: {type(d_vehicle_type)})")

        # 2. Get Pending Rides
        rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING, Ride.driver_id == None).all()
        print(f"\nFound {len(rides)} pending rides.")
        
        for r in rides:
            print(f"\n--- Checking Ride ID {r.id} ---")
            print(f"Pickup: '{r.pickup_address}'")
            print(f"Ride Vehicle: {r.vehicle_type} (Type: {type(r.vehicle_type)})")
            print(f"Ride Location: ({r.pickup_lat}, {r.pickup_lng})")
            
            # CHECK 1: Vehicle Type
            d_type_str = str(d_vehicle_type.value if hasattr(d_vehicle_type, 'value') else d_vehicle_type).lower()
            r_type_str = str(r.vehicle_type.value if hasattr(r.vehicle_type, 'value') else r.vehicle_type).lower()
            
            type_match = d_type_str == r_type_str
            print(f"Vehicle Match? '{d_type_str}' == '{r_type_str}' -> {type_match}")
            
            if not type_match:
                print(">>> FILTERED OUT by Vehicle Type")
                continue

            # CHECK 2: Location (Hybrid)
            # A. String Match
            def get_tokens(text):
                return {w.lower() for w in re.split(r'[\s,-]+', str(text)) if len(w) > 2}
            
            d_tokens = get_tokens(driver_city)
            r_tokens = get_tokens(r.pickup_address)
            string_match = len(d_tokens.intersection(r_tokens)) > 0
            print(f"String Match? {d_tokens} vs {r_tokens} -> {string_match}")
            
            # B. GPS Match
            dist_match = False
            dist = None
            if d_lat is not None and d_lng is not None and r.pickup_lat is not None and r.pickup_lng is not None:
                try:
                    dist = calculate_distance(float(d_lat), float(d_lng), float(r.pickup_lat), float(r.pickup_lng))
                    print(f"Distance: {dist} km")
                    if dist <= 50.0:
                        dist_match = True
                except Exception as e:
                    print(f"Dist Calc Error: {e}")
            else:
                print("Coordinates missing for distance calc.")
                
            print(f"GPS Match? {dist_match}")
            
            if string_match or dist_match:
                print(">>> RIDE SHOULD BE VISIBLE ✅")
            else:
                print(">>> FILTERED OUT by Location ❌")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_filtering_logic()
