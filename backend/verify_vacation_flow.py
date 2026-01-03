import requests
import json
import time

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed for {email}: {response.text}")
    return None

def create_vacation(token):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "destination": "Test Destination",
        "start_date": "2025-12-10T10:00:00",
        "end_date": "2025-12-15T10:00:00",
        "vehicle_type": "economy",
        "passengers": 2,
        "ride_included": True,
        "hotel_included": True,
        "is_fixed_package": False
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

def main():
    # 1. Login as Rider
    print("Logging in as rider...")
    rider_token = login("rider@example.com", "password123")
    if not rider_token:
        # Try registering if login fails
        print("Registering rider...")
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "rider@example.com",
            "password": "password123",
            "name": "Test Rider",
            "role": "rider"
        })
        rider_token = login("rider@example.com", "password123")
        
    if not rider_token:
        print("Could not login as rider")
        return

    # 2. Create Vacation
    print("Creating vacation...")
    vacation = create_vacation(rider_token)
    if not vacation:
        return
    vacation_id = vacation["id"]
    print(f"Vacation created with ID: {vacation_id}")

    # 3. Login as Driver
    print("Logging in as driver...")
    driver_token = login("driver@example.com", "password123")
    if not driver_token:
        # Try registering if login fails
        print("Registering driver...")
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "driver@example.com",
            "password": "password123",
            "name": "Test Driver",
            "role": "driver"
        })
        # Create driver profile
        driver_token = login("driver@example.com", "password123")
        if driver_token:
             requests.post(f"{BASE_URL}/api/auth/driver/profile", headers={"Authorization": f"Bearer {driver_token}"}, json={
                 "license_number": "DL1234567890",
                 "vehicle_type": "economy",
                 "vehicle_model": "Toyota Etios",
                 "vehicle_plate": "KA01AB1234"
             })

    if not driver_token:
        print("Could not login as driver")
        return

    # 4. Confirm Vacation
    print("Confirming vacation...")
    confirmed = confirm_vacation(driver_token, vacation_id)
    if not confirmed:
        return
    print("Vacation confirmed")

    # 5. Start Vacation
    print("Starting vacation...")
    started = start_vacation(driver_token, vacation_id)
    if started:
        print("SUCCESS: Vacation started successfully!")
    else:
        print("FAILURE: Could not start vacation")

if __name__ == "__main__":
    main()
