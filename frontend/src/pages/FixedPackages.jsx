import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import FixedVacationPackages from '../components/FixedVacationPackages';

export default function FixedPackages() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-dark-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">Fixed Vacation Packages</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/rider/vacation-booking')} className="text-gray-400 hover:text-white">
                ← Back to Vacation Booking
              </button>
              <button onClick={logout} className="btn-outline text-sm text-white border-white hover:bg-white hover:text-black">
                <LogOut className="w-4 h-4 inline mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <FixedVacationPackages />
    </div>
  );
}