from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, DriverProfile

def check_driver_city():
    db = SessionLocal()
    try:
        # Check Test Driver 4 (driver4@voyago.com)
        email = "driver4@voyago.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User: {user.name}")
            print(f"User Address: '{user.address}'")
            if user.driver_profile:
                print(f"Driver City: '{user.driver_profile.city}'")
                print(f"Driver Lat/Lng: {user.driver_profile.current_lat}, {user.driver_profile.current_lng}")
            else:
                print("No Driver Profile found!")
        else:
            print(f"User {email} not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_driver_city()
