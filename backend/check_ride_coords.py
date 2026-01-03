from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, User, DriverProfile, RideStatus

def check_coords():
    db = SessionLocal()
    try:
        # Get pending rides
        rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING).all()
        print(f"Checking {len(rides)} pending rides:")
        for r in rides:
            print(f"Ride {r.id}: '{r.pickup_address}' -> ({r.pickup_lat}, {r.pickup_lng})")

        # Check Driver
        driver = db.query(User).filter(User.email == "driver4@voyago.com").first()
        if driver.driver_profile:
             print(f"Driver {driver.name}: ({driver.driver_profile.current_lat}, {driver.driver_profile.current_lng})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_coords()
