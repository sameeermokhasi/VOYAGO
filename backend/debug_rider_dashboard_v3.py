from app.database import SessionLocal
from app.models import Ride, User
from app.schemas import RideResponse
from pydantic import ValidationError
import sys

def debug_rides():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.name.ilike("%Sameer%")).first()
        if not user: return
            
        # Get rides ordered by newest first
        rides = db.query(Ride).filter(Ride.rider_id == user.id).order_by(Ride.id.desc()).all()
        print(f"User {user.id} has {len(rides)} rides. Checking newest 5:", flush=True)
        
        for r in rides[:5]:
            print(f"--- Checking Ride {r.id} ---", flush=True)
            try:
                RideResponse.model_validate(r)
                print(f"✅ VALID (Status: {r.status})", flush=True)
            except ValidationError as e:
                print(f"❌ VALIDATION ERROR: {e}", flush=True)
            except Exception as e:
                print(f"❌ CRITICAL ERROR: {e}", flush=True)

    except Exception as e:
        print(f"Global Error: {e}", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    debug_rides()
