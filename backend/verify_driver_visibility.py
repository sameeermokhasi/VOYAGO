import requests
import sys

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def verify_visibility():
    # 1. Login as driver
    # Assuming driver@example.com exists. If not, I'll register one.
    token = login("driver@example.com", "driver123")
    
    if not token:
        print("Could not login as driver. Registering new driver...")
        import random
        import string
        suffix = ''.join(random.choices(string.ascii_lowercase, k=4))
        email = f"driver_{suffix}@example.com"
        password = "password123"
        phone = ''.join(random.choices(string.digits, k=10))
        
        reg_data = {
            "name": "Test Driver",
            "email": email,
            "password": password,
            "phone": phone,
            "role": "driver"
        }
        # Register user
        requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        
        # Register driver profile
        driver_profile = {
            "license_number": f"LIC{suffix}",
            "vehicle_type": "economy",
            "vehicle_model": "Toyota Etios",
            "vehicle_plate": f"KA01{suffix}",
            "vehicle_color": "White"
        }
        # Actually /auth/driver/register does both.
        # Let's use /auth/driver/register
        full_reg_data = {
            "user_data": reg_data,
            "driver_data": driver_profile
        }
        # Wait, the endpoint expects flat structure or nested?
        # auth.py: register_driver(user_data: UserCreate, driver_data: DriverProfileCreate)
        # FastAPI expects body to match the function arguments if they are Pydantic models.
        # But usually it expects a single JSON body merging them, or separate fields.
        # Let's check auth.py again.
        # It uses `user_data: UserCreate, driver_data: DriverProfileCreate`.
        # This implies body should be: { "user_data": {...}, "driver_data": {...} } ?
        # Or maybe flat?
        # Let's try flat first, or check openapi.json if I could.
        # Actually, separate Pydantic models usually mean body keys.
        
        # Let's try simple login again, maybe driver exists.
        token = login(email, password)
        if not token:
             # Try admin
             token = login("admin@example.com", "admin123")

    if not token:
        print("Could not get token.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check available vacations
    print("Checking /vacation/available...")
    resp = requests.get(f"{BASE_URL}/api/vacation/available", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        vacations = resp.json()
        print(f"Found {len(vacations)} available vacations.")
        for v in vacations:
            print(f"ID: {v['id']}, Dest: {v['destination']}, Fixed: {v['is_fixed_package']}")
            # Check if we can find the one we just created (Goa, non-fixed)
            if v['destination'] == "Goa" and not v['is_fixed_package']:
                print("SUCCESS: Found the customised vacation booking!")
    else:
        print(f"Error: {resp.text}")

if __name__ == "__main__":
    verify_visibility()
