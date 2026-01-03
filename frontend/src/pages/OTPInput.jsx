import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Car, Lock, Shield } from 'lucide-react'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function OTPInput() {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')

    const navigate = useNavigate()
    const location = useLocation()
    const login = useAuthStore((state) => state.login)

    useEffect(() => {
        // Get email from router state or redirect to register
        if (location.state?.email) {
            setEmail(location.state.email)
        } else {
            navigate('/register')
        }
    }, [location, navigate])

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))])

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            element.nextSibling.focus()
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            e.target.previousSibling.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const data = e.clipboardData.getData('text').slice(0, 6).split('')
        if (data.every(char => !isNaN(char))) {
            const newOtp = [...otp]
            data.forEach((val, i) => {
                if (i < 6) newOtp[i] = val
            })
            setOtp(newOtp)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const otpString = otp.join('')
        if (otpString.length !== 6) {
            setError("Please enter a valid 6-digit code")
            setLoading(false)
            return
        }

        try {
            const data = await authService.verifyOTP(email, otpString)
            login(data.access_token, data.user)

            const role = data.user.role
            if (role === 'rider') navigate('/rider')
            else if (role === 'driver') navigate('/driver')
            else if (role === 'admin') navigate('/admin')

        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed')
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
                    <div className="inline-flex items-center justify-center mb-6">
                        <div className="bg-primary-500 p-3 rounded-xl shadow-lg shadow-primary-500/20">
                            <Shield className="w-8 h-8 text-black" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Verify Phone Number</h2>
                    <p className="text-gray-400">Enter the 6-digit code sent to your phone</p>
                    <p className="text-primary-400 text-sm mt-1">{email}</p>
                </div>

                <div className="bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-700 backdrop-blur-sm">
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-center">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2" onPaste={handlePaste}>
                            {otp.map((data, index) => (
                                <input
                                    className="w-12 h-14 bg-dark-900 border border-dark-600 rounded-lg text-center text-xl font-bold text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                    type="text"
                                    name="otp"
                                    maxLength="1"
                                    key={index}
                                    value={data}
                                    onChange={e => handleChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    onFocus={e => e.target.select()}
                                    required
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3.5"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Didn't receive code?{' '}
                            <button className="text-primary-500 hover:text-primary-400 font-bold transition-colors">
                                Resend
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
