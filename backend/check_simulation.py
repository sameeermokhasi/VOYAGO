from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import time

from app.config import settings

# Use the correct DB
SQLALCHEMY_DATABASE_URL = settings.database_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_simulation():
    db = SessionLocal()
    try:
        print("=== CHECKING ACTIVE RIDE STATUS ===")
        
        # 1. Get Active Ride
        ride = db.execute(text("SELECT id, driver_id, status, pickup_address, destination_address FROM rides WHERE status IN ('accepted', 'in_progress')")).fetchone()
        
        if not ride:
            print("No active ride found!")
            return
            
        print(f"Active Ride ID: {ride[0]}")
        print(f"Assigned Driver ID: {ride[1]}")
        print(f"Status: {ride[2]}")
        print(f"Route: {ride[3]} -> {ride[4]}")
        
        driver_id = ride[1]
        
        # 2. Check Driver Location Loop
        print("\nMonitoring Driver Location for 10 seconds...")
        for i in range(5):
            profile = db.execute(text("SELECT current_lat, current_lng, is_available FROM driver_profiles WHERE user_id = :uid"), {"uid": driver_id}).fetchone()
            if profile:
                print(f"Time {i*2}s: Lat={profile[0]}, Lng={profile[1]}, Online={profile[2]}")
            else:
                print("Driver profile not found!")
            
            time.sleep(2)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_simulation()
