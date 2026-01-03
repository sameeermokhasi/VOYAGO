from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, User, DriverProfile, RideStatus

def move_ride_to_driver():
    db = SessionLocal()
    try:
        # Get pending ride
        ride = db.query(Ride).filter(Ride.status == RideStatus.PENDING).first()
        
        # Get Driver
        driver = db.query(User).filter(User.email == "driver4@voyago.com").first()
        
        if ride and driver and driver.driver_profile:
            d_lat = driver.driver_profile.current_lat
            d_lng = driver.driver_profile.current_lng
            
            print(f"Driver Loc: ({d_lat}, {d_lng})")
            print(f"Old Ride Loc: ({ride.pickup_lat}, {ride.pickup_lng})")
            
            if d_lat is None: 
                print("Driver location is None!")
                return
                
            # Move ride to Driver + 0.002 degrees (approx 200m)
            new_lat = float(d_lat) + 0.002
            new_lng = float(d_lng) + 0.002
            
            ride.pickup_lat = new_lat
            ride.pickup_lng = new_lng
            ride.pickup_address = "Near Driver Location (Debug)"
            
            db.commit()
            print(f"New Ride Loc: ({ride.pickup_lat}, {ride.pickup_lng})")
            print("Ride Moved to Driver! 🚗💨")
        else:
            print("Driver or Ride not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    move_ride_to_driver()
