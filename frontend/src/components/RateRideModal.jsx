import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { rideService } from '../services/api';

const RateRideModal = ({ ride, onClose, onRateSuccess }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            console.log('Submitting rating for ride:', ride.id, 'Rating:', rating, 'Feedback:', feedback);
            await rideService.rateRide(ride.id, rating, feedback);
            console.log('Rating submitted successfully');
            onRateSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to rate ride:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to submit rating. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Rate Your Ride</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-8 text-center">
                        <p className="text-gray-300 mb-4">How was your ride with the driver?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={40}
                                        className={`${star <= (hoveredRating || rating)
                                            ? 'fill-primary-500 text-primary-500'
                                            : 'text-dark-600'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="mt-2 text-sm font-medium text-primary-400">
                                {rating === 5 ? 'Excellent!' :
                                    rating === 4 ? 'Good' :
                                        rating === 3 ? 'Average' :
                                            rating === 2 ? 'Poor' : 'Terrible'}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Feedback (Optional)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Tell us about your experience..."
                                className="w-full px-4 py-3 rounded-lg border border-dark-600 bg-dark-900 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-32 placeholder-gray-500"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="w-full btn-primary py-3 rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RateRideModal;
