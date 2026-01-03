import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, Car, ArrowRight, Clock, DollarSign, LogOut } from 'lucide-react'
import { intercityService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function IntercityRides() {
  const [cities, setCities] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    origin_city_id: '',
    destination_city_id: '',
    pickup_address: '',
    dropoff_address: '',
    scheduled_date: '',
    vehicle_type: 'economy',
    passengers: 1
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [citiesData, ridesData] = await Promise.all([
        intercityService.getCities(),
        intercityService.getRides()
      ])
      setCities(citiesData)
      setRides(ridesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await intercityService.createRide(formData)
      alert('Intercity ride booked successfully!')
      setShowBookingForm(false)
      loadData()
      setFormData({
        origin_city_id: '',
        destination_city_id: '',
        pickup_address: '',
        dropoff_address: '',
        scheduled_date: '',
        vehicle_type: 'economy',
        passengers: 1
      })
    } catch (error) {
      console.error('Failed to book ride:', error)
      alert('Failed to book ride. Please try again.')
    }
  }

  const handleAcceptRide = async (rideId) => {
    try {
      await intercityService.acceptRide(rideId)
      alert('Ride accepted successfully!')
      loadData()
    } catch (error) {
      console.error('Failed to accept ride:', error)
      alert('Failed to accept ride. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge'
  }

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId)
    return city ? city.name : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-dark-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">Intercity Rides</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(user?.role === 'rider' ? '/rider' : '/driver')} className="text-gray-400 hover:text-white">
                ← Back to Dashboard
              </button>
              <button onClick={logout} className="btn-outline text-sm text-white border-white hover:bg-white hover:text-black">
                <LogOut className="w-4 h-4 inline mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-900/50 to-primary-800/50 border border-primary-900 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Travel Between Cities</h1>
          <p className="text-lg text-primary-200 mb-6">
            Book comfortable intercity rides with professional drivers. Transparent pricing, scheduled departures.
          </p>
          {user?.role === 'rider' && (
            <button
              onClick={() => setShowBookingForm(true)}
              className="bg-white text-primary-900 hover:bg-gray-200 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Book Intercity Ride
            </button>
          )}
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-6">Book Intercity Ride</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Origin City</label>
                    <select
                      value={formData.origin_city_id}
                      onChange={(e) => setFormData({ ...formData, origin_city_id: e.target.value })}
                      className="input-field bg-dark-900 text-white border-dark-600"
                      required
                    >
                      <option value="">Select origin city</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Destination City</label>
                    <select
                      value={formData.destination_city_id}
                      onChange={(e) => setFormData({ ...formData, destination_city_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select destination</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pickup Address</label>
                  <input
                    type="text"
                    value={formData.pickup_address}
                    onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                    className="input-field"
                    placeholder="Enter pickup location in origin city"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Drop-off Address</label>
                  <input
                    type="text"
                    value={formData.dropoff_address}
                    onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                    className="input-field"
                    placeholder="Enter drop-off location in destination city"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Travel Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Passengers</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={formData.passengers}
                      onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Book Ride
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="btn-secondary flex-1 border-dark-600 text-gray-300 hover:bg-dark-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rides List */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">
            {user?.role === 'rider' ? 'My Intercity Rides' : 'Available Intercity Rides'}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No intercity rides found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <div key={ride.id} className="border border-dark-700 rounded-lg p-6 hover:border-primary-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-green-900/50 p-2 rounded-lg border border-green-900">
                          <MapPin className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-white">{getCityName(ride.origin_city_id)}</p>
                          <p className="text-sm text-gray-400">{ride.pickup_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center my-2">
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="bg-red-900/50 p-2 rounded-lg border border-red-900">
                          <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-white">{getCityName(ride.destination_city_id)}</p>
                          <p className="text-sm text-gray-400">{ride.dropoff_address}</p>
                        </div>
                      </div>
                    </div>

                    <span className={`${getStatusBadge(ride.status)}`}>
                      {ride.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-dark-700">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(ride.scheduled_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(ride.scheduled_date).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{ride.passengers} passenger(s)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Car className="w-4 h-4" />
                      <span className="capitalize">{ride.vehicle_type}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-dark-700">
                    <div>
                      {ride.distance_km && (
                        <p className="text-sm text-gray-600">
                          Distance: {ride.distance_km.toFixed(0)} km •
                          Duration: {ride.estimated_duration_hours?.toFixed(1)} hrs
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-primary-400">
                        ₹{ride.price.toFixed(2)}
                      </span>
                      {user?.role === 'driver' && ride.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptRide(ride.id)}
                          className="btn-primary text-sm py-2 px-4"
                        >
                          Accept Ride
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
