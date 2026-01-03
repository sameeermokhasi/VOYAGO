import requests
import sys

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def verify_endpoints():
    # 1. Login as driver (assuming driver@example.com / driver123 exists, or I'll try to register one)
    token = login("driver@example.com", "driver123")
    
    if not token:
        print("Could not login as driver. Trying to register...")
        # Register logic omitted for brevity, assuming driver exists or I can use admin
        token = login("admin@example.com", "admin123")
        if not token:
            print("Could not login as admin either.")
            return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check available rides
    print("Checking /rides/available...")
    resp = requests.get(f"{BASE_URL}/rides/available", headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

    # 3. Check available vacations
    print("Checking /vacation/available...")
    resp = requests.get(f"{BASE_URL}/vacation/available", headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    verify_endpoints()
