import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def update_schema():
    print("Updating schema...")
    with engine.connect() as conn:
        try:
            # Check if column exists first
            check_sql = text("SELECT city FROM driver_profiles LIMIT 1")
            try:
                conn.execute(check_sql)
                print("'city' column already exists in 'driver_profiles'")
            except Exception:
                # Add the column if it doesn't exist
                print("Adding 'city' column to 'driver_profiles'...")
                sql = text("ALTER TABLE driver_profiles ADD COLUMN city VARCHAR")
                conn.execute(sql)
                conn.commit()
                print("Successfully added 'city' column")
        except Exception as e:
            print(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_schema()
