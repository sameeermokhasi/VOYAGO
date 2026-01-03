import math

def calculate_fare(distance_km: float, vehicle_type: str) -> float:
    """Calculate ride fare based on distance and vehicle type"""
    base_fare = {
        "economy": 50,
        "premium": 100,
        "suv": 120,
        "luxury": 200
    }
    
    per_km_rate = {
        "economy": 10,
        "premium": 15,
        "suv": 18,
        "luxury": 25
    }
    
    base = base_fare.get(vehicle_type, 50)
    rate = per_km_rate.get(vehicle_type, 10)
    
    return base + (distance_km * rate)

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c
