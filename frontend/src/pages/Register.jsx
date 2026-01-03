import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, User, Mail, Lock, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'rider',
    // Driver specific fields
    vehicle_type: 'economy',
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_color: '',
    license_number: '',
    city: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP States
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError("Please enter an email address first.");
      return;
    }
    setError('');
    setLoading(true); // Re-use loading state for this button
    try {
      const response = await authService.sendEmailOTP(formData.email);
      setOtpSent(true);
      alert("✅ OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setVerifyingOtp(true);
    setError('');
    try {
      await authService.verifyEmailOTP(formData.email, otp);
      setEmailVerified(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!emailVerified) {
      setError('Please verify your email address first.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      if (formData.role === 'driver') {
        // Register as driver
        await authService.registerDriver(
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: 'driver'
          },
          {
            license_number: formData.license_number || `LIC${Math.floor(Math.random() * 1000000)}`, // Fallback
            vehicle_type: formData.vehicle_type,
            vehicle_model: formData.vehicle_model || 'Generic',
            vehicle_plate: formData.vehicle_plate,
            vehicle_color: formData.vehicle_color || 'White',
            city: formData.city
          }
        )
        // Skip phone OTP if email verified? Or keep both? 
        // User request implied adding this *to verify actual email*.
        // Let's assume we proceed to the phone OTP page as usual, or login directly.
        // The original code navigated to '/verify-otp'. Let's keep that for phone verification if needed, 
        // OR if this verification REPLACES that one.
        // Assuming this is an EXTRA step for email validation.
        navigate('/verify-otp', { state: { email: formData.email } })
      } else {
        // Register as rider
        await authService.register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'rider'
        })
        navigate('/verify-otp', { state: { email: formData.email } })
      }
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-black to-black"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6 group">
            <div className="bg-primary-500 p-3 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <Car className="w-8 h-8 text-black" />
            </div>
            <span className="ml-3 text-2xl font-bold text-white tracking-tight">Voyago</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join Voyago and start your journey</p>
        </div>

        <div className="bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-700 backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'rider' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${formData.role === 'rider'
                  ? 'bg-primary-500 text-black shadow-lg'
                  : 'bg-dark-900 text-gray-400 hover:bg-dark-700'
                  }`}
              >
                Rider
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'driver' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${formData.role === 'driver'
                  ? 'bg-primary-500 text-black shadow-lg'
                  : 'bg-dark-900 text-gray-400 hover:bg-dark-700'
                  }`}
              >
                Driver
              </button>
            </div>

            {/* Driver Specific Fields */}
            {formData.role === 'driver' && (
              <div className="space-y-4 p-4 bg-dark-900/50 rounded-lg border border-dark-600 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Vehicle Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className="input-field bg-dark-800 border-dark-600 focus:border-primary-500 w-full"
                  >
                    <option value="economy">Economy (4 Seater)</option>
                    <option value="suv">SUV (6-7 Seater)</option>
                    <option value="luxury">Luxury (Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field bg-dark-800 border-dark-600 focus:border-primary-500 w-full"
                    required={formData.role === 'driver'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Car Number (e.g., KA01M3532)</label>
                  <div className="relative group">
                    <Car className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      name="vehicle_plate"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                      className="input-field pl-10 bg-dark-800 border-dark-600 focus:border-primary-500"
                      placeholder="Enter vehicle number"
                      required={formData.role === 'driver'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">License Number</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      className="input-field pl-10 bg-dark-800 border-dark-600 focus:border-primary-500"
                      placeholder="Enter license number"
                      required={formData.role === 'driver'}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Email & OTP Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative group mb-2">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    if (emailVerified) setEmailVerified(false); // Reset verification if email changes
                  }}
                  className={`input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500 ${emailVerified ? 'border-green-500 focus:border-green-500' : ''}`}
                  placeholder="Enter your email"
                  required
                />
                {emailVerified && <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />}
              </div>

              {!emailVerified && (
                <div className="flex space-x-2">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || !formData.email}
                      className="text-xs bg-primary-600 hover:bg-primary-700 text-white py-1.5 px-3 rounded transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Generate OTP'}
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 w-full animate-in fade-in slide-in-from-top-1">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="input-field py-1.5 px-3 text-sm bg-dark-800 border-dark-600 w-24"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={verifyingOtp}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded transition-colors"
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-gray-400 underline hover:text-white"
                      >
                        Resend
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10 bg-dark-900 border-dark-600 focus:border-primary-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center mt-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-dark-600 rounded bg-dark-900"
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-gray-400">
                I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Terms of Service</Link> and <Link to="/policy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !emailVerified}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3.5"
            >
              {loading ? 'Creating Account...' : !emailVerified ? 'Verify Email to Continue' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-400 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
