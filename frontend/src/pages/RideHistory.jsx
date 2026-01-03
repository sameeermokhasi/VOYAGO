import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { rideService } from '../services/api';
import { Clock, MapPin, Calendar, Navigation, Star } from 'lucide-react';

export default function RideHistory() {
    const { user } = useAuthStore();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const data = await rideService.getRides();
                // Filter for local rides only (exclude intercity or vacation if distinguishable, 
                // though currently the request says "add local rides ride history", implying standard rides)
                // We'll assume all rides returned by getRides are standard rides for now, 
                // as intercity/vacation might be stored differently or distinguishable by fields.
                // If needed, we can filter by `vacation_id` being null if we want to exclude vacation legs.

                // Sorting by date desc
                const sortedRides = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setRides(sortedRides);
            } catch (err) {
                console.error('Failed to fetch rides:', err);
                setError('Failed to load ride history');
            } finally {
                setLoading(false);
            }
        };

        fetchRides();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading ride history...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Ride History</h1>

                {rides.length === 0 ? (
                    <div className="text-center py-12 bg-dark-800 rounded-lg border border-dark-700">
                        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white">No rides yet</h3>
                        <p className="text-gray-400">Your completed rides will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rides.map((ride) => (
                            <div key={ride.id} className={`border-2 rounded-lg p-5 transition-all bg-dark-800 shadow-md ${ride.status === 'pending' ? 'border-yellow-500/50' :
                                ride.status === 'accepted' ? 'border-blue-500/50' :
                                    ride.status === 'in_progress' ? 'border-purple-500/50' :
                                        ride.status === 'completed' ? 'border-green-500/50' :
                                            'border-dark-700'
                                }`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${ride.status === 'completed' ? 'bg-green-900/50 text-green-200 border border-green-700' :
                                                ride.status === 'cancelled' ? 'bg-red-900/50 text-red-200 border border-red-700' :
                                                    'bg-blue-900/50 text-blue-200 border border-blue-700'
                                                }`}>
                                                {ride.status}
                                            </span>
                                            <span className="text-gray-400 text-sm ml-3 flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(ride.created_at).toLocaleDateString()} at {new Date(ride.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start">
                                                <div className="mt-1 mr-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 ring-4 ring-primary-900/30"></div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup</p>
                                                    <p className="font-medium text-white">{ride.pickup_address}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start">
                                                <div className="mt-1 mr-3">
                                                    <div className="w-2 h-2 rounded-full bg-white ring-4 ring-dark-600"></div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Dropoff</p>
                                                    <p className="font-medium text-white">{ride.destination_address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 md:mt-0 md:ml-6 text-right">
                                        <p className="text-3xl font-bold text-white">₹{ride.final_fare || ride.estimated_fare}</p>
                                        <p className="text-sm text-gray-400 capitalize mb-2">{ride.vehicle_type}</p>
                                        {ride.distance_km && (
                                            <p className="text-xs text-gray-500 mb-2">{ride.distance_km.toFixed(1)} km</p>
                                        )}
                                        {ride.rating && (
                                            <div className="mt-2 bg-dark-900/50 p-2 rounded-lg inline-block text-left min-w-[150px]">
                                                <div className="flex items-center justify-end text-primary-500 mb-1">
                                                    {[...Array(ride.rating)].map((_, i) => (
                                                        <Star key={i} size={14} className="fill-current" />
                                                    ))}
                                                </div>
                                                {ride.feedback && user?.role !== 'driver' && (
                                                    <p className="text-xs text-gray-400 italic text-right">"{ride.feedback}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
