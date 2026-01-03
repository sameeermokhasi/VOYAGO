import sys
import os
import requests

# Add parent directory to path to import app modules if needed, 
# but here we just use requests to hit the running server.

BASE_URL = "http://localhost:8000"

def login_driver(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", data={
        "username": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Login failed: {response.text}")
        return None

def update_driver_profile(token, vehicle_type, vehicle_plate):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "vehicle_type": vehicle_type,
        "vehicle_plate": vehicle_plate
    }
    # Note: The endpoint prefix is /api/users based on main.py
    # app.include_router(users.router, prefix="/api/users", tags=["Users"])
    # So the URL should be /api/users/me/driver
    
    url = f"{BASE_URL}/api/users/me/driver"
    print(f"Sending PUT request to {url} with data: {data}")
    
    response = requests.put(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    # Use the credentials from the screenshot or a known driver
    email = "mom@gmail.com" 
    password = "password" # Assuming default or known password. If unknown, we might need to create a new driver.
    
    # Try to login
    print(f"Attempting login for {email}...")
    auth_data = login_driver(email, password)
    
    if auth_data:
        token = auth_data["access_token"]
        print("Login successful.")
        
        # Try to update profile
        update_driver_profile(token, "suv", "KA05MB1234")
    else:
        print("Could not login. Please check credentials or create a new driver.")
