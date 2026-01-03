from app.database import SessionLocal
from app.models import User, Vacation

def check_vacations():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email == "sam@gmail.com").all()
        print(f"Found {len(users)} users:")
        for user in users:
            vacations = db.query(Vacation).filter(Vacation.user_id == user.id).all()
            print(f"User: {user.name} ({user.email}) - Role: {user.role}")
            print(f"  Vacations: {len(vacations)}")
            for v in vacations:
                print(f"    - ID: {v.id}, Dest: {v.destination}, Status: {v.status}")
    finally:
        db.close()

if __name__ == "__main__":
    check_vacations()
