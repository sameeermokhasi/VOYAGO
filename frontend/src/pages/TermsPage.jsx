import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link to="/register" className="inline-flex items-center text-primary-500 hover:text-primary-400 mb-8 transition-colors">
                    &larr; Back to Registration
                </Link>

                <div className="bg-dark-800 rounded-2xl p-8 md:p-12 shadow-2xl border border-dark-700">
                    <div className="flex items-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Terms of Service
                        </h1>
                    </div>

                    <p className="text-gray-400 mb-8 text-lg">
                        Last updated: December 23, 2025. Please read these terms carefully before using Voyago.
                    </p>

                    <div className="space-y-6 text-gray-300">
                        <h2 className="text-xl font-bold text-white mt-8">1. Acceptance of Terms</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>By accessing or using the Voyago platform ("Service"), you agree to be bound by these Terms.</li>
                            <li>If you disagree with any part of the terms, you may not access the Service.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">2. User Accounts</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>You must be at least 18 years old to create an account used for ride-hailing functionality.</li>
                            <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">3. Services & Ride Booking</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>Voyago acts as an intermediary between riders and drivers.</li>
                            <li>Drivers are independent contractors and not employees of Voyago.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">4. Payments & Billing</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>You agree to pay for all rides booked through your account.</li>
                            <li>Payments are processed securely via third-party payment processors.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">5. User Conduct</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>You agree to treat drivers and other users with respect and courtesy.</li>
                        </ul>
                    </div>

                    <div className="mt-12 pt-8 border-t border-dark-600">
                        <p className="text-gray-500 text-sm">
                            Contact us at <a href="mailto:sameermokhasi022@gmail.com" className="text-primary-500 hover:underline">sameermokhasi022@gmail.com</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
