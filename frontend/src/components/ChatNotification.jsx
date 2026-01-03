import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function ChatNotification({ notification, onClose, onClick }) {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: 50 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -50, x: 50 }}
                    className="fixed top-20 right-4 z-[9999] max-w-sm w-full bg-dark-800 border-l-4 border-primary-500 rounded-lg shadow-2xl overflow-hidden cursor-pointer"
                    onClick={onClick}
                >
                    <div className="p-4 flex items-start">
                        <div className="flex-shrink-0">
                            <MessageCircle className="h-6 w-6 text-primary-400" />
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-white">
                                {notification.sender || 'New Message'}
                            </p>
                            <p className="mt-1 text-sm text-gray-300 line-clamp-2">
                                {notification.content}
                            </p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    {/* Progress Bar (Optional) */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-1 bg-primary-600"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
