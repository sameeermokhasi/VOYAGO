from app.utils import calculate_distance
import requests
import json

def check_coords():
    location = "Urban Oasis Mall, Hubli"
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={location}&limit=1&countrycodes=in"
    try:
        headers = {'User-Agent': 'VoyagoSearch/1.0'}
        r = requests.get(url, headers=headers)
        data = r.json()
        if data:
            print(f"Nominatim Result for '{location}':")
            print(f"Lat: {data[0]['lat']}, Lng: {data[0]['lon']}")
            print(f"Display Name: {data[0]['display_name']}")
        else:
            print("No result found.")
            
        # Compare with existing hardcoded
        existing_lat = 15.3524
        existing_lng = 75.1376
        print(f"\nExisting Hardcoded: ({existing_lat}, {existing_lng})")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_coords()
