import requests
import json
import time

BASE_URL = "http://localhost:8000"

import random

def register(email, password, role="rider"):
    data = {
        "email": email,
        "password": password,
        "name": role.capitalize(),
        "phone": "1234567890",
        "role": role
    }
    url = f"{BASE_URL}/api/auth/register"
    print(f"Registering at {url}")
    resp = requests.post(url, json=data)
    print(f"Register status: {resp.status_code}")
    if resp.status_code != 200 and resp.status_code != 201:
        print(f"Register failed for {email}: {resp.text}")

def login(email, password):
    resp = requests.post(f"{BASE_URL}/api/auth/token", data={"username": email, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    print(f"Login failed for {email}: {resp.text}")
    return None

def run_verification():
    print("=== STARTING SEQUENTIAL FLOW VERIFICATION ===")
    
    # 1. Login (Register if needed)
    suffix = random.randint(1000, 9999)
    rider_email = f"seq_rider_{suffix}@example.com"
    driver_email = f"seq_driver_{suffix}@example.com"
    password = "password"
    
    print(f"Registering {rider_email} and {driver_email}...")
    register(rider_email, password, "rider")
    register(driver_email, password, "driver")
    
    rider_token = login(rider_email, password)
    driver_token = login(driver_email, password)
    
    if not rider_token or not driver_token:
        print("Failed to login")
        return

    # Set driver location to Bangalore (12.9716, 77.5946)
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    requests.post(f"{BASE_URL}/api/users/driver/location", json={"lat": 12.9716, "lng": 77.5946}, headers=driver_headers)
    # Set driver available
    requests.post(f"{BASE_URL}/api/users/driver/availability", headers=driver_headers)

    rider_headers = {"Authorization": f"Bearer {rider_token}"}

    # 2. Create Vacation
    print("Creating vacation...")
    vacation_payload = {
        "destination": "Goa",
        "start_date": "2025-12-25T10:00:00",
        "end_date": "2025-12-30T10:00:00",
        "vehicle_type": "economy",
        "passengers": 2,
        "is_fixed_package": False,
        "schedule": json.dumps({"flightDetails": {"departureTime": "10:00"}}),
        "flight_details": json.dumps({"departureTime": "10:00", "departureCity": "Bangalore", "arrivalCity": "Goa", "arrivalTime": "12:00"}),
        "activities": json.dumps([{"location": "Beach", "description": "Relax"}]),
        "meal_preferences": json.dumps({"lunch": "13:00"})
    }
    
    resp = requests.post(f"{BASE_URL}/api/vacation/custom", json=vacation_payload, headers=rider_headers)
    if resp.status_code != 200:
        print(f"Failed to create vacation: {resp.text}")
        return
    vacation_id = resp.json()["id"]
    print(f"Vacation created: ID {vacation_id}")

    # 3. Confirm Vacation
    print("Confirming vacation...")
    resp = requests.post(f"{BASE_URL}/api/vacation/{vacation_id}/confirm", headers=rider_headers)
    if resp.status_code != 200:
        print(f"Failed to confirm vacation: {resp.text}")
        return
    print("Vacation confirmed.")

    # 4. Verify Ride 1 (Home -> Airport) is created
    print("Verifying Ride 1...")
    resp = requests.get(f"{BASE_URL}/api/rides/", headers=rider_headers)
    rides = resp.json()
    ride1 = next((r for r in rides if r.get("vacation_id") == vacation_id), None)
    
    if not ride1:
        print("Ride 1 not found!")
        # Try manual trigger just in case (though confirm should trigger it if logic is right)
        # Actually, confirmVacation in frontend calls scheduleNextRide? No, backend confirm logic usually schedules it.
        # Let's check vacation.py confirm logic later.
        return
    
    print(f"Ride 1 found: ID {ride1['id']}, Status: {ride1['status']}")

    # 5. Verify Driver Visibility (Geofencing)
    # Driver is in Bangalore (default). Ride 1 is in Bangalore. Driver should see it.
    print("Checking Driver visibility...")
    resp = requests.get(f"{BASE_URL}/api/rides/available", headers=driver_headers)
    available_rides = resp.json()
    is_visible = any(r['id'] == ride1['id'] for r in available_rides)
    print(f"Ride 1 visible to Bangalore driver: {is_visible}")
    
    if not is_visible:
        print("WARNING: Ride 1 should be visible to nearby driver!")

    # 6. Try to schedule next ride BEFORE completing Ride 1
    print("Attempting to schedule next ride prematurely...")
    resp = requests.post(f"{BASE_URL}/api/scheduler/vacation/{vacation_id}/schedule-rides", headers=rider_headers)
    print(f"Schedule response: {resp.json()}")
    
    # Verify no new ride created
    resp = requests.get(f"{BASE_URL}/api/rides/", headers=rider_headers)
    rides = resp.json()
    vacation_rides = [r for r in rides if r.get("vacation_id") == vacation_id]
    print(f"Total vacation rides: {len(vacation_rides)}")
    if len(vacation_rides) > 1:
        print("FAILED: Ride 2 scheduled prematurely!")
        return

    # 7. Complete Ride 1
    print("Completing Ride 1...")
    # Driver accepts
    requests.patch(f"{BASE_URL}/api/rides/{ride1['id']}", json={"status": "accepted"}, headers=driver_headers)
    # Driver starts
    requests.patch(f"{BASE_URL}/api/rides/{ride1['id']}", json={"status": "in_progress"}, headers=driver_headers)
    # Driver completes
    requests.patch(f"{BASE_URL}/api/rides/{ride1['id']}", json={"status": "completed"}, headers=driver_headers)
    print("Ride 1 completed.")

    # 8. Schedule Next Ride (Ride 2: Airport -> Hotel in Goa)
    print("Scheduling Ride 2...")
    resp = requests.post(f"{BASE_URL}/api/scheduler/vacation/{vacation_id}/schedule-rides", headers=rider_headers)
    print(f"Schedule response: {resp.json()}")
    
    resp = requests.get(f"{BASE_URL}/api/rides/", headers=rider_headers)
    rides = resp.json()
    ride2 = next((r for r in rides if r.get("vacation_id") == vacation_id and r['id'] != ride1['id']), None)
    
    if not ride2:
        print("Ride 2 not created!")
        return
    print(f"Ride 2 created: ID {ride2['id']}")

    # 9. Verify Geofencing for Ride 2
    # Ride 2 is in Goa. Driver is in Bangalore. Driver should NOT see it.
    print("Checking Driver visibility for Ride 2 (Driver in Bangalore)...")
    resp = requests.get(f"{BASE_URL}/api/rides/available", headers=driver_headers)
    available_rides = resp.json()
    is_visible = any(r['id'] == ride2['id'] for r in available_rides)
    print(f"Ride 2 visible to Bangalore driver: {is_visible}")
    
    if is_visible:
        print("FAILED: Ride 2 (Goa) is visible to Bangalore driver!")
    else:
        print("SUCCESS: Ride 2 is correctly hidden from distant driver.")

    print("=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    run_verification()
