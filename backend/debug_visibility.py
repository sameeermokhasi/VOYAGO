from app.database import SessionLocal
from app.models import User, Ride, DriverProfile, RideStatus

def debug_visibility():
    db = SessionLocal()
    try:
        # 1. Get the driver
        # Assuming "Test Driver 4" from screenshot, but let's list all online drivers
        drivers = db.query(User).filter(User.name.contains("Test Driver 4")).all()
        
        print("\n=== DRIVER PROFILES ===")
        if not drivers:
            print("No driver named 'Test Driver 4' found.")
            drivers = db.query(User).join(DriverProfile).all() # Fallback list all
            
        for d in drivers:
            print(f"Driver ID: {d.id} | Name: {d.name}")
            if d.driver_profile:
                print(f"  - City: '{d.driver_profile.city}'")
                print(f"  - Vehicle: '{d.driver_profile.vehicle_type}'")
            else:
                print("  - No Driver Profile!")

        # 2. Get Pending Rides
        rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING).all()
        print("\n=== PENDING RIDES ===")
        if not rides:
            print("No PENDING rides found!")
        
        for r in rides:
            print(f"Ride ID: {r.id} | Status: {r.status}")
            print(f"  - Pickup: '{r.pickup_address}'")
            print(f"  - Vehicle Required: '{r.vehicle_type}'")
            
            # Simulate matching for 'Test Driver 4' (first one found)
            if drivers:
                driver = drivers[0]
                if driver.driver_profile:
                    # Vehicle Match
                    d_type = str(driver.driver_profile.vehicle_type).lower() if driver.driver_profile.vehicle_type else "none"
                    r_type = str(r.vehicle_type.value if hasattr(r.vehicle_type, 'value') else r.vehicle_type).lower()
                    v_match = d_type == r_type
                    
                    # City Match
                    d_city = str(driver.driver_profile.city).strip().lower() if driver.driver_profile.city else ""
                    r_pickup = str(r.pickup_address).lower()
                    c_match = d_city in r_pickup if d_city else False
                    
                    print(f"  -> Match w/ Driver {driver.id} ({d_city}, {d_type})?")
                    print(f"     [Vehicle] {d_type} == {r_type}? {'PASS' if v_match else 'FAIL'}")
                    print(f"     [City]    '{d_city}' in '{r_pickup}'? {'PASS' if c_match else 'FAIL'}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_visibility()
