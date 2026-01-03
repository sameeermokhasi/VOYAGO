import requests
import json
import random
import string
import time

BASE_URL = "http://localhost:8000"

def get_random_email():
    return f"user_{''.join(random.choices(string.ascii_lowercase, k=6))}@example.com"

def register_and_login(role):
    email = get_random_email()
    password = "password123"
    print(f"Registering {role}: {email}")
    
    # Register
    reg_data = {
        "email": email,
        "password": password,
        "name": f"Test {role.capitalize()}",
        "phone": ''.join(random.choices(string.digits, k=10)),
        "role": role
    }
    
    if role == "driver":
        # Driver needs profile data
        driver_data = {
            "license_number": f"LIC{''.join(random.choices(string.digits, k=8))}",
            "vehicle_type": "economy",
            "vehicle_model": "Toyota Camry",
            "vehicle_plate": "KA01AB1234",
            "vehicle_color": "White"
        }
        # The endpoint for driver registration might be different or combined. 
        # Checking auth.py, there is /driver/register.
        resp = requests.post(f"{BASE_URL}/api/auth/driver/register", json={"user_data": reg_data, "driver_data": driver_data})
    else:
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        
    if resp.status_code not in [200, 201]:
        print(f"Failed to register {role}: {resp.status_code} {resp.text}")
        return None, None

    # Login
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if login_resp.status_code != 200:
        print(f"Failed to login {role}: {login_resp.status_code} {login_resp.text}")
        return None, None
        
    return login_resp.json()["access_token"], email

def debug_system():
    print("=== STARTING SYSTEM DEBUG ===")
    
    # 1. Test Database/Health
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {resp.status_code} {resp.json()}")
    except Exception as e:
        print(f"CRITICAL: Cannot reach backend! {e}")
        return

    # 2. Rider Flow
    rider_token, rider_email = register_and_login("rider")
    if not rider_token: return

    # 3. Driver Flow
    driver_token, driver_email = register_and_login("driver")
    if not driver_token: return
    
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # 4. Driver Location & Availability
    print("Setting driver location (Bangalore)...")
    loc_resp = requests.patch(f"{BASE_URL}/api/users/driver/location", 
                            json={"lat": 12.9716, "lng": 77.5946}, 
                            headers=driver_headers)
    print(f"Location Update: {loc_resp.status_code}")
    
    # avail_resp = requests.patch(f"{BASE_URL}/api/users/driver/availability", headers=driver_headers)
    # print(f"Availability Toggle: {avail_resp.status_code}")
    
    # Inspect Driver Profile
    me_resp = requests.get(f"{BASE_URL}/api/users/me", headers=driver_headers)
    print(f"Driver Profile: {me_resp.json()}")

    # 5. Create Ride
    print("Creating Ride Request...")
    ride_data = {
        "pickup_address": "Cubbon Park, Bangalore",
        "destination_address": "Indiranagar, Bangalore",
        "pickup_lat": 12.9750, # Close to driver
        "pickup_lng": 77.5900,
        "destination_lat": 12.9780,
        "destination_lng": 77.6400,
        "vehicle_type": "economy"
    }
    
    ride_resp = requests.post(f"{BASE_URL}/api/rides/", json=ride_data, headers=rider_headers)
    print(f"Create Ride Status: {ride_resp.status_code}")
    if ride_resp.status_code not in [200, 201]:
        print(f"Create Ride Error: {ride_resp.text}")
        return
    
    ride_id = ride_resp.json()["id"]
    print(f"Ride Created: ID {ride_id}")
    
    # Inspect Ride
    inspect_resp = requests.get(f"{BASE_URL}/api/rides/{ride_id}", headers=rider_headers)
    print(f"Ride Inspection: {inspect_resp.json()}")

    # 6. Fetch Available Rides (Driver)
    print("Fetching Available Rides for Driver...")
    # Retry a few times as there might be a slight delay or race condition
    found = False
    for i in range(3):
        rides_resp = requests.get(f"{BASE_URL}/api/rides/available", headers=driver_headers)
        if rides_resp.status_code != 200:
            print(f"Fetch Rides Error: {rides_resp.status_code} {rides_resp.text}")
            break
            
        available_rides = rides_resp.json()
        print(f"Attempt {i+1}: Found {len(available_rides)} rides")
        
        found = False
        for ride in available_rides:
            if ride['id'] == ride_id:
                found = True
                break
        
        if found:
            print("SUCCESS: Ride is visible to driver!")
            break
        time.sleep(1)
        
    if not found:
        print("FAILURE: Ride NOT visible to driver.")

if __name__ == "__main__":
    debug_system()
