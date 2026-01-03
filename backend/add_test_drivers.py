import sys
import os
import random
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, DriverProfile, UserRole, VehicleType
from app.auth import get_password_hash

def add_drivers():
    db = SessionLocal()
    try:
        print("Adding 10 test drivers...")
        
        # Bangalore Center
        base_lat = 12.9716
        base_lng = 77.5946
        
        vehicle_types = [
            VehicleType.ECONOMY, VehicleType.ECONOMY, VehicleType.ECONOMY, VehicleType.ECONOMY,
            VehicleType.SUV, VehicleType.SUV, VehicleType.SUV,
            VehicleType.LUXURY, VehicleType.LUXURY,
            VehicleType.PREMIUM
        ]
        
        # Start from 3 since we likely have Driver 1 and 2
        start_index = 3
        
        for i in range(10):
            idx = start_index + i
            name = f"Test Driver {idx}"
            email = f"driver{idx}@voyago.com"
            v_type = vehicle_types[i % len(vehicle_types)]
            
            # Check if exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"User {email} already exists. Skipping.")
                continue
                
            # Random location within ~5-10km
            lat_offset = random.uniform(-0.05, 0.05)
            lng_offset = random.uniform(-0.05, 0.05)
            
            user = User(
                name=name,
                email=email,
                password=get_password_hash("password123"),
                role=UserRole.DRIVER,
                is_active=True,
                is_verified=True,
                phone=f"99999999{idx:02d}"
            )
            db.add(user)
            db.flush() # get ID
            
            driver_profile = DriverProfile(
                user_id=user.id,
                license_number=f"DL-KA-0{idx}-123456789",
                vehicle_type=v_type,
                vehicle_model=f"{v_type.value.title()} Car Model",
                vehicle_plate=f"KA-0{idx}-AB-{1000+idx}",
                city="Bangalore",
                is_available=True,
                current_lat=base_lat + lat_offset,
                current_lng=base_lng + lng_offset,
                rating=round(random.uniform(4.0, 5.0), 1),
                total_rides=random.randint(0, 50)
            )
            db.add(driver_profile)
            print(f"Added {name} ({v_type.value}) at {driver_profile.current_lat:.4f}, {driver_profile.current_lng:.4f}")
            
        db.commit()
        print("Successfully added drivers!")
        
    except Exception as e:
        print(f"Error adding drivers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_drivers()
