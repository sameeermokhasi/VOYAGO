import requests
import json
import sys
import os

# Base URL
BASE_URL = "http://localhost:8000"

def reproduce():
    try:
        # 1. Login as rider
        print("Logging in as rider...")
        login_data = {
            "username": "rider@example.com", # Assuming this user exists, or use a known one
            "password": "password"
        }
        # Try to login, if fails, create user
        response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
        
        if response.status_code != 200:
            print("Login failed, creating new rider...")
            register_data = {
                "email": "test_rider_debug@example.com",
                "name": "Test Rider Debug",
                "password": "password",
                "role": "rider"
            }
            requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
            login_data["username"] = "test_rider_debug@example.com"
            response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
            
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Create a ride
        print("Creating a ride...")
        ride_data = {
            "pickup_address": "Test Pickup",
            "pickup_lat": 12.9716,
            "pickup_lng": 77.5946,
            "destination_address": "Test Destination",
            "destination_lat": 12.9352,
            "destination_lng": 77.6245,
            "vehicle_type": "economy"
        }
        response = requests.post(f"{BASE_URL}/api/rides/", json=ride_data, headers=headers)
        if response.status_code != 201:
            print(f"Failed to create ride: {response.text}")
            return
        
        new_ride = response.json()
        print(f"Ride created: ID={new_ride['id']}, Status={new_ride['status']}")

        # 3. Fetch rides
        print("Fetching rides...")
        response = requests.get(f"{BASE_URL}/api/rides/", headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch rides: {response.text}")
            return
            
        rides = response.json()
        print(f"Fetched {len(rides)} rides.")
        
        # 4. Check for the new ride
        found_ride = next((r for r in rides if r['id'] == new_ride['id']), None)
        if found_ride:
            print(f"Found ride in list: ID={found_ride['id']}, Status={found_ride['status']}")
            if found_ride['status'] == 'pending':
                print("SUCCESS: Ride status is 'pending'.")
            else:
                print(f"FAILURE: Ride status is '{found_ride['status']}', expected 'pending'.")
        else:
            print("FAILURE: New ride not found in the list.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reproduce()
