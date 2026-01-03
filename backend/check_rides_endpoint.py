import requests
import sys

# Login first to get token
BASE_URL = "http://localhost:8000"
EMAIL = "driver3@voyago.com"  # Using one of the new test drivers
PASSWORD = "password123"

def check_endpoint():
    try:
        # 1. Login
        print(f"Logging in as {EMAIL}...")
        resp = requests.post(f"{BASE_URL}/api/auth/login", data={"username": EMAIL, "password": PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Get Available Rides
        print("Fetching available rides...")
        try:
            resp = requests.get(f"{BASE_URL}/api/rides/available", headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                rides = resp.json()
                print(f"Success! Found {len(rides)} rides.")
                # print(rides)
            else:
                print(f"Error: {resp.text}")
        except requests.exceptions.Timeout:
            print("ERROR: Request timed out (Backend is hanging!)")
        except Exception as e:
            print(f"ERROR: {e}")

    except Exception as e:
        print(f"Fatal error: {e}")

if __name__ == "__main__":
    check_endpoint()
