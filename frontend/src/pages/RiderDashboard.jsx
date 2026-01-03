import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, MapPin, Clock, AlertCircle, CheckCircle, Navigation as NavIcon, XCircle, Search, LogOut, ArrowRight, Plane, User, Activity } from 'lucide-react'
import { rideService, vacationService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { websocketService } from '../services/websocket'
import DriverRouteMap from '../components/DriverRouteMap'
import VacationSchedulePlanner from '../components/VacationSchedulePlanner'
import ChatWindow from '../components/ChatWindow' // Import ChatWindow
import RateRideModal from '../components/RateRideModal'
import AIChatbot from '../components/AIChatbot'
import MotionEaseOverlay from '../components/MotionEaseOverlay'

export default function RiderDashboard() {
  const [rides, setRides] = useState([])
  const [vacations, setVacations] = useState([]) // Add vacations state
  const [loading, setLoading] = useState(true)
  const [driverLocations, setDriverLocations] = useState({})
  const [activeChat, setActiveChat] = useState(null); // Chat State
  const [showVacationPlanner, setShowVacationPlanner] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [rideToRate, setRideToRate] = useState(null)
  const [showSafetyAlert, setShowSafetyAlert] = useState(false) // NEW: Safety Alert State
  const [showMotionEase, setShowMotionEase] = useState(false) // NEW: Motion Ease State
  const alertAcknowledged = useRef(false) // Track if alert has been seen
  const [error, setError] = useState(null)
  const { user, logout } = useAuthStore()

  // Safety Alert Listener
  useEffect(() => {
    const handleSafetyAlert = (data) => {
      // Only show alert if it hasn't been acknowledged yet
      if (data && data.type === 'SAFETY_ALERT' && !alertAcknowledged.current) {
        setShowSafetyAlert(true);
      }
    };

    websocketService.addListener('message', handleSafetyAlert);
    return () => websocketService.removeListener('message', handleSafetyAlert);
  }, []);

  useEffect(() => {
    loadRides()
    // Force reload after a short delay to handle potential race conditions after navigation
    const timeout = setTimeout(loadRides, 500)

    // Auto-refresh every 5 seconds for real-time updates
    // Stop refreshing if chat is open to prevent UI resets/glitches
    const interval = setInterval(() => {
      if (!activeChat) {
        loadRides();
      }
    }, 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [activeChat])

  // WebSocket listener for real-time updates
  useEffect(() => {
    const handleWebSocketMessage = (data) => {
      if (data.type === 'driver_location_update') {
        // Update driver location for a specific ride
        setDriverLocations(prev => ({
          ...prev,
          [data.ride_id]: {
            lat: data.lat,
            lng: data.lng
          }
        }))
      } else if (data.type === 'ride_status_update') {
        // Refresh rides when status changes
        loadRides()
        // Show notification based on status
        const rideId = data.ride_id;
        const status = data.status;

        // Show browser notification
        if (Notification.permission === 'granted') {
          let title = '';
          let body = '';

          switch (status) {
            case 'accepted':
              title = 'Ride Accepted!';
              body = 'A driver has accepted your ride request. Your driver is on the way!';
              break;
            case 'in_progress':
              title = 'Ride Started!';
              body = 'Your ride is now in progress. Enjoy your journey!';
              break;
            case 'completed':
              title = 'Ride Completed!';
              body = 'Your ride has been completed. Thank you for using our service!';
              break;
            case 'cancelled':
              title = 'Ride Cancelled';
              body = 'Your ride has been cancelled. We apologize for the inconvenience.';
              break;
            default:
              return;
          }

          new Notification(title, {
            body: body,
            icon: '/favicon.ico'
          });
        }

        // Show alert for critical status changes
        switch (status) {
          case 'accepted':
            // Don't show alert for accepted as it might be disruptive
            break;
          case 'in_progress':
            // Don't show alert for in_progress as it might be disruptive
            break;
          case 'completed':
            // Find the ride object to pass to the modal
            // We might need to fetch the ride details if it's not in the current list or if the list is stale
            // But for now, let's try to find it in the existing list or wait for loadRides to update it
            // Actually, loadRides is called above, but it's async.
            // Let's set a timeout to allow loadRides to complete, or just fetch the specific ride?
            // Simpler: just set the ID and let the modal handle it or finding it from the updated list.
            // But we need the ride object for the modal.
            // Let's rely on the fact that loadRides is called.

            // Better approach: Just set the ID and let a useEffect watch for it?
            // Or just fetch the single ride.
            rideService.getRides().then(updatedRides => {
              const completedRide = updatedRides.find(r => r.id === rideId);
              if (completedRide) {
                setRideToRate(completedRide);
                setShowRateModal(true);
              }
            });
            break;
          case 'cancelled':
            alert('Your ride has been cancelled by the driver. We apologize for the inconvenience.');
            break;
          default:
            break;
        }
      } else if (data.type === 'vacation_status_update') {
        // Refresh vacations when status changes
        loadRides()
      }
    }

    websocketService.addListener('message', handleWebSocketMessage)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      websocketService.removeListener('message', handleWebSocketMessage)
    }
  }, [])

  const loadRides = async () => {
    try {
      // Use Promise.allSettled to ensure one failure doesn't block the other
      const [ridesResult, vacationsResult] = await Promise.allSettled([
        rideService.getRides(),
        vacationService.getVacations()
      ])

      if (ridesResult.status === 'fulfilled' && Array.isArray(ridesResult.value)) {
        setRides(ridesResult.value)
        setError(null) // Clear error on success
      } else {
        console.error('Failed to load rides or invalid format:', ridesResult)
        const errorMessage = ridesResult.status === 'rejected'
          ? (ridesResult.reason?.response?.data?.detail || ridesResult.reason?.message || 'Unknown error')
          : 'Invalid data format received';
        setError(`Failed to load rides: ${errorMessage}`)
        if (ridesResult.status === 'fulfilled') setRides([])
      }

      if (vacationsResult.status === 'fulfilled') {
        setVacations(vacationsResult.value)
      } else {
        console.error('Failed to load vacations:', vacationsResult.reason)
      }
    } catch (error) {
      console.error('Unexpected error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-info',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'in_progress':
        return <NavIcon className="w-5 h-5 text-purple-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '⏳ Finding driver...'
      case 'accepted':
        return '✅ Driver accepted! Arriving soon...'
      case 'in_progress':
        return '🚗 Ride in progress'
      case 'completed':
        return '✅ Ride completed'
      case 'cancelled':
        return '❌ Ride cancelled'
      default:
        return status
    }
  }

  // Get active ride (pending, accepted, or in progress)
  // Ensure we get the latest one by sorting locally just in case
  const sortedRides = Array.isArray(rides) ? [...rides].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return (dateB || 0) - (dateA || 0);
  }) : [];

  console.log('DEBUG: All Rides:', rides);
  console.log('DEBUG: Sorted Rides:', sortedRides);

  const activeRide = sortedRides.find(ride =>
    ['pending', 'accepted', 'in_progress'].includes(ride.status?.toLowerCase())
  )

  console.log('DEBUG: Active Ride:', activeRide);

  // Get active vacation (confirmed, in progress, or completed)
  const activeVacation = vacations.find(v =>
    ['confirmed', 'in_progress', 'completed'].includes(v.status)
  )

  const handleCancelRide = async (rideId) => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      try {
        await rideService.cancelRide(rideId);
        alert('Ride cancelled successfully');
        loadRides();
      } catch (error) {
        console.error('Failed to cancel ride:', error);
        alert('Failed to cancel ride. Please try again.');
      }
    }
  };

  const handleRateSuccess = () => {
    loadRides();
    // Optional: Show a success message
  };

  const handleStartNextRide = async (vacationId) => {
    try {
      if (!window.confirm('Are you sure you want to start the next ride for this vacation?')) {
        return;
      }

      const response = await vacationService.scheduleNextRide(vacationId);
      if (response && response.ride) {
        alert('Next ride started successfully! Driver has been notified.');
        loadRides();
      } else {
        alert('No more rides scheduled for this vacation or next ride already active.');
      }
    } catch (error) {
      console.error('Failed to start next ride:', error);
      alert('Failed to start next ride. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}


      <div className="container mx-auto px-6 py-8">
        {/* Vacation Planner Toggle & Refresh */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowVacationPlanner(!showVacationPlanner)}
            className="btn-primary"
          >
            {showVacationPlanner ? 'Hide Vacation Planner' : 'Show Vacation Planner'}
          </button>

          <div className="flex items-center space-x-3">
            {/* Motion Ease Toggle */}
            <button
              onClick={() => setShowMotionEase(!showMotionEase)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${showMotionEase
                ? 'bg-green-900/50 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-indigo-900 border-indigo-700 text-gray-200 hover:border-gray-500'
                }`}
              title="Toggle Anti-Motion Sickness Mode"
            >
              <Activity className={`w-5 h-5 ${showMotionEase ? 'animate-pulse' : ''}`} />
              <span className="hidden md:inline font-bold">
                {showMotionEase ? 'Wellness Mode ON 😌' : 'Wellness Mode OFF'}
              </span>
            </button>

            <button
              onClick={loadRides}
              className="p-2 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Refresh Rides"
            >
              <Clock className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Vacation Schedule Planner */}
        {showVacationPlanner && (
          <div className="mb-8">
            <VacationSchedulePlanner />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to="/rider/book" className="card hover:shadow-xl transition-all duration-300 text-center">
            <Car className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Book Local Ride</h3>
            <p className="text-gray-600">Quick rides within your city</p>
          </Link>

          <Link to="/vacation" className="card hover:shadow-xl transition-all duration-300 text-center">
            <Plane className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Plan Vacation</h3>
            <p className="text-gray-600">Complete travel packages</p>
          </Link>
        </div>

        {/* Active Vacation */}
        {activeVacation && (
          <div className="card mb-8 border-2 border-purple-500/50">
            <h2 className="text-2xl font-bold mb-4">🏖️ Active Vacation</h2>
            <div className="mb-4 p-4 bg-dark-900 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Plane className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="font-bold text-lg text-white">
                      {activeVacation.status === 'confirmed' ? '✅ Vacation Confirmed!' :
                        activeVacation.status === 'completed' ? '🏁 Vacation Completed!' :
                          '🚗 Vacation In Progress'}
                    </p>
                    <p className="text-xs text-gray-400">Booking #{activeVacation.id}</p>
                  </div>
                </div>
                <span className={`badge ${activeVacation.status === 'confirmed' ? 'badge-info' :
                  activeVacation.status === 'completed' ? 'badge-success' :
                    'badge-warning'
                  }`}>
                  {activeVacation.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-primary-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Destination</p>
                  <p className="font-semibold text-lg">{activeVacation.destination}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Hotel</p>
                  <p className="font-semibold text-lg">{activeVacation.hotel_name || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Confirmed</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all duration-1000 ${activeVacation.status === 'confirmed' ? 'bg-blue-500 w-1/2' :
                  activeVacation.status === 'in_progress' ? 'bg-purple-500 w-3/4' :
                    'bg-green-500 w-full'
                  }`}></div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center space-y-3">
              <p className="text-sm text-gray-600">
                {activeVacation.status === 'confirmed'
                  ? 'Your driver has confirmed the trip. Get ready!'
                  : activeVacation.status === 'completed'
                    ? 'Your vacation trip has been completed. We hope you had a great time!'
                    : 'Your vacation travel is currently in progress. Enjoy!'}
              </p>

              {/* Start Next Leg Button */}
              {activeVacation.status === 'confirmed' && !activeVacation.has_active_ride && !activeVacation.is_fixed_package && (
                <button
                  onClick={() => handleStartNextRide(activeVacation.id)}
                  className="btn-primary w-full md:w-auto flex items-center justify-center px-6 py-3 text-lg shadow-lg animate-pulse"
                >
                  <Car className="w-5 h-5 mr-2" />
                  START NEXT LEG RIDE
                </button>
              )}

              {/* Link to Full Plan */}
              <Link to="/rider/vacation-booking" className="text-primary-600 hover:text-primary-500 text-sm font-semibold flex items-center">
                <Plane className="w-4 h-4 mr-1" />
                View Full Vacation Plan & Checklist
              </Link>
            </div>
          </div>
        )}

        {/* Active Ride with Real-time Map */}
        {activeRide && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">📍 Active Ride</h2>
            <div className="mb-4 p-4 bg-dark-900 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(activeRide.status)}
                  <div>
                    <p className="font-bold text-lg text-white">{getStatusText(activeRide.status)}</p>
                    <p className="text-xs text-gray-400">Ride #{activeRide.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {['accepted', 'in_progress'].includes(activeRide.status) ? (
                    <button
                      onClick={() => setActiveChat({ id: activeRide.driver_id || 2, name: 'Driver' })}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center transition-all"
                    >
                      <span className="mr-1">💬</span> Message
                    </button>
                  ) : (
                    <div className="hidden md:block text-xs text-gray-500 italic mr-2">
                      {activeRide.status === 'pending' ? 'Waiting for driver...' : ''}
                    </div>
                  )}
                  <span className={`${getStatusBadge(activeRide.status)} text-xs`}>
                    {activeRide.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className={activeRide.status === 'pending' ? 'text-yellow-600 font-bold' : ''}>Requested</span>
                <span className={activeRide.status === 'accepted' ? 'text-blue-600 font-bold' : ''}>Accepted</span>
                <span className={activeRide.status === 'in_progress' ? 'text-purple-600 font-bold' : ''}>In Progress</span>
                <span className={activeRide.status === 'completed' ? 'text-green-600 font-bold' : ''}>Completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all duration-1000 ${activeRide.status === 'pending' ? 'bg-yellow-500 w-1/4' :
                  activeRide.status === 'accepted' ? 'bg-blue-500 w-1/2' :
                    activeRide.status === 'in_progress' ? 'bg-purple-500 w-3/4' :
                      'bg-green-500 w-full'
                  }`}></div>
              </div>
            </div>

            {/* Real-time Map */}
            <DriverRouteMap
              ride={activeRide}
              driverLocation={driverLocations[activeRide.id]}
            />
          </div>
        )}

        {/* Recent Rides */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Rides</h2>
            <span className="text-sm text-gray-500">Auto-updating every 5s</span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rides...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No rides yet</p>
              <p className="text-gray-400 mt-2">Book your first ride to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.slice(0, 5).map((ride) => (
                <div key={ride.id} className={`border-2 rounded-lg p-5 transition-all bg-dark-800 ${ride.status === 'pending' ? 'border-yellow-500/50' :
                  ride.status === 'accepted' ? 'border-blue-500/50' :
                    ride.status === 'in_progress' ? 'border-purple-500/50' :
                      ride.status === 'completed' ? 'border-green-500/50' :
                        'border-dark-700'
                  }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(ride.status)}
                      <div>
                        <p className="font-bold text-lg">{getStatusText(ride.status)}</p>
                        <p className="text-xs text-gray-500">Ride #{ride.id}</p>
                      </div>
                    </div>
                    <span className={`${getStatusBadge(ride.status)} text-xs`}>
                      {ride.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar for All Rides */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Requested</span>
                      <span>Accepted</span>
                      <span>In Progress</span>
                      <span>Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all duration-1000 ${ride.status === 'pending' ? 'bg-yellow-500 w-1/4' :
                        ride.status === 'accepted' ? 'bg-blue-500 w-1/2' :
                          ride.status === 'in_progress' ? 'bg-purple-500 w-3/4' :
                            'bg-green-500 w-full'
                        }`}></div>
                    </div>
                  </div>

                  <div className="flex-1 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{ride.destination_address}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(ride.created_at).toLocaleDateString()}
                      </span>
                      {ride.distance_km && (
                        <span>{ride.distance_km.toFixed(1)} km</span>
                      )}
                    </div>
                    {ride.estimated_fare && (
                      <span className="flex items-center font-semibold text-primary-600 text-lg">
                        ₹{ride.estimated_fare.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {/* Cancel button for pending rides */}
                  {ride.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleCancelRide(ride.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Ride
                      </button>
                    </div>
                  )}
                  {/* Special message for accepted rides */}
                  {ride.status === 'accepted' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-blue-600 font-medium">
                        🚗 Your driver is on the way! Please wait at the pickup location.
                      </p>
                    </div>
                  )}
                  {/* Special message for in_progress rides */}
                  {ride.status === 'in_progress' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-purple-600 font-medium">
                        🚙 Your ride is in progress. Enjoy your journey!
                      </p>
                    </div>
                  )}
                  {/* Rate button for completed rides if not rated yet */}
                  {ride.status === 'completed' && !ride.rating && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setRideToRate(ride);
                          setShowRateModal(true);
                        }}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <span className="mr-2">⭐</span>
                        Rate Ride
                      </button>
                    </div>
                  )}
                  {/* Show rating if already rated */}
                  {ride.status === 'completed' && ride.rating && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center text-yellow-500">
                      <span className="font-medium mr-1">You rated:</span>
                      {[...Array(ride.rating)].map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* Rate Ride Modal */}
      {showRateModal && rideToRate && (
        <RateRideModal
          ride={rideToRate}
          onClose={() => setShowRateModal(false)}
          onRateSuccess={handleRateSuccess}
        />
      )}

      {/* NEW: Safety Alert Modal */}
      {showSafetyAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-dark-900 border-2 border-red-600 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-red-600/10 animate-pulse"></div>
            <div className="relative z-10 text-center">
              <div className="mx-auto w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-wider">DANGER DETECTED</h2>
              <p className="text-xl text-red-400 font-bold mb-6">DRIVER ALERT SYSTEM TRIGGERED</p>
              <p className="text-gray-300 text-sm mb-8">
                The AI Monitor has detected an issue (Drowsiness or Driver Distraction). Please contact the driver immediately.
              </p>
              <button
                onClick={() => {
                  setShowSafetyAlert(false);
                  alertAcknowledged.current = true; // Prevent future alerts
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-transform hover:scale-105 active:scale-95"
              >
                ACKNOWLEDGE ALERT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Motion Ease Overlay */}
      {showMotionEase && (
        <MotionEaseOverlay onClose={() => setShowMotionEase(false)} />
      )}

      <AIChatbot role="rider" />

      {/* Chat Window Overlay */}
      {activeChat && (
        <ChatWindow
          receiverId={activeChat.id}
          receiverName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  )
}