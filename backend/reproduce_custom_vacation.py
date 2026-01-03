import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def reproduce_issue():
    # 1. Login as rider
    import random
    import string
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    email = f"rider_{random_suffix}@example.com"
    password = "password123"
    
    random_phone = ''.join(random.choices(string.digits, k=10))
    
    print(f"Attempting to register new user: {email}, phone: {random_phone}")
    register_data = {
        "email": email,
        "password": password,
        "name": "Test Rider",
        "phone": random_phone,
        "role": "rider"
    }
    reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    print(f"REG_STATUS: {reg_response.status_code}")
    if reg_response.status_code != 201:
        print(f"REG_ERR: {reg_response.text}")
        return

    token = login(email, password)
        
    if not token:
        print("AUTH_FAIL")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Construct payload similar to frontend
    # Note: Frontend sends JSON strings for complex fields
    
    payload = {
        "destination": "Goa",
        "start_date": "2025-12-10", # Date string as from input type=date
        "end_date": "2025-12-15",
        "passengers": 1,
        "vehicle_type": "economy",
        "ride_included": True,
        "hotel_name": "",
        "hotel_address": "",
        "hotel_included": True,
        "is_fixed_package": False,
        # JSON strings as sent by frontend
        "schedule": json.dumps({
            "flightDetails": "",
            "mealTimings": "Breakfast: N/A, Lunch: N/A, Dinner: N/A",
            "activities": ""
        }),
        "flight_details": json.dumps({
            "departureCity": "",
            "arrivalCity": "",
            "departureTime": "",
            "arrivalTime": "",
            "flightNumber": ""
        }),
        "meal_preferences": json.dumps({
            "breakfast": "",
            "lunch": "",
            "dinner": ""
        }),
        "activities": json.dumps([])
    }

    print("Sending payload:", json.dumps(payload, indent=2))

    response = requests.post(f"{BASE_URL}/api/vacation/", json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    reproduce_issue()
