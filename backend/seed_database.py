"""
Database seeder script to populate initial data
Run this after creating the database
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import City, User, UserRole, LoyaltyPoints
from app.auth import get_password_hash

def seed_cities(db: Session):
    """Add sample cities for intercity rides"""
    cities = [
        # Major Metro Cities
        {"name": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
        {"name": "Delhi", "state": "Delhi NCR", "lat": 28.7041, "lng": 77.1025},
        {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
        {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639},
        {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
        {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
        {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
        {"name": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714},
        {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
        {"name": "Goa", "state": "Goa", "lat": 15.2993, "lng": 74.1240},
        
        # Bangalore Local Areas
        {"name": "Indiranagar", "state": "Karnataka", "lat": 12.9719, "lng": 77.6412},
        {"name": "Koramangala", "state": "Karnataka", "lat": 12.9352, "lng": 77.6245},
        {"name": "Whitefield", "state": "Karnataka", "lat": 12.9698, "lng": 77.7500},
        {"name": "HSR Layout", "state": "Karnataka", "lat": 12.9109, "lng": 77.6542},
        {"name": "Jayanagar", "state": "Karnataka", "lat": 12.9250, "lng": 77.5938},
        {"name": "Malleshwaram", "state": "Karnataka", "lat": 13.0047, "lng": 77.5755},
        {"name": "Electronic City", "state": "Karnataka", "lat": 12.8391, "lng": 77.6774},
        {"name": "Marathahalli", "state": "Karnataka", "lat": 12.9507, "lng": 77.7000},
        {"name": "BTM Layout", "state": "Karnataka", "lat": 12.9166, "lng": 77.6104},
        {"name": "Bannerghatta", "state": "Karnataka", "lat": 12.8572, "lng": 77.5996},
        
        # Delhi NCR Local Areas
        {"name": "Connaught Place", "state": "Delhi", "lat": 28.6333, "lng": 77.2250},
        {"name": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266},
        {"name": "Noida", "state": "Uttar Pradesh", "lat": 28.5355, "lng": 77.3910},
        {"name": "Dwarka", "state": "Delhi", "lat": 28.5921, "lng": 77.0455},
        {"name": "Rohini", "state": "Delhi", "lat": 28.7041, "lng": 77.1025},
        {"name": "Saket", "state": "Delhi", "lat": 28.5270, "lng": 77.2167},
        {"name": "Vasant Kunj", "state": "Delhi", "lat": 28.5382, "lng": 77.1573},
        {"name": "Lajpat Nagar", "state": "Delhi", "lat": 28.5672, "lng": 77.2430},
        {"name": "South Extension", "state": "Delhi", "lat": 28.5685, "lng": 77.2263},
        {"name": "Model Town", "state": "Delhi", "lat": 28.7009, "lng": 77.1905},
        
        # Mumbai Local Areas
        {"name": "Bandra", "state": "Maharashtra", "lat": 19.0596, "lng": 72.8381},
        {"name": "Andheri", "state": "Maharashtra", "lat": 19.1136, "lng": 72.8697},
        {"name": "Juhu", "state": "Maharashtra", "lat": 19.0974, "lng": 72.8262},
        {"name": "Powai", "state": "Maharashtra", "lat": 19.1189, "lng": 72.9080},
        {"name": "Worli", "state": "Maharashtra", "lat": 18.9956, "lng": 72.8170},
        {"name": "Dadar", "state": "Maharashtra", "lat": 19.0183, "lng": 72.8443},
        {"name": "Borivali", "state": "Maharashtra", "lat": 19.2299, "lng": 72.8565},
        {"name": "Thane", "state": "Maharashtra", "lat": 19.2183, "lng": 72.9781},
        {"name": "Navi Mumbai", "state": "Maharashtra", "lat": 19.0330, "lng": 73.0297},
        {"name": "Colaba", "state": "Maharashtra", "lat": 18.9144, "lng": 72.8321},
        
        # Kolkata Local Areas
        {"name": "Park Street", "state": "West Bengal", "lat": 22.5489, "lng": 88.3500},
        {"name": "Salt Lake", "state": "West Bengal", "lat": 22.5833, "lng": 88.4167},
        {"name": "Howrah", "state": "West Bengal", "lat": 22.5833, "lng": 88.3167},
        {"name": "Alipore", "state": "West Bengal", "lat": 22.5333, "lng": 88.3500},
        {"name": "Ballygunge", "state": "West Bengal", "lat": 22.5250, "lng": 88.3667},
        {"name": "Tollygunge", "state": "West Bengal", "lat": 22.4983, "lng": 88.3567},
        {"name": "Behala", "state": "West Bengal", "lat": 22.4900, "lng": 88.3200},
        {"name": "Dumdum", "state": "West Bengal", "lat": 22.6333, "lng": 88.4333},
        {"name": "Barasat", "state": "West Bengal", "lat": 22.2333, "lng": 88.4500},
        {"name": "New Town", "state": "West Bengal", "lat": 22.5833, "lng": 88.4833},
        
        # Chennai Local Areas
        {"name": "T Nagar", "state": "Tamil Nadu", "lat": 13.0390, "lng": 80.2340},
        {"name": "Anna Nagar", "state": "Tamil Nadu", "lat": 13.0850, "lng": 80.2100},
        {"name": "Adyar", "state": "Tamil Nadu", "lat": 13.0078, "lng": 80.2567},
        {"name": "Velachery", "state": "Tamil Nadu", "lat": 12.9791, "lng": 80.2208},
        {"name": "Guindy", "state": "Tamil Nadu", "lat": 13.0102, "lng": 80.2172},
        {"name": "Mylapore", "state": "Tamil Nadu", "lat": 13.0333, "lng": 80.2333},
        {"name": "Thiruvanmiyur", "state": "Tamil Nadu", "lat": 12.9639, "lng": 80.2556},
        {"name": "Pallavaram", "state": "Tamil Nadu", "lat": 12.9692, "lng": 80.1889},
        {"name": "Ambattur", "state": "Tamil Nadu", "lat": 13.1000, "lng": 80.1500},
        {"name": "Porur", "state": "Tamil Nadu", "lat": 13.0333, "lng": 80.1667},
        
        # Hyderabad Local Areas
        {"name": "HITEC City", "state": "Telangana", "lat": 17.4448, "lng": 78.3852},
        {"name": "Banjara Hills", "state": "Telangana", "lat": 17.4167, "lng": 78.4333},
        {"name": "Jubilee Hills", "state": "Telangana", "lat": 17.4250, "lng": 78.4000},
        {"name": "Gachibowli", "state": "Telangana", "lat": 17.4400, "lng": 78.3500},
        {"name": "Kondapur", "state": "Telangana", "lat": 17.4600, "lng": 78.3700},
        {"name": "Madhapur", "state": "Telangana", "lat": 17.4500, "lng": 78.3800},
        {"name": "Secunderabad", "state": "Telangana", "lat": 17.4399, "lng": 78.5000},
        {"name": "Kukatpally", "state": "Telangana", "lat": 17.4800, "lng": 78.4000},
        {"name": "Ameerpet", "state": "Telangana", "lat": 17.4350, "lng": 78.4400},
        {"name": "Miyapur", "state": "Telangana", "lat": 17.4900, "lng": 78.3600}
    ]
    
    existing = db.query(City).count()
    if existing > 0:
        print(f"✓ Cities already seeded ({existing} cities found)")
        return
    
    for city_data in cities:
        city = City(**city_data)
        db.add(city)
    
    db.commit()
    print(f"✓ Added {len(cities)} cities")

def seed_admin_user(db: Session):
    """Create default admin user"""
    admin_email = "admin@uber.com"
    
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        print(f"✓ Admin user already exists")
        return
    
    admin = User(
        name="Admin User",
        email=admin_email,
        password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    
    db.add(admin)
    db.commit()
    print(f"✓ Created admin user: {admin_email} / admin123")

def seed_demo_users(db: Session):
    """Create demo rider and driver accounts"""
    demo_users = [
        {
            "name": "Demo Rider",
            "email": "rider@demo.com",
            "password": "rider123",
            "role": UserRole.RIDER
        },
        {
            "name": "Demo Driver",
            "email": "driver@demo.com",
            "password": "driver123",
            "role": UserRole.DRIVER
        }
    ]
    
    for user_data in demo_users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            continue
        
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            is_active=True,
            is_verified=True
        )
        
        db.add(user)
        db.commit()
        
        # Create loyalty points for rider
        if user.role == UserRole.RIDER:
            loyalty = LoyaltyPoints(user_id=user.id, total_points=500, tier="silver")
            db.add(loyalty)
            db.commit()
        
        print(f"✓ Created demo user: {user_data['email']} / {user_data['password']}")

def main():
    """Run all seeders"""
    print("\n🌱 Starting database seeding...\n")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_cities(db)
        seed_admin_user(db)
        seed_demo_users(db)
        print("\n✅ Database seeding completed!\n")
        print("=" * 50)
        print("Demo Accounts:")
        print("  Admin:  admin@uber.com / admin123")
        print("  Rider:  rider@demo.com / rider123")
        print("  Driver: driver@demo.com / driver123")
        print("=" * 50)
    finally:
        db.close()

if __name__ == "__main__":
    main()