import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Save } from 'lucide-react';
import { vacationService } from '../services/api';

export default function EditVacationChecklistModal({ vacation, onClose, onSuccess }) {
    const [activities, setActivities] = useState([]);
    const [schedule, setSchedule] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newActivity, setNewActivity] = useState({ date: '', time: '', location: '', description: '' });
    const [tripDates, setTripDates] = useState({ start_date: '', end_date: '' });

    useEffect(() => {
        try {
            if (vacation.activities) {
                setActivities(JSON.parse(vacation.activities));
            }
            if (vacation.schedule) {
                setSchedule(JSON.parse(vacation.schedule));
            }
            // Initialize dates
            setTripDates({
                start_date: vacation.start_date ? vacation.start_date.split('T')[0] : '',
                end_date: vacation.end_date ? vacation.end_date.split('T')[0] : ''
            });
        } catch (e) {
            console.error("Error parsing vacation data", e);
        }
    }, [vacation]);

    const handleAddActivity = () => {
        if (!newActivity.date || !newActivity.time || !newActivity.location) return;
        setActivities([...activities, { ...newActivity }]);
        setNewActivity({ date: '', time: '', location: '', description: '' });
    };

    const handleRemoveActivity = (index) => {
        setActivities(activities.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            // Update activities string
            const updatedSchedule = {
                ...schedule,
                activities: activities.map(a => `${a.date} ${a.time} - ${a.location}: ${a.description}`).join('; ')
            };

            const payload = {
                destination: vacation.destination,
                start_date: tripDates.start_date, // Use updated start date
                end_date: tripDates.end_date,     // Use updated end date

                passengers: vacation.passengers,
                vehicle_type: vacation.vehicle_type,
                ride_included: vacation.ride_included,
                hotel_name: vacation.hotel_name || "",
                hotel_address: vacation.hotel_address || "",
                is_fixed_package: vacation.is_fixed_package,
                total_price: vacation.total_price, // might strictly not be needed if schema allows defaults
                // Updated fields
                activities: JSON.stringify(activities),
                schedule: JSON.stringify(updatedSchedule),
                flight_details: vacation.flight_details,
                meal_preferences: vacation.meal_preferences
            };

            await vacationService.updateVacation(vacation.id, payload);
            alert('Checklist updated successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update checklist:', error);
            alert('Failed to update. ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Edit Trip Details</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Trip Dates Extension */}
                    <div className="bg-dark-900 p-4 rounded-lg mb-6 border border-dark-600">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <Calendar size={16} className="mr-2 text-primary-500" />
                            Extend/Modify Trip Dates
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="input-field text-sm w-full"
                                    value={tripDates.start_date}
                                    onChange={e => setTripDates({ ...tripDates, start_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="input-field text-sm w-full"
                                    value={tripDates.end_date}
                                    onChange={e => setTripDates({ ...tripDates, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Add New Activity */}
                    <div className="bg-dark-900 p-4 rounded-lg mb-6 border border-dark-600">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Add New Activity/Ride</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <input type="date" className="input-field text-sm" value={newActivity.date} onChange={e => setNewActivity({ ...newActivity, date: e.target.value })} />
                            <input type="time" className="input-field text-sm" value={newActivity.time} onChange={e => setNewActivity({ ...newActivity, time: e.target.value })} />
                            <input type="text" placeholder="Location" className="input-field text-sm" value={newActivity.location} onChange={e => setNewActivity({ ...newActivity, location: e.target.value })} />
                            <input type="text" placeholder="Description" className="input-field text-sm" value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
                        </div>
                        <button onClick={handleAddActivity} className="mt-3 btn-primary text-sm py-2 w-full flex justify-center items-center">
                            <Plus size={16} className="mr-1" /> Add Item
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {activities.map((act, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-dark-700 p-3 rounded border border-dark-600">
                                <div>
                                    <div className="flex items-center text-sm font-bold text-white mb-1">
                                        <Calendar size={12} className="mr-1 text-primary-400" /> {act.date}
                                        <Clock size={12} className="ml-3 mr-1 text-primary-400" /> {act.time}
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <span className="text-primary-300 font-semibold">{act.location}</span>: {act.description}
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveActivity(idx)} className="text-red-500 hover:text-red-400 p-2" title="Remove activity">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {activities.length === 0 && <p className="text-center text-gray-500 py-4">No activities scheduled.</p>}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700">Cancel</button>
                        <button onClick={handleSave} disabled={isSubmitting} className="btn-primary px-6 py-2 flex items-center">
                            <Save size={18} className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
