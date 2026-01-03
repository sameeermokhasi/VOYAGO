from app.database import SessionLocal
from app.models import User, Vacation

def verify_db():
    db = SessionLocal()
    try:
        print("Querying users...")
        user = db.query(User).first()
        print(f"User found: {user.email if user else 'None'}")
        
        print("Querying vacations...")
        vacation = db.query(Vacation).first()
        print(f"Vacation found: {vacation.id if vacation else 'None'}")
        
        if vacation:
            print(f"Vacation driver_id: {vacation.driver_id}")
            
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_db()
