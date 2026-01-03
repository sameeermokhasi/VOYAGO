import requests
import json
import time

BASE_URL = "http://localhost:8000"

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password}, timeout=5)
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed for {email}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Login connection error: {e}")
    return None

def create_custom_vacation(token):
    headers = {"Authorization": f"Bearer {token}"}
    schedule = {
        "flightDetails": {
            "departureCity": "Bangalore", 
            "arrivalCity": "Goa",
            "departureTime": "2025-12-20T10:00:00",
            "arrivalTime": "2025-12-20T12:00:00"
        },
        "activities": [{"location": "Beach", "description": "Relax"}]
    }
    data = {
        "destination": "Goa",
        "start_date": "2025-12-20T10:00:00",
        "end_date": "2025-12-25T10:00:00",
        "vehicle_type": "economy",
        "passengers": 2,
        "ride_included": True,
        "hotel_included": True,
        "is_fixed_package": False,
        "schedule": json.dumps(schedule),
        "flight_details": json.dumps(schedule["flightDetails"]),
        "activities": json.dumps(schedule["activities"])
    }
    response = requests.post(f"{BASE_URL}/api/vacation/", json=data, headers=headers)
    if response.status_code == 201:
        return response.json()
    print(f"Create vacation failed: {response.text}")
    return None

def confirm_vacation(token, vacation_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.patch(f"{BASE_URL}/api/vacation/{vacation_id}/confirm", headers=headers)
    if response.status_code == 200:
        return response.json()
    print(f"Confirm vacation failed: {response.text}")
    return None

def start_vacation(token, vacation_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.patch(f"{BASE_URL}/api/vacation/{vacation_id}/start", headers=headers)
    if response.status_code == 200:
        return response.json()
    print(f"Start vacation failed: {response.text}")
    return None

def get_vacation_rides(token, vacation_id):
    headers = {"Authorization": f"Bearer {token}"}
    # We can get rides via get_rides and filter, or if there's a specific endpoint
    # Using get_rides
    response = requests.get(f"{BASE_URL}/api/rides/", headers=headers)
    if response.status_code == 200:
        rides = response.json()
        return [r for r in rides if r["vacation_id"] == vacation_id]
    return []

def complete_ride(token, ride_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.patch(f"{BASE_URL}/api/rides/{ride_id}", json={"status": "completed"}, headers=headers)
    if response.status_code == 200:
        return response.json()
    print(f"Complete ride failed: {response.text}")
    return None

def trigger_next_leg(token, vacation_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/scheduler/vacation/{vacation_id}/schedule-rides", headers=headers)
    if response.status_code == 200:
        return response.json()
    print(f"Trigger next leg failed: {response.text}")
    return None

def main():
    # 1. Login
    print("Logging in...")
    rider_token = login("rider@example.com", "password123")
    driver_token = login("driver@example.com", "password123")
    
    if not rider_token or not driver_token:
        print("Login failed")
        return

    # 2. Create Custom Vacation
    print("Creating custom vacation...")
    vacation = create_custom_vacation(rider_token)
    if not vacation: return
    vacation_id = vacation["id"]
    print(f"Vacation created: {vacation_id}")

    # 3. Confirm Vacation (Driver)
    print("Confirming vacation...")
    confirmed = confirm_vacation(driver_token, vacation_id)
    if not confirmed: return
    
    # 4. Start Vacation (Driver)
    print("Starting vacation...")
    started = start_vacation(driver_token, vacation_id)
    if not started: return

    # 5. Check first ride (should be created automatically on confirm/start? No, confirm triggers schedule_next_ride)
    # Wait a bit for async scheduling if any, but schedule_next_ride is called in confirm_vacation
    print("Checking first ride...")
    rides = get_vacation_rides(rider_token, vacation_id)
    if not rides:
        print("No rides found!")
        return
    
    first_ride = rides[0]
    print(f"First ride found: {first_ride['id']} ({first_ride['pickup_address']} -> {first_ride['destination_address']})")
    
    # 6. Complete first ride (Driver)
    print("Completing first ride...")
    # Driver needs to accept/start/complete. Assuming it's already assigned.
    # Just force complete for test
    complete_ride(driver_token, first_ride["id"])
    
    # 7. Trigger Next Leg (Rider)
    print("Triggering next leg...")
    next_leg_response = trigger_next_leg(rider_token, vacation_id)
    if next_leg_response and next_leg_response.get("ride"):
        next_ride = next_leg_response["ride"]
        print(f"Next leg created: {next_ride['id']} ({next_ride['pickup_address']} -> {next_ride['destination_address']})")
        print(f"Assigned Driver ID: {next_ride['driver_id']}")
        
        # Verify driver sees it
        print("Verifying driver visibility...")
        driver_rides = get_vacation_rides(driver_token, vacation_id) # Driver can see rides
        # Actually driver endpoint might be different, but get_rides works for driver too
        
        found = False
        for r in driver_rides:
            if r["id"] == next_ride["id"]:
                found = True
                print(f"Driver sees ride {r['id']} with status {r['status']}")
                break
        
        if found:
            print("SUCCESS: Sequential flow verified!")
        else:
            print("FAILURE: Driver cannot see the new ride")
            
    else:
        print("FAILURE: Could not trigger next leg")

if __name__ == "__main__":
    main()
