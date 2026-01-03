import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Camera, Car } from 'lucide-react';
import axios from 'axios';

export default function Profile() {
    const { user, token, checkAuth } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        aadhar_card_number: '', // For drivers
        license_number: '', // For drivers
        vehicle_type: 'economy', // For drivers
        vehicle_plate: '', // For drivers
        city: '' // For drivers
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                aadhar_card_number: user.driver_profile?.aadhar_card_number || '',
                license_number: user.driver_profile?.license_number || '',
                vehicle_type: user.driver_profile?.vehicle_type || 'economy',
                vehicle_plate: user.driver_profile?.vehicle_plate || '',
                city: user.driver_profile?.city || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            setLoading(true);
            try {
                await axios.put('http://localhost:8000/api/users/me', {
                    profile_picture: base64String
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                await checkAuth();
                setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
            } catch (error) {
                console.error('Failed to update profile picture:', error);
                setMessage({ type: 'error', text: 'Failed to update profile picture' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Update basic user info
            await axios.put('http://localhost:8000/api/users/me', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If driver, update driver profile
            if (isDriver) {
                await axios.put('http://localhost:8000/api/users/me/driver', {
                    vehicle_type: formData.vehicle_type,
                    vehicle_plate: formData.vehicle_plate,
                    aadhar_card_number: formData.aadhar_card_number,
                    city: formData.city
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            await checkAuth(); // Refresh user data
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            console.error('Update failed:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to update profile. Please try again.';
            setMessage({ type: 'error', text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Loading profile...</div>;

    const isDriver = user.role === 'driver' || user.role?.value === 'driver';

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Profile Picture & Status */}
                    <div className="col-span-1">
                        <div className="card text-center p-6">
                            <div className="relative inline-block mb-4">
                                <div className="w-32 h-32 rounded-full bg-dark-700 flex items-center justify-center mx-auto overflow-hidden border-4 border-dark-600 shadow-lg">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-400" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-md hover:bg-primary-700 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <p className="text-gray-400 capitalize">{user.role?.value || user.role}</p>

                            {isDriver && (
                                <div className="mt-4 pt-4 border-t border-dark-700">
                                    <div className="flex items-center justify-center space-x-2 text-yellow-500 font-bold">
                                        <span>★</span>
                                        <span>{user.driver_profile?.rating || '5.0'}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Driver Rating</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details Form */}
                    <div className="col-span-2">
                        <div className="card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Personal Information</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-lg mb-6 border ${message.type === 'success' ? 'bg-green-900/50 text-green-400 border-green-900' : 'bg-red-900/50 text-red-400 border-red-900'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                                placeholder="Enter your address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isDriver && (
                                    <>
                                        <div className="border-t border-dark-700 pt-6">
                                            <h3 className="text-lg font-bold mb-4">Vehicle Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                                                    <div className="relative">
                                                        <Car className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                        <select
                                                            name="vehicle_type"
                                                            value={formData.vehicle_type}
                                                            onChange={handleChange}
                                                            disabled={!isEditing}
                                                            className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white appearance-none"
                                                        >
                                                            <option value="economy">Economy</option>
                                                            <option value="suv">SUV</option>
                                                            <option value="luxury">Luxury</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Car Number</label>
                                                    <div className="relative">
                                                        <Car className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            name="vehicle_plate"
                                                            value={formData.vehicle_plate}
                                                            onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                                                            disabled={!isEditing}
                                                            className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                                            placeholder="KA01M3532"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-dark-700 pt-6">
                                            <h3 className="text-lg font-bold mb-4">Driver Documents</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">DRIVING LICENCE NUMBER</label>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            name="license_number"
                                                            value={formData.license_number}
                                                            disabled={true} // Usually can't edit this easily
                                                            className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg bg-dark-900 text-gray-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">AADHAR CARD NUMBER</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            name="aadhar_card_number"
                                                            value={formData.aadhar_card_number}
                                                            onChange={handleChange}
                                                            disabled={!isEditing} // Allow adding if missing
                                                            className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white"
                                                            placeholder="XXXX-XXXX-XXXX"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        <div className="border-t border-dark-700 pt-6">
                                            <h3 className="text-lg font-bold mb-4">Driver Location</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                    <select
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-dark-900 disabled:text-gray-500 bg-dark-800 text-white appearance-none"
                                                    >
                                                        <option value="">Select City</option>
                                                        <option value="Bangalore">Bangalore</option>
                                                        <option value="Hubli">Hubli</option>
                                                        <option value="Goa">Goa</option>
                                                        <option value="Mumbai">Mumbai</option>
                                                        <option value="Delhi">Delhi</option>
                                                        <option value="Hyderabad">Hyderabad</option>
                                                        <option value="Chennai">Chennai</option>
                                                        <option value="Kolkata">Kolkata</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="border-t border-dark-700 pt-6">
                                    <h3 className="text-lg font-bold mb-4">Security</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Password (hashed)</label>
                                        <input
                                            type="password"
                                            value="********"
                                            disabled={true}
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg bg-dark-900 text-gray-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">To change your password, please contact support.</p>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}
