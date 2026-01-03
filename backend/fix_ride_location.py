from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Ride, RideStatus

def fix_ride():
    db = SessionLocal()
    try:
        # Get pending ride
        ride = db.query(Ride).filter(Ride.status == RideStatus.PENDING).first()
        
        if ride:
            print(f"Ride {ride.id}: {ride.pickup_address}")
            print(f"Old Loc: ({ride.pickup_lat}, {ride.pickup_lng})")
            
            # Taj Exotica, Goa
            new_lat = 15.242
            new_lng = 73.933
            
            ride.pickup_lat = new_lat
            ride.pickup_lng = new_lng
            
            db.commit()
            print(f"New Loc: ({ride.pickup_lat}, {ride.pickup_lng})")
            print("Ride Teleport Successful! 🚀")
        else:
            print("No pending ride found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_ride()
