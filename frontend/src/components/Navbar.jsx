import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    Menu, X, Home, User, Wallet, Clock, LogOut,
    MapPin, Settings, AlertCircle, Car, MessageCircle
} from 'lucide-react';

export default function Navbar() {
    const { user, logout, role } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const riderLinks = [
        { path: '/rider', label: 'Dashboard', icon: Home },
        { path: '/rider/profile', label: 'Profile', icon: User },
        { path: '/rider/wallet', label: 'Wallet', icon: Wallet },
        { path: '/rider/history', label: 'Ride History', icon: Clock },
        { path: '/rider/vacation-booking', label: 'My Vacations', icon: MapPin },
        { path: '/rider/messages', label: 'Messages', icon: MessageCircle },
    ];

    const driverLinks = [
        { path: '/driver', label: 'Dashboard', icon: Home },
        { path: '/driver/profile', label: 'Profile', icon: User },
        { path: '/driver/wallet', label: 'Wallet', icon: Wallet },
        { path: '/driver/history', label: 'Ride History', icon: Clock },
        { path: '/driver/messages', label: 'Messages', icon: MessageCircle },
    ];

    const adminLinks = [
        { path: '/admin', label: 'Dashboard', icon: Home },
    ];

    const links = role === 'driver' ? driverLinks : role === 'admin' ? adminLinks : riderLinks;

    if (!user) return null;

    return (
        <nav className="bg-black shadow-lg sticky top-0 z-50 border-b border-dark-800">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group">
                            <div className="bg-primary-500 p-1.5 rounded-lg mr-2 group-hover:scale-105 transition-transform">
                                <Car className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight group-hover:text-primary-500 transition-colors">VOYAGO</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.path)
                                    ? 'bg-primary-500 text-black shadow-md shadow-primary-500/20'
                                    : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                                    }`}
                            >
                                <link.icon className={`w-4 h-4 mr-2 ${isActive(link.path) ? 'text-black' : 'text-gray-500 group-hover:text-white'}`} />
                                {link.label}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-dark-700 mx-4"></div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-right hidden lg:block">
                                <p className="font-medium text-white">{user.name}</p>
                                <p className="text-xs text-primary-500 capitalize font-semibold">{role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-dark-700"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800 focus:outline-none"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-dark-900 border-t border-dark-800 absolute w-full left-0 shadow-xl">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <div className="px-3 py-3 border-b border-dark-700 mb-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white">{user.name}</p>
                                <p className="text-xs text-primary-500 capitalize">{role}</p>
                            </div>
                        </div>
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive(link.path)
                                    ? 'bg-primary-500 text-black'
                                    : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                                    }`}
                            >
                                <link.icon className="w-5 h-5 mr-3" />
                                {link.label}
                            </Link>
                        ))}
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-dark-800 hover:text-red-300 mt-4"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
