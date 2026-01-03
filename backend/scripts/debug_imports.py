import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("1. Importing settings...")
try:
    from app.config import settings
    print(f"   Settings loaded: {settings.database_url[:10]}...")
except Exception as e:
    print(f"!!! Error importing settings: {e}")

print("2. Importing database...")
try:
    from app.database import engine, SessionLocal, Base
    print("   Database initialized.")
except Exception as e:
    print(f"!!! Error importing database: {e}")

print("3. Importing models...")
try:
    from app.models import User, Ride, DriverProfile
    print("   Models imported.")
except Exception as e:
    print(f"!!! Error importing models: {e}")
    import traceback
    traceback.print_exc()

print("Done.")
