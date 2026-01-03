from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, DriverProfile

def teleport_driver():
    db = SessionLocal()
    try:
        email = "driver4@voyago.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user and user.driver_profile:
            print(f"Driver: {user.name}")
            print(f"Old Loc: ({user.driver_profile.current_lat}, {user.driver_profile.current_lng})")
            
            # Taj Exotica, Goa approx coords
            new_lat = 15.242 
            new_lng = 73.933
            
            user.driver_profile.current_lat = new_lat
            user.driver_profile.current_lng = new_lng
            
            # Also ensure City is Goa
            user.driver_profile.city = "Goa"
            
            db.commit()
            print(f"New Loc: ({user.driver_profile.current_lat}, {user.driver_profile.current_lng})")
            print("Teleport Successful! 🚀")
        else:
            print(f"User {email} not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    teleport_driver()
