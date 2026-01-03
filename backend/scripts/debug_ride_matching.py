import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models import User, Ride, DriverProfile, RideStatus, UserRole
from sqlalchemy import and_

def debug_matching():
    db = SessionLocal()
    try:
        print("\n=== DEBUGGING RIDE MATCHING ===\n")

        # 1. PENDING RIDES
        pending_rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING).all()
        print(f"--- PENDING RIDES ({len(pending_rides)}) ---")
        for r in pending_rides:
            print(f"Ride ID: {r.id}")
            print(f"  - Pickup: {r.pickup_address}")
            print(f"  - Vehicle Type: {r.vehicle_type} (Val: {r.vehicle_type.value if hasattr(r.vehicle_type, 'value') else r.vehicle_type})")
            print(f"  - Status: {r.status}")
            print("")

        # 2. ONLINE DRIVERS
        online_drivers = db.query(User).join(DriverProfile).filter(
            and_(
                User.role == UserRole.DRIVER,
                DriverProfile.is_available == True
            )
        ).all()
        
        print(f"--- ONLINE DRIVERS ({len(online_drivers)}) ---")
        for d in online_drivers:
            print(f"Driver ID: {d.id} ({d.name})")
            print(f"  - City: '{d.driver_profile.city}'")
            print(f"  - Vehicle Type: {d.driver_profile.vehicle_type} (Val: {d.driver_profile.vehicle_type.value if hasattr(d.driver_profile.vehicle_type, 'value') else d.driver_profile.vehicle_type})")
            print(f"  - Lat/Lng: {d.driver_profile.current_lat}, {d.driver_profile.current_lng}")
            print("")
            
        # 3. MATCHING ANALYSIS
        print("--- MATCHING ANALYSIS ---")
        for r in pending_rides:
            print(f"Checking Ride {r.id} matches:")
            ride_type_str = str(r.vehicle_type.value if hasattr(r.vehicle_type, 'value') else r.vehicle_type).lower()
            
            for d in online_drivers:
                match = True
                fail_reason = []
                
                # Check Type
                driver_type_str = str(d.driver_profile.vehicle_type.value if hasattr(d.driver_profile.vehicle_type, 'value') else d.driver_profile.vehicle_type).lower()
                if ride_type_str != driver_type_str:
                    match = False
                    fail_reason.append(f"Type Mismatch ({ride_type_str} != {driver_type_str})")
                
                # Check City
                driver_city = (d.driver_profile.city or "").strip().lower()
                pickup_lower = (r.pickup_address or "").lower()
                if driver_city and driver_city not in pickup_lower:
                    match = False
                    fail_reason.append(f"City Mismatch ('{driver_city}' not in '{pickup_lower}')")
                    
                if match:
                    print(f"  [MATCH] Driver {d.id} SHOULD see this ride.")
                else:
                    print(f"  [NO MATCH] Driver {d.id}: {', '.join(fail_reason)}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_matching()
