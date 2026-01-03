from app.database import SessionLocal
from app.models import User, UserRole, DriverProfile, LoyaltyPoints
from app.auth import get_password_hash

def create_test_users():
    db = SessionLocal()
    
    # Define test users
    users = [
        {
            "email": "admin@voyago.com",
            "name": "Admin User",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "phone": "0000000000"
        },
        {
            "email": "rider1@test.com",
            "name": "Test Rider 1",
            "password": "test123",
            "role": UserRole.RIDER,
            "phone": "1111111111"
        },
        {
            "email": "rider2@test.com",
            "name": "Test Rider 2",
            "password": "test123",
            "role": UserRole.RIDER,
            "phone": "2222222222"
        },
        {
            "email": "driver1@test.com",
            "name": "Test Driver 1 (SUV)",
            "password": "test123",
            "role": UserRole.DRIVER,
            "phone": "3333333333",
            "car_details": {
                "license_number": "TESTDL01",
                "vehicle_type": "suv",
                "vehicle_model": "Toyota Innova",
                "vehicle_plate": "KA01AB1234",
                "vehicle_color": "White",
                "city": "Bangalore"
            }
        },
        {
            "email": "driver2@test.com",
            "name": "Test Driver 2 (Economy)",
            "password": "test123",
            "role": UserRole.DRIVER,
            "phone": "4444444444",
            "car_details": {
                "license_number": "TESTDL02",
                "vehicle_type": "economy",
                "vehicle_model": "Swift Dzire",
                "vehicle_plate": "KA02XY5678",
                "vehicle_color": "Silver",
                "city": "Mumbai"
            }
        },
        {
            "email": "driver3@test.com",
            "name": "Test Driver 3 (Premium)",
            "password": "test123",
            "role": UserRole.DRIVER,
            "phone": "5555555555",
            "car_details": {
                "license_number": "TESTDL03",
                "vehicle_type": "luxury",
                "vehicle_model": "Mercedes E-Class",
                "vehicle_plate": "KA03PR9999",
                "vehicle_color": "Black",
                "city": "Bangalore"
            }
        }
    ]

    print("Creating/Updating Test Users...\n")

    for u in users:
        # Check if exists
        existing = db.query(User).filter(User.email == u["email"]).first()
        
        if existing:
            # Update password and activate
            existing.password = get_password_hash(u["password"])
            existing.is_active = True
            existing.is_verified = True
            existing.role = u["role"]
            print(f"Updated existing user: {u['email']}")
            db.commit()
        else:
            # Create new
            new_user = User(
                email=u["email"],
                name=u["name"],
                password=get_password_hash(u["password"]),
                phone=u["phone"],
                role=u["role"],
                is_active=True,
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"Created new user: {u['email']}")
            
            # Add aux data
            if u["role"] == UserRole.RIDER:
                lp = LoyaltyPoints(user_id=new_user.id)
                db.add(lp)
                
            elif u["role"] == UserRole.DRIVER:
                # Check for existing profile
                dp = db.query(DriverProfile).filter(DriverProfile.user_id == new_user.id).first()
                if not dp:
                    dp = DriverProfile(
                        user_id=new_user.id,
                        license_number=u["car_details"]["license_number"],
                        vehicle_type=u["car_details"]["vehicle_type"],
                        vehicle_model=u["car_details"]["vehicle_model"],
                        vehicle_plate=u["car_details"]["vehicle_plate"],
                        vehicle_color=u["car_details"]["vehicle_color"],
                        city=u["car_details"]["city"],
                        is_available=True # Make them ready to go
                    )
                    db.add(dp)
            
            db.commit()

    print("\nDone! All 5 users are ready.")

if __name__ == "__main__":
    create_test_users()
