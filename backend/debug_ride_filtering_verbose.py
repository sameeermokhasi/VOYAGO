from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, User, DriverProfile, RideStatus
from app.utils import calculate_distance
import re

def debug_filtering_logic_verbose():
    db = SessionLocal()
    try:
        print("=== VERBOSE DEBUG ===")
        
        # 1. Driver
        driver = db.query(User).filter(User.email == "driver4@voyago.com").first()
        dp = driver.driver_profile
        d_lat = dp.current_lat
        d_lng = dp.current_lng
        print(f"Driver Name: {driver.name}")
        print(f"Driver Coords: {d_lat}, {d_lng} (Types: {type(d_lat)}, {type(d_lng)})")
        
        # 2. Ride
        ride = db.query(Ride).filter(Ride.status == RideStatus.PENDING).first()
        if not ride:
            print("No pending ride!")
            return
            
        r_lat = ride.pickup_lat
        r_lng = ride.pickup_lng
        print(f"Ride ID: {ride.id}")
        print(f"Ride Coords: {r_lat}, {r_lng} (Types: {type(r_lat)}, {type(r_lng)})")
        
        # 3. Distance Calc
        print("--- Calculating Distance ---")
        try:
            lat1, lng1 = float(d_lat), float(d_lng)
            lat2, lng2 = float(r_lat), float(r_lng)
            print(f"Inputs: ({lat1}, {lng1}) to ({lat2}, {lng2})")
            
            dist = calculate_distance(lat1, lng1, lat2, lng2)
            print(f"CALCULATED DISTANCE: {dist} km")
            
            if dist <= 50.0:
                print(">>> DISTANCE CHECK PASSED ✅")
            else:
                print(f">>> DISTANCE CHECK FAILED ({dist} > 50) ❌")
        except Exception as e:
            print(f"!!! Error in Calc: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_filtering_logic_verbose()
