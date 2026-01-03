import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.config import settings

def update_schema():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        # Add wallet_balance and address to users table
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN wallet_balance FLOAT DEFAULT 0.0"))
            print("Added wallet_balance to users table")
        except Exception as e:
            print(f"wallet_balance column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR"))
            print("Added address to users table")
        except Exception as e:
            print(f"address column might already exist: {e}")

        # Add aadhar_card_number to driver_profiles table
        try:
            conn.execute(text("ALTER TABLE driver_profiles ADD COLUMN aadhar_card_number VARCHAR UNIQUE"))
            print("Added aadhar_card_number to driver_profiles table")
        except Exception as e:
            print(f"aadhar_card_number column might already exist: {e}")

        # Add new columns to vacations table
        new_vacation_columns = [
            "schedule", "flight_details", "activities", "meal_preferences"
        ]
        
        for col in new_vacation_columns:
            try:
                conn.execute(text(f"ALTER TABLE vacations ADD COLUMN {col} TEXT"))
                print(f"Added {col} to vacations table")
            except Exception as e:
                print(f"{col} column might already exist: {e}")
            
        conn.commit()

if __name__ == "__main__":
    update_schema()
