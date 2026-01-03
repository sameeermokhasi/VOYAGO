from app.database import SessionLocal
from app.models import Ride, User
from app.schemas import RideResponse
from pydantic import ValidationError

def debug_rides():
    db = SessionLocal()
    try:
        # 1. Find the correct user "Sameer Mokhasi"
        # Search by name loosely
        users = db.query(User).filter(User.name.ilike("%Sameer%")).all()
        
        if not users:
            print("No user found with name 'Sameer'. Listing all users:")
            all_users = db.query(User).all()
            for u in all_users:
                print(f" - {u.id}: {u.name} ({u.email})")
            return

        target_user = users[0]
        print(f"Testing for User: {target_user.name} ({target_user.id}) Email: {target_user.email}")
        
        # 2. Query rides for this rider
        rides = db.query(Ride).filter(Ride.rider_id == target_user.id).all()
        print(f"Found {len(rides)} rides.")

        # 3. Try to validate each ride
        for r in rides:
            print(f"Checking Ride {r.id}...")
            try:
                # Manually validate against schema
                data = RideResponse.model_validate(r)
                print(f" -> Valid! Status: {data.status}, Vehicle: {data.vehicle_type}")
            except ValidationError as e:
                print(f" -> VALIDATION ERROR for Ride {r.id}: {e}")
            except Exception as e:
                 print(f" -> UNKNOWN ERROR for Ride {r.id}: {e}")

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_rides()
