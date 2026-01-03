from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, User, DriverProfile
import re

def check_mismatch():
    db = SessionLocal()
    try:
        # Get Ride #9 (or latest pending)
        ride = db.query(Ride).order_by(Ride.id.desc()).first()
        print(f"Latest Ride ID: {ride.id}")
        print(f"Pickup: '{ride.pickup_address}'")
        print(f"Vehicle Type: {ride.vehicle_type}")
        
        # Get Driver 4
        driver = db.query(User).filter(User.email == "driver4@voyago.com").first()
        print(f"Driver: {driver.name}")
        if driver.driver_profile:
            print(f"Driver City: '{driver.driver_profile.city}'")
            print(f"Driver Vehicle: {driver.driver_profile.vehicle_type}")
            
            # Simulate Token Match
            def get_tokens(text):
                return {w.lower() for w in re.split(r'[\s,-]+', str(text)) if len(w) > 2}
            
            r_tokens = get_tokens(ride.pickup_address)
            d_tokens = get_tokens(driver.driver_profile.city)
            overlap = r_tokens.intersection(d_tokens)
            print(f"Ride Tokens: {r_tokens}")
            print(f"Driver Tokens: {d_tokens}")
            print(f"Overlap: {overlap}")
            print(f"Match would be: {len(overlap) > 0}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_mismatch()
