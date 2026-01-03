from sqlalchemy import create_engine, text
from app.config import settings
from app.models import User, Ride, Vacation, DriverProfile, UserRole

engine = create_engine(settings.database_url)

def check_state():
    with engine.connect() as conn:
        print("=== PENDING RIDES ===")
        rides = conn.execute(text("SELECT id, status, driver_id FROM rides WHERE status = 'pending'")).fetchall()
        for r in rides:
            print(f"Ride {r.id}: Status={r.status}, Driver={r.driver_id}")
        if not rides:
            print("No pending rides found.")

        print("\n=== PENDING VACATIONS ===")
        vacations = conn.execute(text("SELECT id, status FROM vacations WHERE status = 'pending'")).fetchall()
        for v in vacations:
            print(f"Vacation {v.id}: Status={v.status}")
        if not vacations:
            print("No pending vacations found.")

        print("\n=== ENUM VALIDATION ===")
        ride_statuses = conn.execute(text("SELECT DISTINCT status FROM rides")).fetchall()
        print(f"Ride Statuses: {[r.status for r in ride_statuses]}")
        
        ride_vehicles = conn.execute(text("SELECT DISTINCT vehicle_type FROM rides")).fetchall()
        print(f"Ride Vehicle Types: {[r.vehicle_type for r in ride_vehicles]}")
        
        vacation_vehicles = conn.execute(text("SELECT DISTINCT vehicle_type FROM vacations")).fetchall()
        print(f"Vacation Vehicle Types: {[v.vehicle_type for v in vacation_vehicles]}")

        print("\n=== DRIVER AVAILABILITY ===")
        drivers = conn.execute(text("SELECT u.id, u.email, dp.is_available, dp.current_lat, dp.current_lng, dp.vehicle_type FROM users u JOIN driver_profiles dp ON u.id = dp.user_id WHERE u.role = 'driver'")).fetchall()
        for d in drivers:
            print(f"Driver {d.id} ({d.email}): Available={d.is_available}, Location=({d.current_lat}, {d.current_lng}), Vehicle={d.vehicle_type}")

if __name__ == "__main__":
    check_state()
