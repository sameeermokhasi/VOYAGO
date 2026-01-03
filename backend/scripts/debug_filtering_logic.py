import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User, Ride, DriverProfile, RideStatus, UserRole
from sqlalchemy import and_

def debug_filtering():
    db = SessionLocal()
    try:
        print("\n=== DEBUGGING FILTERING LOGIC ===\n")

        # 1. Inspect PENDING RIDES
        pending_rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING).all()
        print(f"--- PENDING RIDES ({len(pending_rides)}) ---")
        for r in pending_rides:
            print(f"Ride ID: {r.id}")
            print(f"  - Pickup Address: '{r.pickup_address}'")
            print(f"  - Lowercase: '{r.pickup_address.lower() if r.pickup_address else ''}'")
            print("")

        # 2. Inspect ONLINE DRIVERS
        online_drivers = db.query(User).join(DriverProfile).filter(
            and_(
                User.role == UserRole.DRIVER,
                DriverProfile.is_available == True
            )
        ).all()
        
        print(f"--- ONLINE DRIVERS ({len(online_drivers)}) ---")
        for d in online_drivers:
            city = d.driver_profile.city
            print(f"Driver ID: {d.id} ({d.name})")
            print(f"  - City: '{city}'")
            print(f"  - Lowercase: '{city.strip().lower() if city else ''}'")
            
            # Simulate matching logic
            print("  [MATCHING TEST]")
            for r in pending_rides:
                driver_city_clean = city.strip().lower() if city else ""
                pickup_clean = r.pickup_address.lower() if r.pickup_address else ""
                
                match1 = driver_city_clean in pickup_clean
                match2 = pickup_clean in driver_city_clean
                
                print(f"    vs Ride {r.id}: Match1({driver_city_clean} in {pickup_clean})={match1}, Match2({pickup_clean} in {driver_city_clean})={match2} -> FINAL: {match1 or match2}")
            print("")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_filtering()
