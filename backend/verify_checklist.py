import requests
import json
import time
import random
import string

BASE_URL = "http://localhost:8000"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def register_user(role="rider"):
    email = f"{role}_{get_random_string()}@example.com"
    password = "password123"
    name = f"Test {role.capitalize()}"
    phone = ''.join(random.choices(string.digits, k=10))
    
    data = {
        "name": name,
        "email": email,
        "password": password,
        "phone": phone,
        "role": role
    }
    
    if role == "driver":
        driver_data = {
            "license_number": f"LIC{get_random_string()}",
            "vehicle_type": "economy",
            "vehicle_model": "Toyota Etios",
            "vehicle_plate": f"KA01{get_random_string(4)}",
            "vehicle_color": "White"
        }
        # Use simple register for user, then we might need to add profile?
        # Actually /auth/register handles driver profile creation if role is driver?
        # Let's check auth.py... wait, I recall it does create profile but maybe empty?
        # Let's use the specific driver register endpoint if available or just register.
        # The previous view of auth.py showed register creating profile.
        pass

    resp = requests.post(f"{BASE_URL}/api/auth/register", json=data)
    if resp.status_code != 201:
        print(f"Registration failed: {resp.text}")
        return None, None
    
    return email, password

def login(email, password):
    resp = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    print(f"Login failed: {resp.text}")
    return None

def main():
    # 1. Register Rider
    rider_email, rider_pass = register_user("rider")
    rider_token = login(rider_email, rider_pass)
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    print(f"Rider logged in: {rider_email}")

    # 2. Register Driver
    driver_email, driver_pass = register_user("driver")
    driver_token = login(driver_email, driver_pass)
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    print(f"Driver logged in: {driver_email}")
    
    # Set driver available and location
    requests.patch(f"{BASE_URL}/api/users/driver/location", json={"lat": 12.9716, "lng": 77.5946}, headers=driver_headers)
    requests.patch(f"{BASE_URL}/api/users/driver/availability", headers=driver_headers)

    # 3. Create Vacation
    vacation_payload = {
        "destination": "Goa",
        "start_date": "2025-12-10",
        "end_date": "2025-12-15",
        "passengers": 1,
        "vehicle_type": "economy",
        "ride_included": True,
        "hotel_name": "Grand Hyatt",
        "hotel_address": "Goa",
        "hotel_included": True,
        "is_fixed_package": False,
        "schedule": json.dumps({
            "flightDetails": "",
            "mealTimings": "Breakfast: N/A, Lunch: N/A, Dinner: N/A",
            "activities": ""
        }),
        "flight_details": json.dumps({
            "departureCity": "Bangalore",
            "arrivalCity": "Goa",
            "departureTime": "10:00",
            "arrivalTime": "12:00",
            "flightNumber": "AI123"
        }),
        "meal_preferences": json.dumps({}),
        "activities": json.dumps([])
    }
    
    print("Creating vacation...")
    resp = requests.post(f"{BASE_URL}/api/vacation/", json=vacation_payload, headers=rider_headers)
    if resp.status_code != 201:
        print(f"Failed to create vacation: {resp.text}")
        return
    vacation = resp.json()
    vacation_id = vacation["id"]
    print(f"Vacation created: ID {vacation_id}")
    
    # 4. Confirm Vacation (as Driver)
    print("Confirming vacation...")
    resp = requests.patch(f"{BASE_URL}/api/vacation/{vacation_id}/confirm", headers=driver_headers)
    if resp.status_code != 200:
        print(f"Failed to confirm vacation: {resp.text}")
        return
    print("Vacation confirmed. First ride should be scheduled.")
    
    # Manually trigger scheduler to be sure
    print("Manually triggering scheduler...")
    resp = requests.post(f"{BASE_URL}/api/scheduler/vacation/{vacation_id}/schedule-rides", headers=driver_headers)
    print(f"Scheduler response: {resp.status_code}, {resp.text}")
    
    # 5. Get the scheduled ride
    # We can check available rides for the driver
    print("Checking available rides...")
    resp = requests.get(f"{BASE_URL}/api/rides/available", headers=driver_headers)
    rides = resp.json()
    ride_id = None
    for r in rides:
        if r.get("vacation_id") == vacation_id:
            ride_id = r["id"]
            break
    
    if not ride_id:
        print("No ride found in available rides. Checking rider's rides...")
        resp = requests.get(f"{BASE_URL}/api/rides/", headers=rider_headers)
        rider_rides = resp.json()
        print(f"Rider has {len(rider_rides)} rides.")
        for r in rider_rides:
            print(f"Ride ID: {r['id']}, Vacation ID: {r.get('vacation_id')}, Status: {r['status']}")
            if r.get("vacation_id") == vacation_id:
                ride_id = r["id"]
                print(f"Found ride ID {ride_id} in rider's list.")
                break
    
    if not ride_id:
        print("No ride found for vacation.")
        return
    print(f"Found ride ID: {ride_id}")
    
    # 6. Accept Ride
    print("Accepting ride...")
    resp = requests.patch(f"{BASE_URL}/api/rides/{ride_id}", json={"status": "accepted"}, headers=driver_headers)
    if resp.status_code != 200:
        print(f"Failed to accept ride: {resp.text}")
        return
        
    # 7. Start Ride
    print("Starting ride...")
    resp = requests.patch(f"{BASE_URL}/api/rides/{ride_id}", json={"status": "in_progress"}, headers=driver_headers)
    
    # 8. Complete Ride
    print("Completing ride...")
    resp = requests.patch(f"{BASE_URL}/api/rides/{ride_id}", json={"status": "completed"}, headers=driver_headers)
    if resp.status_code != 200:
        print(f"Failed to complete ride: {resp.text}")
        return
    print("Ride completed.")
    
    # 9. Verify completed_rides_count
    print("Verifying completed_rides_count...")
    resp = requests.get(f"{BASE_URL}/api/vacation/{vacation_id}", headers=rider_headers)
    vacation = resp.json()
    count = vacation.get("completed_rides_count")
    print(f"Completed Rides Count: {count}")
    
    if count == 1:
        print("SUCCESS: Checklist progress updated correctly!")
    else:
        print(f"FAILURE: Expected 1, got {count}")

if __name__ == "__main__":
    main()
