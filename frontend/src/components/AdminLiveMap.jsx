import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Car, MapPin } from 'lucide-react'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Icons
// Custom Car Icon (Blue Circle with White Car)
const carIcon = L.divIcon({
    html: `<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7-.9.9-2.2 2.3-2.2 2.3s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
            </svg>
         </div>`,
    className: 'custom-car-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
})

const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [20, 32], // Smaller
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32]
})

// Sub-component to render route line
const RideRoute = ({ ride }) => {
    const [positions, setPositions] = useState([])

    useEffect(() => {
        const fetchRoute = async () => {
            if (!ride.pickup_lat || !ride.destination_lat) return

            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${ride.pickup_lng},${ride.pickup_lat};${ride.destination_lng},${ride.destination_lat}?overview=full&geometries=geojson`
                )
                const data = await response.json()

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
                    setPositions(coords)
                }
            } catch (error) {
                console.error("Failed to fetch route", error)
            }
        }
        fetchRoute()
    }, [ride])

    if (positions.length === 0) return null
    return <Polyline positions={positions} color="#3b82f6" weight={4} opacity={0.6} dashArray="10, 10" />
}

// Auto-Fit Bounds Component - MOVED OUTSIDE to prevent unmounting on every render
function ChangeView({ bounds, activeRidesCount }) {
    const map = useMap()
    const [hasZoomed, setHasZoomed] = useState(false)
    const [lastCount, setLastCount] = useState(0)

    useEffect(() => {
        // Only auto-fit if:
        // 1. It's the first time loaded (hasZoomed is false) and we have bounds.
        // 2. OR the number of active rides has changed (e.g. new ride added).

        if (bounds && bounds.length > 0) {
            if (!hasZoomed || activeRidesCount !== lastCount) {
                map.fitBounds(bounds, { padding: [50, 50] })
                setHasZoomed(true)
                setLastCount(activeRidesCount)
            }
        }
    }, [bounds, map, hasZoomed, activeRidesCount, lastCount])

    return null
}

export default function AdminLiveMap({ rides }) {
    const [activeRides, setActiveRides] = useState([])

    useEffect(() => {
        if (rides) {
            // Filter for active rides
            const active = rides.filter(r =>
                ['accepted', 'in_progress'].includes(r.status)
            )
            setActiveRides(active)
        }
    }, [rides])


    const center = [20.5937, 78.9629]

    return (
        <div className="relative rounded-xl overflow-hidden border border-dark-700 shadow-lg mb-8">
            <div className="absolute top-4 right-4 z-[400] bg-white text-black px-4 py-2 rounded-lg shadow-lg opacity-90">
                <h3 className="font-bold flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                    Live Operations
                </h3>
                <p className="text-sm text-gray-600">{activeRides.length} Active Rides</p>
            </div>

            <MapContainer
                center={center}
                zoom={5}
                style={{ height: '500px', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeView
                    bounds={activeRides.map(ride => {
                        const driverLoc = ride.driver?.driver_profile?.current_lat
                            ? [ride.driver.driver_profile.current_lat, ride.driver.driver_profile.current_lng]
                            : null
                        return driverLoc || [ride.pickup_lat, ride.pickup_lng]
                    })}
                    activeRidesCount={activeRides.length}
                />

                {activeRides.map(ride => (
                    <RideRoute key={`route-${ride.id}`} ride={ride} />
                ))}

                {activeRides.map(ride => {
                    // Determine position: Driver Location (if real) > Pickup Location (fallback)
                    const driverLoc = ride.driver?.driver_profile?.current_lat
                        ? [ride.driver.driver_profile.current_lat, ride.driver.driver_profile.current_lng]
                        : null

                    const position = driverLoc || [ride.pickup_lat, ride.pickup_lng]
                    const isMoving = !!driverLoc

                    return (
                        <Marker
                            key={ride.id}
                            position={position}
                            icon={isMoving ? carIcon : pickupIcon}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold text-lg mb-1">{ride.driver?.name || 'Unassigned'}</p>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">{ride.status}</p>
                                    <hr className="my-2" />
                                    <p><span className="font-semibold">From:</span> {ride.pickup_address}</p>
                                    <p><span className="font-semibold">To:</span> {ride.destination_address}</p>
                                    <p className="mt-2 text-blue-600 font-bold">Fare: ₹{ride.estimated_fare}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}
