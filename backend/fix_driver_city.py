from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, DriverProfile

def fix_driver_city():
    db = SessionLocal()
    try:
        # Update Test Driver 4 (driver4@voyago.com)
        email = "driver4@voyago.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user and user.driver_profile:
            print(f"Updating Driver {user.name} City from '{user.driver_profile.city}' to 'Goa'")
            user.driver_profile.city = "Goa"
            db.commit()
            print("Update Successful!")
        else:
            print(f"User {email} or profile not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_driver_city()
