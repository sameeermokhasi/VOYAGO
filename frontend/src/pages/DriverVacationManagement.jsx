import { useState, useEffect } from 'react'
import { Plane, Hotel, Car, Calendar, Users, MapPin, CheckCircle, XCircle, Clock, Utensils } from 'lucide-react'
import { vacationService } from '../services/api'

export default function DriverVacationManagement() {
  const [pendingVacations, setPendingVacations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingVacations()
  }, [])

  const loadPendingVacations = async () => {
    try {
      const allVacations = await vacationService.getVacations()
      const pending = allVacations.filter(vacation => vacation.status === 'pending')
      setPendingVacations(pending)
    } catch (error) {
      console.error('Failed to load pending vacations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmVacation = async (id) => {
    try {
      await vacationService.confirmVacation(id)
      alert('Vacation booking confirmed successfully!')
      loadPendingVacations()
    } catch (error) {
      console.error('Failed to confirm vacation:', error)
      alert('Failed to confirm vacation. Please try again.')
    }
  }

  // Parse schedule data if available
  const parseSchedule = (scheduleJson) => {
    try {
      return JSON.parse(scheduleJson);
    } catch (e) {
      return null;
    }
  }

  return (
    <div className="card mt-8">
      <h2 className="text-2xl font-bold mb-6 text-white">🏖️ Pending Vacation Bookings</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : pendingVacations.length === 0 ? (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No pending vacation bookings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingVacations.map((vacation) => {
            const schedule = vacation.schedule ? parseSchedule(vacation.schedule) : null;

            return (
              <div key={vacation.id} className="border-2 border-purple-900 bg-dark-800 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-warning">⏳ PENDING CONFIRMATION</span>
                  <span className="text-sm text-gray-400">#{vacation.booking_reference}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <h3 className="text-lg font-bold text-white">{vacation.destination}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-gray-400">Dates</p>
                      <p className="font-medium text-gray-200">
                        {new Date(vacation.start_date).toLocaleDateString()} - {new Date(vacation.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Travelers</p>
                      <p className="font-medium text-gray-200">{vacation.passengers}</p>
                    </div>
                  </div>

                  {vacation.hotel_name && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400">Hotel</p>
                      <p className="font-medium text-gray-200">{vacation.hotel_name}</p>
                    </div>
                  )}

                  {/* Display schedule information if available */}
                  {schedule && (
                    <div className="mt-3 p-3 bg-dark-900 rounded-lg border border-dark-700">
                      <h4 className="font-bold text-sm mb-2 text-white">Trip Schedule</h4>
                      {schedule.flightDetails && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-400 flex items-center">
                            <Plane className="w-4 h-4 mr-1" />
                            Flight: {schedule.flightDetails}
                          </p>
                        </div>
                      )}
                      {schedule.mealTimings && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-400 flex items-center">
                            <Utensils className="w-4 h-4 mr-1" />
                            Meals: {schedule.mealTimings}
                          </p>
                        </div>
                      )}
                      {schedule.activities && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Activities: {schedule.activities}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    {vacation.ride_included && (
                      <span className="flex items-center text-green-400">
                        <Car className="w-4 h-4 mr-1" />
                        Transport
                      </span>
                    )}
                    {vacation.hotel_included && (
                      <span className="flex items-center text-green-400">
                        <Hotel className="w-4 h-4 mr-1" />
                        Hotel
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-dark-700">
                  <span className="text-2xl font-bold text-primary-400">
                    ₹{vacation.total_price.toFixed(2)}
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleConfirmVacation(vacation.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}