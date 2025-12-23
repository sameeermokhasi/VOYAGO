import { useState, useEffect } from 'react'
import { Users, Car, MapPin, Plane, Calendar, Wallet, LogOut, CheckCircle, XCircle, Activity, Bell, Clock, Star, AlertCircle, MessageCircle } from 'lucide-react'
import { adminService, vacationService, rideService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import ChatWindow from '../components/ChatWindow'
import AdminLiveMap from '../components/AdminLiveMap'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalDrivers: 0,
    totalRevenue: 0
  })
  const [users, setUsers] = useState([])
  const [vacations, setVacations] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeChat, setActiveChat] = useState(null)
  const { logout } = useAuthStore()

  const handleOpenChat = (driver, rideId = null) => {
    if (!driver) return;
    setActiveChat({
      userId: driver.id,
      name: driver.name,
      rideId: rideId
    })
  }

  useEffect(() => {
    loadData()

    // Set up interval to refresh data every 3 seconds for Real-Time Demo
    const interval = setInterval(() => {
      loadData()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsData, usersData, vacationsData, ridesData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        vacationService.getVacations(),
        rideService.getRides()
      ])
      setStats({
        totalUsers: statsData.total_users || 0,
        totalRides: statsData.total_rides || 0,
        totalDrivers: statsData.total_drivers || 0,
        totalRevenue: statsData.total_revenue || 0
      })
      setUsers(usersData)
      setVacations(vacationsData)
      setRides(ridesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserActive = async (userId) => {
    try {
      await adminService.toggleUserActive(userId)
      loadData()
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId)
        loadData()
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    }
  }

  const handleConfirmVacation = async (id) => {
    try {
      await vacationService.confirmVacation(id)
      alert('Vacation booking confirmed successfully!')
      loadData()
    } catch (error) {
      console.error('Failed to confirm vacation:', error)
      alert('Failed to confirm vacation. Please try again.')
    }
  }

  const handleCancelVacation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this vacation booking?')) {
      try {
        await vacationService.cancelVacation(id)
        alert('Vacation booking cancelled successfully!')
        loadData()
      } catch (error) {
        console.error('Failed to cancel vacation:', error)
        alert('Failed to cancel vacation. Please try again.')
      }
    }
  }

  const handleCancelRide = async (id) => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      try {
        await rideService.cancelRide(id)
        alert('Ride cancelled successfully!')
        loadData()
      } catch (error) {
        console.error('Failed to cancel ride:', error)
        alert('Failed to cancel ride. Please try again.')
      }
    }
  }

  // Get recent activity for the dashboard
  const getRecentActivity = () => {
    const activity = []

    // Add ride activities
    rides.forEach(ride => {
      activity.push({
        id: `ride-${ride.id}`,
        type: 'ride',
        action: ride.status,
        user: ride.rider?.name || 'Unknown Rider',
        driver: ride.driver?.name,
        timestamp: ride.created_at,
        details: `${ride.pickup_address} to ${ride.destination_address}`,
        rating: ride.rating,
        feedback: ride.feedback,
        status: ride.status
      })
    })

    // Add vacation activities
    vacations.forEach(vacation => {
      activity.push({
        id: `vacation-${vacation.id}`,
        type: 'vacation',
        action: vacation.status,
        user: vacation.user?.name || 'Unknown User',
        timestamp: vacation.created_at,
        details: `Trip to ${vacation.destination}`,
        status: vacation.status
      })
    })

    // Sort by timestamp
    return activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const getActivityIcon = (type, action) => {
    if (type === 'ride') {
      if (action === 'accepted') return <CheckCircle className="w-5 h-5 text-green-500" />
      if (action === 'in_progress') return <Activity className="w-5 h-5 text-blue-500" />
      if (action === 'completed') return <CheckCircle className="w-5 h-5 text-purple-500" />
      if (action === 'cancelled') return <XCircle className="w-5 h-5 text-red-500" />
      return <Car className="w-5 h-5 text-gray-500" />
    } else {
      if (action === 'confirmed') return <CheckCircle className="w-5 h-5 text-green-500" />
      if (action === 'pending') return <Clock className="w-5 h-5 text-yellow-500" />
      if (action === 'cancelled') return <XCircle className="w-5 h-5 text-red-500" />
      return <Plane className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityColor = (type, action) => {
    if (type === 'ride') {
      if (action === 'accepted') return 'bg-green-900/50 text-green-400 border-green-900'
      if (action === 'in_progress') return 'bg-blue-900/50 text-blue-400 border-blue-900'
      if (action === 'completed') return 'bg-purple-900/50 text-purple-400 border-purple-900'
      if (action === 'cancelled') return 'bg-red-900/50 text-red-400 border-red-900'
      return 'bg-dark-800 text-gray-400 border-dark-700'
    } else {
      if (action === 'confirmed') return 'bg-green-900/50 text-green-400 border-green-900'
      if (action === 'pending') return 'bg-yellow-900/50 text-yellow-400 border-yellow-900'
      if (action === 'cancelled') return 'bg-red-900/50 text-red-400 border-red-900'
      return 'bg-dark-800 text-gray-400 border-dark-700'
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-dark-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">Admin Dashboard</span>
            </div>
            <button onClick={logout} className="btn-outline text-sm text-white border-white hover:bg-white hover:text-black">
              <LogOut className="w-4 h-4 inline mr-1" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'overview'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'users'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('vacations')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'vacations'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Vacation Bookings
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'rides'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Ride Management
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'activity'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('all_activities')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'all_activities'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            All Activities
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

            {/* Live Operations Map */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <AdminLiveMap rides={rides} />
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <Car className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-gray-400">Total Rides</p>
                      <p className="text-2xl font-bold text-white">{stats.totalRides}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-gray-400">Total Drivers</p>
                      <p className="text-2xl font-bold text-white">{stats.totalDrivers}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <Wallet className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-gray-400">Total Platform Revenue (20%)</p>
                      <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity Preview */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-2" />
                Recent Activity
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getRecentActivity().slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center p-4 bg-dark-800 border border-dark-700 rounded-lg">
                      <div className="mr-4">
                        {getActivityIcon(activity.type, activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-white">{activity.user}</p>
                          <span className="text-sm text-gray-400">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{activity.details}</p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full border ${getActivityColor(activity.type, activity.action)}`}>
                          {activity.type === 'ride' ? 'Ride' : 'Vacation'}: {activity.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">User Management</h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700">
                  <thead className="bg-dark-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-900/50 flex items-center justify-center">
                                <span className="text-primary-400 font-bold">{user.name.charAt(0)}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-400 border border-blue-900">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {user.is_active ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-400 border border-green-900">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/50 text-red-400 border border-red-900">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleUserActive(user.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vacations Tab */}
        {activeTab === 'vacations' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Vacation Bookings</h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {vacations.map((vacation) => (
                  <div key={vacation.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{vacation.destination}</h3>
                        <p className="text-sm text-gray-400">Booking #{vacation.booking_reference}</p>
                      </div>
                      <span className={`badge ${vacation.status === 'confirmed' ? 'badge-success' :
                        vacation.status === 'pending' ? 'badge-warning' :
                          vacation.status === 'cancelled' ? 'badge-danger' : 'badge'
                        }`}>
                        {vacation.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(vacation.start_date).toLocaleDateString()} - {new Date(vacation.end_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        {vacation.passengers} travelers
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Wallet className="w-4 h-4 mr-2" />
                        ₹{vacation.total_price?.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {vacation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirmVacation(vacation.id)}
                            className="btn-sm btn-success"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancelVacation(vacation.id)}
                            className="btn-sm btn-danger"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {vacation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelVacation(vacation.id)}
                          className="btn-sm btn-danger"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Ride Management</h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700">
                  <thead className="bg-dark-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ride ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rider</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Route</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fare</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Feedback</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {rides.map((ride) => (
                      <tr key={ride.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">#{ride.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{ride.rider?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{ride.driver?.name || 'Unassigned'}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div className="max-w-xs truncate">
                            {ride.pickup_address} → {ride.destination_address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ride.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-900' :
                            ride.status === 'accepted' ? 'bg-blue-900/50 text-blue-400 border border-blue-900' :
                              ride.status === 'in_progress' ? 'bg-purple-900/50 text-purple-400 border border-purple-900' :
                                ride.status === 'completed' ? 'bg-green-900/50 text-green-400 border border-green-900' :
                                  'bg-red-900/50 text-red-400 border border-red-900'
                            }`}>
                            {ride.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">₹{ride.estimated_fare?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500">
                          {ride.rating ? (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 fill-current mr-1" />
                              {ride.rating}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 italic">
                          {ride.feedback ? `"${ride.feedback}"` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {['pending', 'accepted', 'in_progress'].includes(ride.status) && (
                            <button
                              onClick={() => handleCancelRide(ride.id)}
                              className="text-red-500 hover:text-red-400 flex items-center"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </button>
                          )}
                          {ride.driver && (
                            <button
                              onClick={() => handleOpenChat(ride.driver, ride.id)}
                              className="text-blue-500 hover:text-blue-400 flex items-center ml-3"
                              title="Message Driver"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Driver
                            </button>
                          )}
                          {ride.rider && (
                            <button
                              onClick={() => handleOpenChat(ride.rider, ride.id)}
                              className="text-green-500 hover:text-green-400 flex items-center ml-3"
                              title="Message Rider"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Rider
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Recent Activity</h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Rider Perspective */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400">
                    <Users className="w-5 h-5 mr-2" />
                    Rider Updates
                  </h2>
                  <div className="space-y-4">
                    {getRecentActivity()
                      .filter(a => a.type === 'ride' && (a.action === 'pending' || a.action === 'cancelled' || a.rating))
                      .slice(0, 20)
                      .map((activity) => (
                        <div key={activity.id} className="card border-l-4 border-l-blue-500">
                          <div className="flex items-start">
                            <div className="mr-4 mt-1">
                              {getActivityIcon(activity.type, activity.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-bold text-lg text-white">{activity.user}</h3>
                                <span className="text-sm text-gray-400">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-400 mt-1">{activity.details}</p>
                              <div className="flex items-center mt-2 flex-wrap gap-2">
                                <span className={`inline-block px-3 py-1 text-sm rounded-full border ${getActivityColor(activity.type, activity.action)}`}>
                                  {activity.action === 'pending' ? 'Requested Ride' : activity.action}
                                </span>
                                {activity.rating && (
                                  <span className="flex items-center px-3 py-1 text-sm rounded-full bg-yellow-900/30 text-yellow-500 border border-yellow-900/50">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    {activity.rating}/5
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {getRecentActivity().filter(a => a.type === 'ride' && (a.action === 'pending' || a.action === 'cancelled' || a.rating)).length === 0 && (
                      <p className="text-gray-500 italic">No recent rider activity</p>
                    )}
                  </div>
                </div>

                {/* Driver Perspective */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center text-green-400">
                    <Car className="w-5 h-5 mr-2" />
                    Driver Updates
                  </h2>
                  <div className="space-y-4">
                    {getRecentActivity()
                      .filter(a => a.type === 'ride' && (a.action === 'accepted' || a.action === 'in_progress' || a.action === 'completed'))
                      .slice(0, 20)
                      .map((activity) => (
                        <div key={activity.id} className="card border-l-4 border-l-green-500">
                          <div className="flex items-start">
                            <div className="mr-4 mt-1">
                              {getActivityIcon(activity.type, activity.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-bold text-lg text-white">{activity.driver || 'Assigned Driver'}</h3>
                                <span className="text-sm text-gray-400">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-400 mt-1">Ride for {activity.user}</p>
                              <p className="text-sm text-gray-500">{activity.details}</p>
                              <div className="flex items-center mt-2 flex-wrap gap-2">
                                <span className={`inline-block px-3 py-1 text-sm rounded-full border ${getActivityColor(activity.type, activity.action)}`}>
                                  {activity.action}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {getRecentActivity().filter(a => a.type === 'ride' && (a.action === 'accepted' || a.action === 'in_progress' || a.action === 'completed')).length === 0 && (
                      <p className="text-gray-500 italic">No recent driver activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Activities Tab */}
        {activeTab === 'all_activities' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">All Activities</h1>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {getRecentActivity().map((activity) => (
                  <div key={activity.id} className="card">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        {getActivityIcon(activity.type, activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-lg text-white">{activity.user}</h3>
                          <span className="text-sm text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-1">{activity.details}</p>
                        <div className="flex items-center mt-2 flex-wrap gap-2">
                          <span className={`inline-block px-3 py-1 text-sm rounded-full border ${getActivityColor(activity.type, activity.action)}`}>
                            {activity.type === 'ride' ? 'Ride' : 'Vacation'}: {activity.action}
                          </span>
                          {activity.rating && (
                            <span className="flex items-center px-3 py-1 text-sm rounded-full bg-yellow-900/30 text-yellow-500 border border-yellow-900/50">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              {activity.rating}/5
                            </span>
                          )}
                          {activity.feedback && (
                            <span className="px-3 py-1 text-sm rounded-full bg-dark-700 text-gray-300 border border-dark-600 italic">
                              "{activity.feedback}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {
        activeChat && (
          <ChatWindow
            receiverId={activeChat.userId}
            receiverName={activeChat.name}
            rideId={activeChat.rideId}
            onClose={() => setActiveChat(null)}
          />
        )
      }
    </div >
  )
}