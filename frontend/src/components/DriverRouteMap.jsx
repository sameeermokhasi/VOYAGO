import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Car } from 'lucide-react'

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const driverIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/fluency/48/sedan.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
  shadowSize: [48, 48]
})

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function DriverRouteMap({ ride, driverLocation: realDriverLocation }) {
  const [route, setRoute] = useState([])
  const [driverRoute, setDriverRoute] = useState([])
  const [animatedDriverLocation, setAnimatedDriverLocation] = useState(null)
  const [simulationPhase, setSimulationPhase] = useState('idle') // idle, approaching, journey, completed

  const animationRef = useRef(null)

  // Initialize or update simulation based on status
  useEffect(() => {
    if (!ride) {
      console.log("No ride provided to DriverRouteMap");
      return;
    }

    const status = ride.status ? ride.status.toLowerCase() : '';
    console.log(`DriverRouteMap: Ride ${ride.id} Status: ${status}, Phase: ${simulationPhase}`);

    if (status === 'accepted' && simulationPhase !== 'approaching' && simulationPhase !== 'journey') {
      console.log("Triggering Approaching Simulation");
      startApproachingSimulation();
    } else if (status === 'in_progress' && simulationPhase !== 'journey') {
      console.log("Triggering Journey Simulation");
      startJourneySimulation();
    } else if (status === 'completed') {
      setSimulationPhase('completed');
      if (ride.destination_lat) {
        setAnimatedDriverLocation({ lat: ride.destination_lat, lng: ride.destination_lng });
      }
      cancelAnimationFrame(animationRef.current);
    }
  }, [ride?.status, ride?.id]); // Re-check if ride ID changes

  // Route Planning (Static)
  useEffect(() => {
    if (ride && ride.pickup_lat && ride.destination_lat) {
      calculateRoute()
    }
  }, [ride])

  const calculateRoute = async () => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ride.pickup_lng},${ride.pickup_lat};${ride.destination_lng},${ride.destination_lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
        setRoute(coordinates)
        return coordinates;
      }
    } catch (error) {
      console.error('Failed to calculate route:', error)
      const fallback = [
        [ride.pickup_lat, ride.pickup_lng],
        [ride.destination_lat, ride.destination_lng]
      ];
      setRoute(fallback)
      return fallback;
    }
    return null;
  }

  // Helper: Generate Random Location within radius (0.5km - 3km)
  const getRandomLocation = (lat, lng) => {
    const r = (Math.random() * 0.025) + 0.005; // ~500m to 3km
    const theta = Math.random() * 2 * Math.PI;
    return {
      lat: lat + r * Math.cos(theta),
      lng: lng + r * Math.sin(theta)
    };
  };

  // Helper: Animate along path
  const animateAlongPath = (pathCoordinates, durationMs, onComplete) => {
    let startTime = null;

    // Ensure we have enough points for smoothness
    // For simplicity, we just interpolate between the provided points
    const totalPoints = pathCoordinates.length;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);

      // Calculate current position index
      // E.g. 0.5 progress on 100 points -> index 50
      // To get smoother, we should interpolate between index i and i+1

      const virtualIndex = progress * (totalPoints - 1);
      const index = Math.floor(virtualIndex);
      const nextIndex = Math.min(index + 1, totalPoints - 1);
      const segmentProgress = virtualIndex - index;

      const p1 = pathCoordinates[index];
      const p2 = pathCoordinates[nextIndex];

      if (p1 && p2) {
        const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
        setAnimatedDriverLocation({ lat, lng });
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  const startApproachingSimulation = async () => {
    if (!ride || !ride.pickup_lat) return;
    setSimulationPhase('approaching');

    // 1. Generate Start Point
    const startPos = getRandomLocation(ride.pickup_lat, ride.pickup_lng);
    setAnimatedDriverLocation(startPos);

    // 2. Calculate Route from Start -> Pickup
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPos.lng},${startPos.lat};${ride.pickup_lng},${ride.pickup_lat}?overview=full&geometries=geojson`
      )
      const data = await response.json();
      let path = [];

      if (data.routes && data.routes.length > 0) {
        path = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      } else {
        path = [[startPos.lat, startPos.lng], [ride.pickup_lat, ride.pickup_lng]];
      }

      setDriverRoute(path);

      // 3. Animate (Move vaguely slowly, say 15 seconds for approach)
      animateAlongPath(path, 15000, () => {
        // Reached pickup
        // Stick to pickup until status changes
        setAnimatedDriverLocation({ lat: ride.pickup_lat, lng: ride.pickup_lng });
      });

    } catch (e) {
      console.error("Approach sim error", e);
    }
  };

  const startJourneySimulation = async () => {
    if (!ride) return;
    setSimulationPhase('journey');

    // 1. Get Route (Pickup -> Destination)
    // Might already be calculated in 'route' state, but ensure we have valid coords
    let journeyPath = route;
    if (journeyPath.length === 0) {
      journeyPath = await calculateRoute();
    }

    if (journeyPath && journeyPath.length > 0) {
      // 2. Animate over EXACTLY 10 Seconds
      animateAlongPath(journeyPath, 10000, () => {
        setSimulationPhase('completed');
        setAnimatedDriverLocation({ lat: ride.destination_lat, lng: ride.destination_lng });
      });
    }
  };

  // Determine which location to show: Real or Animated
  // If we have a simulation running, prefer that. Otherwise fallback to real or none.
  const displayLocation = animatedDriverLocation || realDriverLocation;

  // Determine center: Animated Driver > Real Driver > Pickup > Default
  const defaultCenter = [20.5937, 78.9629]
  const mapCenter = displayLocation
    ? [displayLocation.lat, displayLocation.lng]
    : (ride ? [ride.pickup_lat, ride.pickup_lng] : defaultCenter);

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        className="z-0"
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          attribution='Tiles'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />

        {ride && ride.pickup_lat && (
          <Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-green-600">📍 Pickup Location</p>
                <p className="text-gray-600">{ride.pickup_address || 'Pickup Point'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {ride && ride.destination_lat && (
          <Marker position={[ride.destination_lat, ride.destination_lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-red-600">🎯 Destination</p>
                <p className="text-gray-600">{ride.destination_address || 'Drop-off Point'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {displayLocation && displayLocation.lat && (
          <Marker position={[displayLocation.lat, displayLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-blue-600">🚗 Your Captain</p>
                <p className="text-gray-600">
                  {simulationPhase === 'approaching' ? 'Arriving at pickup' :
                    simulationPhase === 'journey' ? 'En route to destination' :
                      'Driver'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {route.length > 0 && (
          <Polyline
            positions={route}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Show approach route only during approach phase */}
        {simulationPhase === 'approaching' && driverRoute.length > 0 && (
          <Polyline
            positions={driverRoute}
            color="#10b981"
            weight={4}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Driver Info Overlay */}
      {displayLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[400] max-w-xs border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-1 flex items-center">
            <Car className="w-5 h-5 mr-2 text-blue-600" />
            {simulationPhase === 'approaching' ? 'Driver Arriving' :
              simulationPhase === 'journey' ? 'Enjoy the Ride' :
                simulationPhase === 'completed' ? 'Arrived!' : 'Connecting...'}
          </h4>
          <p className="text-xs text-gray-500">
            {simulationPhase === 'approaching' ? 'Driver is heading to your location' :
              simulationPhase === 'journey' ? 'Heading to destination' :
                simulationPhase === 'completed' ? 'We have reached your destination' :
                  'Locating driver nearby...'}
          </p>
        </div>
      )}
    </div>
  )
}