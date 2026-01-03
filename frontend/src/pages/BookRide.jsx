import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, Car, Clock, ArrowLeft, Search, Mic, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { rideService } from '../services/api'
import MapWithRoute from '../components/MapWithRoute'

export default function BookRide() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_lat: 0,
    pickup_lng: 0,
    destination_address: '',
    destination_lat: 0,
    destination_lng: 0,
    vehicle_type: 'economy'
  })
  const [estimatedFare, setEstimatedFare] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mapRouteInfo, setMapRouteInfo] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [distanceError, setDistanceError] = useState(null)
  const [voiceError, setVoiceError] = useState(null)

  // Autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [destSuggestions, setDestSuggestions] = useState([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)

  // Comprehensive list of locations across major cities
  const popularLocations = [
    // Bangalore
    { name: 'Bangalore City Junction', lat: 12.9781, lng: 77.5697, city: 'Bangalore' },
    { name: 'Kempegowda International Airport', lat: 13.1986, lng: 77.7066, city: 'Bangalore' },
    { name: 'Indiranagar', lat: 12.9719, lng: 77.6412, city: 'Bangalore' },
    { name: 'Koramangala', lat: 12.9352, lng: 77.6245, city: 'Bangalore' },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500, city: 'Bangalore' },

    // Requested Key Locations
    { name: 'BMS College of Engineering (Basavangudi)', lat: 12.9410, lng: 77.5655, city: 'Bangalore' },
    { name: 'Bull Temple (Basavangudi)', lat: 12.9423, lng: 77.5683, city: 'Bangalore' },
    { name: 'Ironhill Hotel (Whitefield)', lat: 12.9593, lng: 77.7006, city: 'Bangalore' },
    { name: 'Meghana Foods (Koramangala)', lat: 12.9345, lng: 77.6186, city: 'Bangalore' },
    { name: 'RNR Hotel (Jayanagar)', lat: 12.9334, lng: 77.6105, city: 'Bangalore' },

    // Additional Popular Spots
    { name: 'Cubbon Park', lat: 12.9752, lng: 77.5937, city: 'Bangalore' },
    { name: 'Lalbagh Botanical Garden', lat: 12.9507, lng: 77.5848, city: 'Bangalore' },
    { name: 'UB City', lat: 12.9716, lng: 77.5960, city: 'Bangalore' },
    { name: 'Orion Mall', lat: 13.0110, lng: 77.5550, city: 'Bangalore' },
    { name: 'Mantri Square', lat: 12.9915, lng: 77.5700, city: 'Bangalore' },
    { name: 'Phoenix Marketcity', lat: 12.9970, lng: 77.6960, city: 'Bangalore' },
    { name: 'Bannerghatta Zoo', lat: 12.8000, lng: 77.5770, city: 'Bangalore' },
    { name: 'Wonderla Amusement Park', lat: 12.8340, lng: 77.4010, city: 'Bangalore' },
    { name: 'ISKCON Temple', lat: 13.0090, lng: 77.5510, city: 'Bangalore' },
    { name: 'Vidhana Soudha', lat: 12.9797, lng: 77.5912, city: 'Bangalore' },
    { name: 'Commercial Street', lat: 12.9820, lng: 77.6080, city: 'Bangalore' },
    { name: 'M G Road', lat: 12.9750, lng: 77.6090, city: 'Bangalore' },

    // Hubli-Dharwad
    { name: 'Hubli Junction', lat: 15.3647, lng: 75.1240, city: 'Hubli' },
    { name: 'Dharwad Railway Station', lat: 15.4589, lng: 75.0078, city: 'Dharwad' },
    { name: 'Urban Oasis Mall, Hubli', lat: 15.3556, lng: 75.1189, city: 'Hubli' },
    { name: 'PVR Cinemas, Hubli', lat: 15.3700, lng: 75.1000, city: 'Hubli' },
    { name: 'Unkal Lake, Hubli', lat: 15.3716, lng: 75.1180, city: 'Hubli' },
    { name: 'Nrupatunga Betta, Hubli', lat: 15.3800, lng: 75.1400, city: 'Hubli' },

    // Mumbai
    { name: 'Chhatrapati Shivaji Maharaj Terminus', lat: 18.9400, lng: 72.8353, city: 'Mumbai' },
    { name: 'Mumbai Airport (BOM)', lat: 19.0896, lng: 72.8656, city: 'Mumbai' },
    { name: 'Gateway of India', lat: 18.9220, lng: 72.8347, city: 'Mumbai' },
    { name: 'Marine Drive', lat: 18.9440, lng: 72.8230, city: 'Mumbai' },
    { name: 'Juhu Beach', lat: 19.0988, lng: 72.8264, city: 'Mumbai' },
    { name: 'Bandra Kurla Complex', lat: 19.0600, lng: 72.8600, city: 'Mumbai' },

    // Kolkata
    { name: 'Howrah Junction', lat: 22.5838, lng: 88.3426, city: 'Kolkata' },
    { name: 'Kolkata Airport (CCU)', lat: 22.6520, lng: 88.4463, city: 'Kolkata' },
    { name: 'Victoria Memorial', lat: 22.5448, lng: 88.3426, city: 'Kolkata' },
    { name: 'Park Street', lat: 22.5550, lng: 88.3500, city: 'Kolkata' },
    { name: 'Salt Lake City', lat: 22.5800, lng: 88.4200, city: 'Kolkata' },
    { name: 'New Market', lat: 22.5600, lng: 88.3500, city: 'Kolkata' },

    // Delhi
    { name: 'New Delhi Railway Station', lat: 28.6429, lng: 77.2191, city: 'Delhi' },
    { name: 'Indira Gandhi International Airport', lat: 28.5562, lng: 77.1000, city: 'Delhi' },
    { name: 'Connaught Place', lat: 28.6315, lng: 77.2167, city: 'Delhi' },
    { name: 'India Gate', lat: 28.6129, lng: 77.2295, city: 'Delhi' },
    { name: 'Hauz Khas Village', lat: 28.5530, lng: 77.1940, city: 'Delhi' },
    { name: 'Saket Select Citywalk', lat: 28.5280, lng: 77.2190, city: 'Delhi' },
    // Universities & Colleges - Bangalore
    { name: 'Indian Institute of Science (IISc)', lat: 13.0219, lng: 77.5671, city: 'Bangalore' },
    { name: 'RV College of Engineering', lat: 12.9237, lng: 77.5000, city: 'Bangalore' },
    { name: 'PES University (Ring Road)', lat: 12.9344, lng: 77.5345, city: 'Bangalore' },
    { name: 'MS Ramaiah Institute of Technology', lat: 13.0305, lng: 77.5649, city: 'Bangalore' },
    { name: 'Bangalore University', lat: 12.9547, lng: 77.5020, city: 'Bangalore' },
    { name: 'Christ University (Hosur Road)', lat: 12.9343, lng: 77.6060, city: 'Bangalore' },
    { name: 'Mount Carmel College', lat: 12.9863, lng: 77.5937, city: 'Bangalore' },
    { name: 'Jain University (Jayanagar)', lat: 12.9233, lng: 77.5873, city: 'Bangalore' },
    { name: 'Dayananda Sagar College of Engineering', lat: 12.9090, lng: 77.5666, city: 'Bangalore' },
    { name: 'Nitte Meenakshi Institute of Technology', lat: 13.1293, lng: 77.5871, city: 'Bangalore' },
    { name: 'Oxford College of Engineering', lat: 12.8951, lng: 77.6212, city: 'Bangalore' },
    { name: 'Reva University', lat: 13.1166, lng: 77.6348, city: 'Bangalore' },

    // Universities & Colleges - Hubli-Dharwad
    { name: 'KLE Technological University (BVB)', lat: 15.3729, lng: 75.1224, city: 'Hubli' },
    { name: 'Karnataka Institute of Medical Sciences (KIMS)', lat: 15.3582, lng: 75.1432, city: 'Hubli' },
    { name: 'PC Jabin Science College', lat: 15.3712, lng: 75.1205, city: 'Hubli' },
    { name: 'SDM College of Engineering (Dharwad)', lat: 15.4262, lng: 75.0560, city: 'Dharwad' },
    { name: 'Karnataka University (Dharwad)', lat: 15.4402, lng: 74.9854, city: 'Dharwad' },
    { name: 'KLE Institute of Technology', lat: 15.3289, lng: 75.1500, city: 'Hubli' },
    { name: 'JSS College', lat: 15.4326, lng: 75.0118, city: 'Dharwad' }
  ]

  const handleInputChange = (field, value) => {
    console.log(`Input change: ${field}, value: ${value}`)
    if (field === 'pickup') {
      setFormData({ ...formData, pickup_address: value })
      // Suggest Current Location + Popular matches
      let suggestions = []

      // Always add "Current Location" as top option for pickup
      suggestions.push({
        name: '📍 Use Current Location',
        isCurrentLocation: true,
        city: 'Current'
      })

      if (value.length > 0) {
        const filtered = popularLocations.filter(loc =>
          loc.name.toLowerCase().includes(value.toLowerCase()) ||
          loc.city.toLowerCase().includes(value.toLowerCase())
        )
        suggestions = [...suggestions, ...filtered]
      } else {
        // Show popular ones if empty? Or just current location? 
        // Let's show current location + ALL popular locations if empty (as suggestions)
        suggestions = [...suggestions, ...popularLocations.slice(0, 5)]
      }
      setPickupSuggestions(suggestions)
      setShowPickupSuggestions(true)
    } else {
      setFormData({ ...formData, destination_address: value })
      if (value.length > 0) {
        const filtered = popularLocations.filter(loc =>
          loc.name.toLowerCase().includes(value.toLowerCase()) ||
          loc.city.toLowerCase().includes(value.toLowerCase())
        )
        setDestSuggestions(filtered)
        setShowDestSuggestions(true)
      } else {
        setShowDestSuggestions(false)
      }
    }
  }

  const handleLocationSelect = (field, location) => {
    if (field === 'pickup') {
      if (location.isCurrentLocation) {
        fetchCurrentLocation()
      } else {
        setFormData({
          ...formData,
          pickup_address: location.name,
          pickup_lat: location.lat,
          pickup_lng: location.lng
        })
      }
      setShowPickupSuggestions(false)
    } else {
      setFormData({
        ...formData,
        destination_address: location.name,
        destination_lat: location.lat,
        destination_lng: location.lng
      })
      setShowDestSuggestions(false)
    }
  }

  // --- Reverse Geocoding Helper ---
  const reverseGeocode = async (lat, lng) => {
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await response.json()

      if (data && data.address) {
        // Construct a nice short address
        const addr = data.address;
        const parts = [addr.road || addr.building, addr.suburb, addr.city_district].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : (data.display_name.split(',')[0]);
      }
      return 'Current Location';
    } catch (e) {
      console.error("Reverse geocode failed", e);
      return 'Current Location';
    }
  }

  // --- Get Live Location Helper ---
  const fetchCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setFormData(prev => ({ ...prev, pickup_address: "Fetching current location..." }))

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
        console.log("Got user location:", latitude, longitude)

        // 1. Set coords immediately
        setFormData(prev => ({
          ...prev,
          pickup_lat: latitude,
          pickup_lng: longitude,
          pickup_address: "Fetching address..."
        }))

        // 2. Get readable address
        const address = await reverseGeocode(latitude, longitude)
        setFormData(prev => ({
          ...prev,
          pickup_address: address
        }))

      }, (error) => {
        console.error("Error getting location", error)
        let errMsg = "Location access denied or failed."
        if (error.code === 1) errMsg = "Please allow location access."
        else if (error.code === 2) errMsg = "Location unavailable."
        else if (error.code === 3) errMsg = "Location request timed out."
        alert(errMsg)
        setFormData(prev => ({ ...prev, pickup_address: "" }))
      }, { enableHighAccuracy: true, timeout: 10000 })
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  // --- Get Live Location on Mount ---
  useEffect(() => {
    fetchCurrentLocation()
  }, [])

  // --- Geocoding Logic (Nominatim - Free/No Key) ---
  const geocodeAddress = async (address) => {
    try {
      // Search within India (countrycodes=in)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=in`)
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        }
      }
      return null
    } catch (error) {
      console.error("Geocoding failed:", error)
      return null
    }
  }

  // Handle manual search (Enter key or Blur)
  const handleAddressSearch = async (field, value) => {
    if (!value) return

    // 1. Check popular locations first (Instant match)
    const localMatch = popularLocations.find(loc =>
      loc.name.toLowerCase().includes(value.toLowerCase()) ||
      loc.name.toLowerCase() === value.toLowerCase()
    )

    if (localMatch) {
      handleLocationSelect(field, localMatch)
      return
    }

    // Special case for "Use Current Location" text if manually typed? Unlikely but good to handle
    if (field === 'pickup' && value.toLowerCase().includes("current location")) {
      fetchCurrentLocation()
      return
    }

    // 2. Fallback to Nominatim Geocoding
    setLoading(true)
    const coords = await geocodeAddress(value)
    setLoading(false)

    if (coords) {
      setFormData(prev => ({
        ...prev,
        [`${field}_address`]: value,
        [`${field}_lat`]: coords.lat,
        [`${field}_lng`]: coords.lng
      }))
      // Hide suggestions
      if (field === 'pickup') setShowPickupSuggestions(false)
      else setShowDestSuggestions(false)
    }
  }

  // --- Voice Booking Logic ---
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true)
        console.log("Voice recognition started")
      }

      recognition.onend = () => {
        setIsListening(false)
        console.log("Voice recognition ended")
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        console.error("Voice recognition error", event.error)

        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else if (event.error === 'network') {
          // Distinguish between actual offline state and service blocking
          const msg = navigator.onLine
            ? "Voice Service Unreachable (Firewall/AdBlock?)"
            : "No Internet Connection";
          setVoiceError(msg);
          setTimeout(() => setVoiceError(null), 4000);
        } else if (event.error === 'no-speech') {
          // Ignore
        } else {
          setVoiceError(`Error: ${event.error}`);
          setTimeout(() => setVoiceError(null), 4000);
        }
      }

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript
        console.log("Voice transcript:", transcript)

        let dest = transcript.replace(/^(i want to )?book (a )?ride to /i, '')
          .replace(/^go to /i, '')
          .replace(/^drive to /i, '')
          .replace(/^take me to /i, '')
          .trim();

        if (!dest) dest = transcript;
        dest = dest.replace(/[.,!?]$/, '');

        // Update Text
        handleInputChange('destination', dest)
        alert(`Recognized: "${dest}" - Searching location...`)

        // Trigger Search/Geocode
        await handleAddressSearch('destination', dest)
      }

      try {
        recognition.start()
      } catch (e) {
        console.error("Recognition start error:", e)
      }

    } else {
      alert("Voice Recognition not supported in this browser.")
    }
  }

  // --- Smart Price Prediction Logic ---
  const getPriceTrend = () => {
    const hours = new Date().getHours()
    // Peak hours: 8-10 AM and 5-8 PM
    if ((hours >= 8 && hours <= 10) || (hours >= 17 && hours <= 20)) {
      return { type: 'surge', text: 'Step Surge pricing implies high demand.', icon: <TrendingUp className="text-red-500 w-4 h-4" /> }
    }
    // Low demand: 11 AM - 3 PM
    if (hours >= 11 && hours <= 15) {
      return { type: 'low', text: 'Fares are lower than usual.', icon: <TrendingDown className="text-green-500 w-4 h-4" /> }
    }
    return { type: 'normal', text: 'Standard fair pricing.', icon: <Info className="text-blue-500 w-4 h-4" /> }
  }

  const priceTrend = getPriceTrend();

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!estimatedFare || !estimatedFare.fare) {
      alert('Please select pickup and destination locations first!')
      return
    }

    setLoading(true)

    try {
      const rideData = {
        pickup_address: formData.pickup_address,
        pickup_lat: formData.pickup_lat,
        pickup_lng: formData.pickup_lng,
        destination_address: formData.destination_address,
        destination_lat: formData.destination_lat,
        destination_lng: formData.destination_lng,
        vehicle_type: formData.vehicle_type
      }

      const response = await rideService.createRide(rideData)
      alert('Ride request sent successfully! Waiting for driver acceptance...')
      navigate('/rider')
    } catch (error) {
      console.error('Failed to book ride:', error)
      const detail = error.response?.data?.detail
      const status = error.response?.status
      const msg = error.message
      const errorText = detail ? (typeof detail === 'object' ? JSON.stringify(detail) : detail) : (msg || 'Unknown Error')
      alert(`⚠️ Failed to book ride.\nStatus: ${status || 'N/A'}\nError: ${errorText}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black border-b border-dark-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/rider')}
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Book a Local Ride</h1>
            {/* Voice Command Hint */}
            <div className="hidden md:flex items-center text-sm text-gray-500 bg-dark-800 px-3 py-1 rounded-full border border-dark-700">
              <Mic className="w-3 h-3 mr-2" />
              Try saying "Book ride to Airport"
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Map View */}
            <div className="md:col-span-3 mb-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">🗺️ Route Map</h3>
                <MapWithRoute
                  pickup={formData.pickup_lat ? {
                    lat: formData.pickup_lat,
                    lng: formData.pickup_lng,
                    address: formData.pickup_address
                  } : null}
                  destination={formData.destination_lat ? {
                    lat: formData.destination_lat,
                    lng: formData.destination_lng,
                    address: formData.destination_address
                  } : null}
                  onRouteCalculated={(info) => {
                    const distanceKm = parseFloat(info.distance);

                    // MAX DISTANCE CHECK (50km)
                    if (distanceKm > 50) {
                      setDistanceError(`Distance is too far (${distanceKm} km). Local rides are limited to 50 km.`);
                      setEstimatedFare(null); // Disable booking
                      setMapRouteInfo(null);
                      return;
                    }
                    setDistanceError(null);

                    setMapRouteInfo(info)
                    // Auto-update fare based on actual route distance
                    const baseFare = { economy: 50, suv: 120, luxury: 200 }
                    const perKmRate = { economy: 10, suv: 18, luxury: 25 }
                    const fare = baseFare[formData.vehicle_type] + (distanceKm * perKmRate[formData.vehicle_type])
                    setEstimatedFare({
                      distance: info.distance,
                      duration: info.duration,
                      fare: fare.toFixed(2),
                      pickupETA: info.pickupETA,
                      dropoffETA: info.dropoffETA
                    })
                  }}
                />
              </div>
            </div>

            {/* Booking Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Pickup Location */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline text-green-500 mr-1" />
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.pickup_address}
                      onChange={(e) => handleInputChange('pickup', e.target.value)}
                      onFocus={() => {
                        // Trigger suggestions immediately on focus
                        handleInputChange('pickup', formData.pickup_address)
                      }}
                      onBlur={() => setTimeout(() => handleAddressSearch('pickup', formData.pickup_address), 200)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch('pickup', formData.pickup_address)}
                      className="input-field pl-10"
                      placeholder="Search pickup location (e.g., BTM Layout)"
                      required
                      autoComplete="off"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {pickupSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => handleLocationSelect('pickup', loc)} // Use onMouseDown to prevent blur issues
                          className="w-full text-left px-4 py-2 hover:bg-dark-700 flex items-center space-x-2 transition-colors border-b border-dark-700 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-200">{loc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div className="relative">
                  <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>
                      <MapPin className="w-4 h-4 inline text-red-500 mr-1" />
                      Destination
                    </span>
                    <button
                      type="button"
                      onClick={startListening}
                      className={`text-xs flex items-center ${isListening ? 'text-red-500 animate-pulse' : 'text-primary hover:text-blue-400'}`}
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      {isListening ? 'Listening...' : 'Voice Search'}
                    </button>
                    {voiceError && (
                      <span className="absolute right-0 -top-6 text-xs text-red-400 bg-red-900/90 px-2 py-1 rounded shadow-lg animate-fade-in">
                        {voiceError}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.destination_address}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      onFocus={() => formData.destination_address && setShowDestSuggestions(true)}
                      onBlur={() => setTimeout(() => handleAddressSearch('destination', formData.destination_address), 200)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch('destination', formData.destination_address)}
                      className="input-field pl-10"
                      placeholder="Search destination (e.g., Indiranagar)"
                      required
                      autoComplete="off"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDestSuggestions && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {destSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => handleLocationSelect('destination', loc)}
                          className="w-full text-left px-4 py-2 hover:bg-dark-700 flex items-center space-x-2 transition-colors border-b border-dark-700 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-200">{loc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicle Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: 'economy' })}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${formData.vehicle_type === 'economy'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                      }`}
                  >
                    <Car className="w-8 h-8 mb-2" />
                    <span className="font-bold">Economy</span>
                    <span className="text-xs mt-1">₹50 + ₹10/km</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: 'suv' })}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${formData.vehicle_type === 'suv'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                      }`}
                  >
                    <Car className="w-8 h-8 mb-2" />
                    <span className="font-bold">SUV</span>
                    <span className="text-xs mt-1">₹120 + ₹18/km</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: 'luxury' })}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${formData.vehicle_type === 'luxury'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                      }`}
                  >
                    <Car className="w-8 h-8 mb-2" />
                    <span className="font-bold">Luxury</span>
                    <span className="text-xs mt-1">₹200 + ₹25/km</span>
                  </button>
                </div>
                {/* Error Message for Distance */}
                {distanceError && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm font-semibold flex items-center justify-center">
                    <Info className="w-4 h-4 mr-2" />
                    {distanceError}
                  </div>
                )}
                {/* Schedule Ride */}


                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-lg font-bold flex items-center justify-center"
                >
                  {loading ? 'Booking...' : 'Confirm Request'}
                </button>
              </form>
            </div>

            {/* Fare Estimate Panel */}
            <div className="md:col-span-1">
              <div className="card h-full">
                <h3 className="text-xl font-bold mb-6">Fare Estimate</h3>

                {estimatedFare ? (
                  <div className="space-y-6">
                    <div className="bg-dark-700 p-6 rounded-2xl text-center">
                      <p className="text-gray-400 text-sm mb-1">Estimated Fare</p>
                      <h2 className="text-4xl font-extrabold text-primary">₹{estimatedFare.fare}</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flexjustify-between items-center text-sm">
                        <span className="text-gray-400">Distance</span>
                        <span className="font-semibold">{estimatedFare.distance} km</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Est. Duration</span>
                        <span className="font-semibold">{estimatedFare.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Vehicle</span>
                        <span className="capitalize font-semibold">{formData.vehicle_type}</span>
                      </div>
                    </div>

                    <div className="border-t border-dark-700 pt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-green-500" />
                        <span>Pickup ETA: <span className="text-white">{estimatedFare.pickupETA}</span></span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        <span>Drop-off ETA: <span className="text-white">{estimatedFare.dropoffETA}</span></span>
                      </div>
                    </div>

                    {/* Price Trend Indicator */}
                    <div className={`p-4 rounded-xl border ${priceTrend.type === 'surge' ? 'bg-red-500/10 border-red-500/30' :
                      priceTrend.type === 'low' ? 'bg-green-500/10 border-green-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}>
                      <div className="flex items-center mb-1">
                        {priceTrend.icon}
                        <span className={`ml-2 font-semibold ${priceTrend.type === 'surge' ? 'text-red-400' :
                          priceTrend.type === 'low' ? 'text-green-400' :
                            'text-blue-400'
                          }`}>
                          {priceTrend.type === 'surge' ? 'Smart Fare Forecast' : 'Smart Fare Forecast'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{priceTrend.text}</p>
                    </div>

                    <p className="text-xs text-center text-gray-500 mt-4">
                      * Actual fare may vary based on traffic and route
                    </p>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <Car className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-center px-6">
                      Select pickup and destination to see fare estimate
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}