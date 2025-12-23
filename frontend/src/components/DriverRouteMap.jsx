import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
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

export default function DriverRouteMap({ ride, driverLocation }) {
  const [route, setRoute] = useState([])
  const [driverRoute, setDriverRoute] = useState([])

  // Calculate route when ride details change
  useEffect(() => {
    if (ride && ride.pickup_lat && ride.destination_lat) {
      calculateRoute()
    }
  }, [ride])

  // Update driver route when driver location changes
  useEffect(() => {
    if (driverLocation && ride && ride.pickup_lat) {
      calculateDriverRoute()
    }
  }, [driverLocation, ride])

  const calculateRoute = async () => {
    try {
      // Use OSRM (Open Source Routing Machine) for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ride.pickup_lng},${ride.pickup_lat};${ride.destination_lng},${ride.destination_lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
        setRoute(coordinates)
      }
    } catch (error) {
      console.error('Failed to calculate route:', error)
      // Fallback to simple straight line in case of error
      setRoute([
        [ride.pickup_lat, ride.pickup_lng],
        [ride.destination_lat, ride.destination_lng]
      ])
    }
  }

  const calculateDriverRoute = async () => {
    try {
      // Calculate route from driver to pickup location
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${ride.pickup_lng},${ride.pickup_lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
        setDriverRoute(coordinates)
      }
    } catch (error) {
      console.error('Failed to calculate driver route:', error)
      // Fallback to simple straight line
      setDriverRoute([
        [driverLocation.lat, driverLocation.lng],
        [ride.pickup_lat, ride.pickup_lng]
      ])
    }
  }

  // Default center (India)
  const defaultCenter = [20.5937, 78.9629]
  const center = ride ? [ride.pickup_lat, ride.pickup_lng] : defaultCenter

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        className="z-0"
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
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

        {driverLocation && driverLocation.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-blue-600">🚗 Driver Location</p>
                <p className="text-gray-600">Moving to pickup</p>
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

        {driverRoute.length > 0 && (
          <Polyline
            positions={driverRoute}
            color="#10b981"
            weight={6}
            opacity={0.8}
          />
        )}
      </MapContainer>

      {/* Driver Info Overlay */}
      {driverLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
          <h4 className="font-bold text-gray-800 mb-2 flex items-center">
            <Car className="w-5 h-5 mr-2 text-blue-600" />
            Driver on the way
          </h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Real-time location tracking
            </p>
          </div>
        </div>
      )}
    </div>
  )
}