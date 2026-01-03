import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Clock, Navigation } from 'lucide-react'

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

// Component to fit bounds when markers change
function MapBounds({ pickup, destination }) {
  const map = useMap()

  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pickup, destination, map])

  return null
  return null
}

// Component to update center when it changes
function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function MapWithRoute({ pickup, destination, onRouteCalculated }) {
  const [route, setRoute] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)

  // Calculate route when pickup and destination change
  useEffect(() => {
    if (pickup && destination && pickup.lat && destination.lat) {
      calculateRoute()
    }
  }, [pickup, destination])

  const calculateRoute = async () => {
    try {
      // Use OSRM (Open Source Routing Machine) for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
        setRoute(coordinates)

        // Calculate distance and time
        const distanceKm = (routeData.distance / 1000).toFixed(1)
        const durationMin = Math.round(routeData.duration / 60)

        // Calculate ETA
        const now = new Date()
        const pickupTime = new Date(now.getTime() + 10 * 60000) // 10 mins to pickup
        const dropoffTime = new Date(pickupTime.getTime() + routeData.duration * 1000)

        const info = {
          distance: distanceKm,
          duration: durationMin,
          pickupETA: pickupTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          dropoffETA: dropoffTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }

        setRouteInfo(info)

        // Call parent callback if provided
        if (onRouteCalculated) {
          onRouteCalculated(info)
        }
      }
    } catch (error) {
      console.error('Failed to calculate route:', error)
      // Fallback to simple straight line in case of error
      setRoute([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      ])
    }
  }

  // Default center (India)
  const defaultCenter = [20.5937, 78.9629]
  const center = pickup ? [pickup.lat, pickup.lng] : defaultCenter

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
        <MapUpdater center={center} />

        {pickup && pickup.lat && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-green-600">📍 Pickup Location</p>
                <p className="text-gray-600">{pickup.address || 'Pickup Point'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {destination && destination.lat && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-red-600">🎯 Destination</p>
                <p className="text-gray-600">{destination.address || 'Drop-off Point'}</p>
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

        {pickup && destination && (
          <MapBounds pickup={pickup} destination={destination} />
        )}
      </MapContainer>

      {/* Route Info Overlay */}
      {routeInfo && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
          <h4 className="font-bold text-gray-800 mb-3">📍 Route Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold">{routeInfo.distance} km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{routeInfo.duration} min</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center space-x-2 text-green-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Pickup ETA: {routeInfo.pickupETA}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600 mt-1">
                <Navigation className="w-4 h-4" />
                <span className="font-medium">Drop-off ETA: {routeInfo.dropoffETA}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
