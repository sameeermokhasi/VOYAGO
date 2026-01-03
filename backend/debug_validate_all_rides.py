from app.database import SessionLocal
from app.models import Ride, User
from app.schemas import RideResponse
import sys

def check_all():
    db = SessionLocal()
    try:
        user = db.query(User).get(1)
        rides = db.query(Ride).filter(Ride.rider_id == user.id).all()
        print(f"Total rides for User 1: {len(rides)}")
        
        for r in rides:
            try:
                RideResponse.model_validate(r)
                print(f"Ride {r.id}: OK")
            except Exception as e:
                print(f"Ride {r.id}: FAIL - {e}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_all()
