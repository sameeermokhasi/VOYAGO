import requests
import json

BASE_URL = "http://localhost:8000"

def debug_endpoint():
    import uuid
    email = f"debug_rider_{uuid.uuid4()}@gmail.com"
    password = "password123"
    print(f"Logging in as {email}...")
    
    # Try login first
    response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if response.status_code != 200:
        print("Login failed, trying to register...")
        # Register
        reg_data = {
            "email": email,
            "password": password,
            "name": "Debug Rider",
            "phone": "1234567890",
            "role": "rider"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        if response.status_code not in [200, 201]:
            print(f"Registration failed: {response.text}")
            with open("error.log", "w") as f:
                f.write(response.text)
            return
        
        # Login again
        response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
        if response.status_code != 200:
            print(f"Login failed after registration: {response.text}")
            return
            
    token = response.json()["access_token"]
    print("Login successful.")

    headers = {"Authorization": f"Bearer {token}"}

    # Create a vacation if none exist
    print("Fetching vacations...")
    try:
        response = requests.get(f"{BASE_URL}/api/vacation/", headers=headers)
        if response.status_code == 200 and len(response.json()) == 0:
            print("No vacations found, creating one...")
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
            create_resp = requests.post(f"{BASE_URL}/api/vacation/", json=vacation_data, headers=headers)
            print(f"Create response: {create_resp.status_code}")
            
            # Fetch again
            response = requests.get(f"{BASE_URL}/api/vacation/", headers=headers)

        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        except:
            print("Response Text:")
            print(response.text)

    except Exception as e:
        print(f"Request failed: {e}")

    # Check Loyalty Points
    print("Fetching loyalty points...")
    try:
        response = requests.get(f"{BASE_URL}/api/vacation/loyalty/points", headers=headers)
        print(f"Loyalty Status Code: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Loyalty request failed: {e}")

if __name__ == "__main__":
    debug_endpoint()
