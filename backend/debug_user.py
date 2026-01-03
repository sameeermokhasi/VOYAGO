from app.database import SessionLocal
from app.models import User

try:
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@voyago.com").first()
    if user:
        print(f"Found User: ID={user.id}, Name={user.name}, Email={user.email}, Role={user.role}, Active={user.is_active}, Verified={user.is_verified}")
    else:
        print("User 'admin@voyago.com' NOT found.")
except Exception as e:
    print(f"Error: {e}")
