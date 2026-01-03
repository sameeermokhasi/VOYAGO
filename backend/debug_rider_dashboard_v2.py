from app.database import SessionLocal
from app.models import Ride, User
from app.schemas import RideResponse
from pydantic import ValidationError
import sys

def debug_rides():
    db = SessionLocal()
    try:
        # Get Sameer
        user = db.query(User).filter(User.name.ilike("%Sameer%")).first()
        if not user:
            print("User not found", flush=True)
            return
            
        print(f"User: {user.name} ({user.id})", flush=True)
        
        rides = db.query(Ride).filter(Ride.rider_id == user.id).all()
        print(f"Found {len(rides)} rides.", flush=True)
        
        for r in rides:
            print(f"--- Checking Ride {r.id} ---", flush=True)
            try:
                # Inspect raw model fields first
                print(f"Status: {r.status!r}", flush=True)
                print(f"Vehicle: {r.vehicle_type!r}", flush=True)
                print(f"Dates: Created={r.created_at} Scheduled={r.scheduled_time}", flush=True)
                
                # Check Relationships
                print(f"Rider Rel: {r.rider.name if r.rider else 'None'}", flush=True)
                print(f"Driver Rel: {r.driver.name if r.driver else 'None'}", flush=True) # Potential lazy load issue?

                # Validate
                RideResponse.model_validate(r)
                print(f"✅ VALID", flush=True)
                
            except ValidationError as e:
                print(f"❌ VALIDATION ERROR: {e}", flush=True)
            except Exception as e:
                print(f"❌ ERROR: {e}", flush=True)
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"Global Error: {e}", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    debug_rides()
