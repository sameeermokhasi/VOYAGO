from app.database import SessionLocal
from app.models import Ride, User
from app.schemas import RideResponse, UserResponse
from pydantic import ValidationError
import sys

def debug_specific():
    db = SessionLocal()
    try:
        # Check User
        user = db.query(User).get(1) # Sameer
        if user:
            print(f"Checking User {user.id}...", flush=True)
            try:
                UserResponse.model_validate(user)
                print("✅ User Valid", flush=True)
            except Exception as e:
                print(f"❌ User Invalid: {e}", flush=True)

        # Check Ride 9
        r = db.query(Ride).get(9)
        if r:
            print(f"Checking Ride {r.id}...", flush=True)
            try:
                RideResponse.model_validate(r)
                print("✅ Ride 9 Valid", flush=True)
            except Exception as e:
                print(f"❌ Ride 9 Invalid: {e}", flush=True)
        else:
            print("Ride 9 not found", flush=True)

    except Exception as e:
        print(f"Global Error: {e}", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    debug_specific()
