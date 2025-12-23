import { Link } from 'react-router-dom';

export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link to="/register" className="inline-flex items-center text-primary-500 hover:text-primary-400 mb-8 transition-colors">
                    &larr; Back to Registration
                </Link>

                <div className="bg-dark-800 rounded-2xl p-8 md:p-12 shadow-2xl border border-dark-700">
                    <div className="flex items-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Privacy Policy
                        </h1>
                    </div>

                    <p className="text-gray-400 mb-8 text-lg">
                        Last updated: December 23, 2025. Your privacy is critically important to us.
                    </p>

                    <div className="space-y-6 text-gray-300">
                        <h2 className="text-xl font-bold text-white mt-8">1. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li><strong>Personal Information:</strong> Name, email, phone number, and profile picture provided during registration.</li>
                            <li><strong>Location Data:</strong> We collect precise or approximate location data from your mobile device.</li>
                            <li><strong>Transaction Data:</strong> Details of transactions related to your use of our services.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>To provide, maintain, and improve our services (e.g., facilitating payments, sending receipts).</li>
                            <li>To enhance the safety and security of our users and services (e.g., screening drivers, monitoring rides).</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">3. Information Sharing</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li><strong>With Drivers/Riders:</strong> We share your name, rating, and pickup/dropoff locations with the matched driver/rider to facilitate the ride.</li>
                            <li>We strictly <strong>do not sell</strong> your personal data to third parties for marketing purposes.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">4. Data Security</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>We implement appropriate technical and organizational measures to protect your personal data.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8">5. Location Information</h2>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>We collect location data when the Voyago app is running in the foreground or background to enable core features.</li>
                        </ul>
                    </div>

                    <div className="mt-12 pt-8 border-t border-dark-600">
                        <p className="text-gray-500 text-sm">
                            If you have any questions about this Privacy Policy, please contact us: <a href="mailto:privacy@voyago.com" className="text-primary-500 hover:underline">privacy@voyago.com</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
