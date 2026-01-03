import requests
import time
import uuid

BASE_URL = "http://localhost:8000"

def reproduce_crash():
    # 1. Login as Driver
    driver_email = "driver@gmail.com" # Assuming this exists, or I'll create one
    password = "password123"
    
    print(f"Logging in as {driver_email}...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": driver_email, "password": password})
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            # Try registering
            driver_email = f"driver_{uuid.uuid4()}@gmail.com"
            print(f"Registering new driver {driver_email}...")
            reg_data = {
                "email": driver_email,
                "password": password,
                "name": "Crash Test Driver",
                "phone": "9999999999",
                "role": "driver"
            }
            resp = requests.post(f"{BASE_URL}/api/auth/driver/register", json={
                "user_data": reg_data,
                "driver_data": {
                    "license_number": f"LIC{uuid.uuid4()}",
                    "vehicle_type": "economy",
                    "vehicle_model": "Test Car",
                    "vehicle_plate": "KA01TEST"
                }
            })
            if resp.status_code not in [200, 201]:
                print(f"Registration failed: {resp.text}")
                with open("error_reg.log", "w") as f:
                    f.write(resp.text)
                return
            
            # Login again
            response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": driver_email, "password": password})
            if response.status_code != 200:
                print(f"Login failed after registration: {response.text}")
                return

        token = response.json()["access_token"]
        print("Driver Login successful.")
        driver_headers = {"Authorization": f"Bearer {token}"}

        # 2. Register Rider and Create Data
        rider_email = f"rider_{uuid.uuid4()}@gmail.com"
        print(f"Registering rider {rider_email}...")
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": rider_email,
            "password": password,
            "name": "Crash Test Rider",
            "phone": "8888888888",
            "role": "rider"
        })
        if resp.status_code not in [200, 201]:
            print(f"Rider Registration failed: {resp.text}")
            return
        
        # Login Rider
        resp = requests.post(f"{BASE_URL}/api/auth/login", data={"username": rider_email, "password": password})
        rider_token = resp.json()["access_token"]
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        
        # Create Vacation
        print("Creating vacation...")
        vacation_data = {
            "destination": "Goa",
            "start_date": "2025-12-20T10:00:00",
            "end_date": "2025-12-25T10:00:00",
            "vehicle_type": "economy",
            "passengers": 2,
            "ride_included": True,
            "hotel_included": True,
            "is_fixed_package": False,
            "total_price": 5000.0
        }
        resp = requests.post(f"{BASE_URL}/api/vacation/", json=vacation_data, headers=rider_headers)
        if resp.status_code != 201:
            print(f"Vacation creation failed: {resp.text}")
        else:
            print("Vacation created.")

        # Create Ride
        print("Creating ride...")
        ride_data = {
            "pickup_address": "Home",
            "pickup_lat": 12.9716,
            "pickup_lng": 77.5946,
            "destination_address": "Office",
            "destination_lat": 12.9352,
            "destination_lng": 77.6245,
            "vehicle_type": "economy"
        }
        resp = requests.post(f"{BASE_URL}/api/rides/", json=ride_data, headers=rider_headers)
        if resp.status_code != 201:
            print(f"Ride creation failed: {resp.text}")
        else:
            print("Ride created.")

        # 3. Hit /api/rides/available as Driver
        print("Hitting /api/rides/available as Driver...")
        try:
            response = requests.get(f"{BASE_URL}/api/rides/available", headers=driver_headers)
            print(f"Rides Available Status: {response.status_code}")
            print(f"Rides count: {len(response.json())}")
        except Exception as e:
            print(f"Rides Available Request failed: {e}")

        # 4. Hit /api/vacation/ as Driver
        print("Hitting /api/vacation/ as Driver...")
        try:
            response = requests.get(f"{BASE_URL}/api/vacation/", headers=driver_headers)
            print(f"Vacation Status: {response.status_code}")
            print(f"Vacations count: {len(response.json())}")
        except Exception as e:
            print(f"Vacation Request failed: {e}")

    except Exception as e:
        print(f"Global error: {e}")

if __name__ == "__main__":
    reproduce_crash()
