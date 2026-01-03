import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Ride, RideStatus, Vacation

def clear_pending_requests():
    db = SessionLocal()
    try:
        print("Clearing pending requests...")
        
        # Delete pending rides
        deleted_rides = db.query(Ride).filter(Ride.status == RideStatus.PENDING).delete()
        print(f"Deleted {deleted_rides} pending rides.")
        
        # Delete pending vacations
        # Note: Vacation status is a string "pending"
        deleted_vacations = db.query(Vacation).filter(Vacation.status == "pending").delete()
        print(f"Deleted {deleted_vacations} pending vacations.")
        
        db.commit()
        print("Successfully cleared all pending requests.")
        
    except Exception as e:
        print(f"Error clearing requests: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_pending_requests()
