import { Link } from 'react-router-dom'
import { Car, Plane, MapPin, Shield, Award, Clock } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import CountUp from '../components/CountUp'

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary-500 selection:text-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background Effects - Kept subtle overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-8 animate-fade-in-up">
            <div className="bg-primary-500 p-2 rounded-xl shadow-lg shadow-primary-500/20">
              <Car className="w-8 h-8 text-black" />
            </div>
            <span className="text-6xl md:text-7xl font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">VOYAGO</span>
          </div>

          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 backdrop-blur-sm">
            <span className="text-primary-400 text-sm font-medium tracking-wide uppercase">Premium Ride Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight animate-fade-in-up">
            Your Journey, <span className="text-primary-500 animate-pulse">Elevated</span>
          </h1>

          <p className="text-xl md:text-2xl mb-12 text-gray-400 max-w-6xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Uber gives you surge pricing. Ola gives you anxiety. We give you the world. Stop settling for a commute when you could come go on a vacation.<br className="hidden md:block" />
            Voyago is simply superior—better cars, better drivers, and zero excuses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary min-w-[200px] text-lg">
              Get Started
            </Link>
            <Link to="/login" className="px-8 py-3 rounded-lg border border-dark-700 hover:border-dark-600 text-white font-semibold hover:bg-dark-800 transition-all duration-200 min-w-[200px] text-lg">
              Become a Driver
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-dark-800 pt-12 max-w-4xl mx-auto">
            <div className="hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-1">
                <CountUp from={0} to={100} separator="," direction="up" duration={2} />+
              </div>
              <div className="text-sm text-gray-500">Happy Riders</div>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-1">
                <CountUp from={0} to={200} separator="," direction="up" duration={2} />+
              </div>
              <div className="text-sm text-gray-500">Verified Drivers</div>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-1">
                <CountUp from={0} to={10} separator="," direction="up" duration={2} />+
              </div>
              <div className="text-sm text-gray-500">Cities</div>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-1">
                <CountUp from={0} to={4.9} separator="," direction="up" duration={2} />
              </div>
              <div className="text-sm text-gray-500">App Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">Why Choose Voyago?</h2>
            <p className="text-gray-300 drop-shadow-md">We're committed to providing the safest, most reliable ride experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Safe Rides</h3>
              <p className="text-gray-300 leading-relaxed">
                Every trip is tracked with real-time GPS and verified drivers for your complete peace of mind.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-6">
                <Car className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Professional Drivers</h3>
              <p className="text-gray-300 leading-relaxed">
                Background-checked, trained professionals at your service ensuring a smooth journey.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">24/7 Support</h3>
              <p className="text-gray-300 leading-relaxed">
                Round-the-clock customer support whenever you need help, day or night.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-dark-800/80 to-dark-900/80 backdrop-blur-md border border-white/10 p-12 md:p-20 text-center md:text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Start Earning?</h2>
              <p className="text-xl text-gray-300 mb-10">
                Join thousands of drivers who are already earning with Voyago. Flexible hours, great pay, and a supportive community.
              </p>
              <Link to="/register" className="btn-primary inline-flex items-center">
                Apply to Drive <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-dark-800 py-12 relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Car className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Voyago</span>
          </div>

          <div className="flex space-x-8 text-gray-400 text-sm">
            <Link to="/login" className="hover:text-primary-500 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary-500 transition-colors">Register</Link>
            <Link to="/rider" className="hover:text-primary-500 transition-colors">Rider</Link>
            <Link to="/driver" className="hover:text-primary-500 transition-colors">Driver</Link>
          </div>

          <div className="mt-4 md:mt-0 text-gray-600 text-sm">
            © 2025 Voyago. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
