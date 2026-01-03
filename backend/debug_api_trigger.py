import requests

BASE_URL = "http://127.0.0.1:8000"

def trigger_api():
    # 1. Login (Form Data)
    try:
        # OAuth2PasswordRequestForm expects 'username' and 'password' in form data
        resp = requests.post(f"{BASE_URL}/api/auth/login", data={
            "username": "rider1@test.com",
            "password": "test123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return

        token = resp.json()["access_token"]
        print(f"Got token. Accessing /api/rides/ ...")
        
        # 2. Get Rides
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{BASE_URL}/api/rides/", headers=headers)
        
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    trigger_api()
