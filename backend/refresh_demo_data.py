from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random

from app.config import settings

# Database URL (Dynamic from config)
SQLALCHEMY_DATABASE_URL = settings.database_url
print(f"Using Database: {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30} # Add 30s timeout for locking
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def refresh_data():
    db = SessionLocal()
    try:
        print("=== REFRESHING DEMO DATA TO TODAY (22/12/2025) ===")
        
        # 1. Update Recent Rides to Today
        # We'll take the last 10 rides and shift their dates to today
        # preserving the time usage pattern
        
        now = datetime.now()
        today_start = now.replace(hour=8, minute=0, second=0, microsecond=0)
        
        # Execute raw SQL for speed/simplicity in this script
        # Update completed rides to be earlier today
        db.execute(text(f"UPDATE rides SET created_at = '{today_start}' WHERE status = 'completed'"))
        db.execute(text(f"UPDATE rides SET completed_at = '{now}' WHERE status = 'completed'"))
        
        print("Updated completed rides to today.")

        # 2. Ensure Active Ride in Goa exists
        # Check if there is an active ride
        result = db.execute(text("SELECT id FROM rides WHERE status IN ('accepted', 'in_progress')")).fetchone()
        
        if not result:
            print("No active ride found. Creating a DEMO RIDE in GOA...")
            
            # Find a rider and driver
            rider = db.execute(text("SELECT id FROM users WHERE role='rider' LIMIT 1")).fetchone()
            driver = db.execute(text("SELECT id FROM users WHERE role='driver' LIMIT 1")).fetchone()
            
            if rider and driver:
                # Create a ride in Goa (Panaji -> Calangute)
                pickup_lat = 15.4909
                pickup_lng = 73.8278
                dest_lat = 15.5442
                dest_lng = 73.7558
                
                query = text("""
                    INSERT INTO rides (
                        rider_id, driver_id, pickup_address, pickup_lat, pickup_lng, 
                        destination_address, destination_lat, destination_lng, 
                        status, vehicle_type, estimated_fare, created_at, started_at
                    ) VALUES (
                        :rider_id, :driver_id, 'Panaji Bus Stand, Goa', :pickup_lat, :pickup_lng,
                        'Calangute Beach, Goa', :dest_lat, :dest_lng,
                        'in_progress', 'suv', 450.0, :created_at, :started_at
                    )
                """)
                
                db.execute(query, {
                    "rider_id": rider[0],
                    "driver_id": driver[0],
                    "pickup_lat": pickup_lat,
                    "pickup_lng": pickup_lng,
                    "dest_lat": dest_lat,
                    "dest_lng": dest_lng,
                    "created_at": now,
                    "started_at": now
                })
                
                # Update Driver Location to near pickup
                db.execute(text("UPDATE driver_profiles SET current_lat = :lat, current_lng = :lng WHERE user_id = :uid"), {
                    "lat": pickup_lat + 0.001,
                    "lng": pickup_lng + 0.001,
                    "uid": driver[0]
                })
                
                print("Created Demo Ride in Goa!")
            else:
                print("Error: Need at least 1 rider and 1 driver in DB.")
        else:
            print(f"Active ride #{result[0]} already exists.")
            
        db.commit()
        print("=== DATA REFRESH COMPLETE ===")
        
    except Exception as e:
        print(f"Error refreshing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    refresh_data()
