import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { messageService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import ChatWindow from '../components/ChatWindow'

export default function DriverMessages() {
    const { user } = useAuthStore()
    const [conversations, setConversations] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadConversations()
        // Poll for updates
        const interval = setInterval(loadConversations, 10000)
        return () => clearInterval(interval)
    }, [])

    const loadConversations = async () => {
        try {
            const data = await messageService.getRecentConversations()
            setConversations(data)
        } catch (error) {
            console.error("Failed to load conversations:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChat = (userId, name) => {
        setActiveChat({ userId, name })
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 flex items-center">
                    <MessageCircle className="w-8 h-8 mr-3 text-primary-500" />
                    Messages
                </h1>

                <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No messages yet</p>
                            <p className="text-sm mt-2">Messages from admins and riders will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-700">
                            {conversations.map(conv => (
                                <div
                                    key={conv.user_id}
                                    className="flex justify-between items-center p-4 hover:bg-dark-700 cursor-pointer transition-colors"
                                    onClick={() => handleOpenChat(conv.user_id, conv.name)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-primary-900/30 flex items-center justify-center text-primary-400 font-bold text-lg">
                                            {conv.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{conv.name}</h3>
                                            <p className="text-gray-400 truncate max-w-md">{conv.last_message}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm text-gray-500 mb-1">
                                            {new Date(conv.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                                                ? new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : new Date(conv.timestamp).toLocaleDateString()}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span className="bg-primary-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {activeChat && (
                <ChatWindow
                    receiverId={activeChat.userId}
                    receiverName={activeChat.name}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    )
}
