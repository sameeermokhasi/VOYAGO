import { useState, useEffect, useRef } from 'react';
import { Send, User, X } from 'lucide-react';
import { messageService } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function ChatWindow({ receiverId, receiverName, initialMessages = [], onClose, rideId = null }) {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false); // New Recording State
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadMessages();
        // Poll for new messages every 3 seconds as a backup to WebSocket
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [receiverId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await messageService.getConversation(receiverId);
            setMessages(prevMessages => {
                // Create a map of existing local settings (translation status)
                const localProps = new Map(prevMessages.map(m => [m.id, {
                    showTranslate: m.showTranslate,
                    translated: m.translated
                }]));

                // Merge server data with local settings
                return data.map(msg => ({
                    ...msg,
                    ...(localProps.get(msg.id) || {})
                }));
            });
        } catch (error) {
            console.error("Failed to load conversation:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceRecord = () => {
        if (isRecording) {
            // Stop Recording & Send Mock Audio
            setIsRecording(false);
            const voiceMsg = {
                id: Date.now(),
                sender_id: user.id,
                content: "🎤 Voice Message (0:05)",
                type: 'voice', // Custom type
                created_at: new Date().toISOString()
            };
            setMessages([...messages, voiceMsg]);
            // In real app: Upload blob to server
        } else {
            // Start Recording
            setIsRecording(true);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const sentMsg = await messageService.sendMessage(receiverId, newMessage, rideId);
            setMessages([...messages, sentMsg]);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message");
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-dark-800 border border-dark-700 rounded-t-xl shadow-2xl flex flex-col z-50 h-[500px]">
            {/* Header */}
            <div className="p-4 bg-dark-900 rounded-t-xl border-b border-dark-700 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center mr-2">
                        <User className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{receiverName}</h3>
                        <span className="text-xs text-green-400 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                            Online
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center mt-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 text-xs mt-4">
                                Start a conversation with {receiverName}
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        onClick={() => {
                                            if (msg.type === 'voice') {
                                                const utterance = new SpeechSynthesisUtterance("This is a voice message simulation.");
                                                window.speechSynthesis.speak(utterance);
                                            }
                                        }}
                                        className={`max-w-[80%] rounded-lg p-3 text-sm ${isMe
                                            ? 'bg-primary-600 text-white rounded-br-none'
                                            : 'bg-dark-700 text-gray-200 rounded-bl-none'
                                            } ${msg.type === 'voice' ? 'cursor-pointer hover:opacity-90' : ''}`}>
                                        <p>
                                            {msg.content}
                                            {msg.type === 'voice' && <span className="ml-2">▶️</span>}
                                        </p>

                                        {/* Translation UI */}
                                        <div className="mt-2 pt-2 border-t border-white/10">
                                            {!msg.translated ? (
                                                <button
                                                    onClick={() => {
                                                        const newMessages = messages.map(m => m.id === msg.id ? { ...m, showTranslate: !m.showTranslate } : m);
                                                        setMessages(newMessages);
                                                    }}
                                                    className="text-[10px] text-blue-300 hover:text-blue-200 flex items-center"
                                                >
                                                    <span className="mr-1">🌐</span> Translate
                                                </button>
                                            ) : (
                                                <div className="text-xs text-green-300 italic bg-black/20 p-1 rounded mt-1">
                                                    {msg.translated}
                                                    <div className="text-[9px] text-gray-400 not-italic mt-0.5">Translated from English</div>
                                                </div>
                                            )}

                                            {msg.showTranslate && !msg.translated && (
                                                <div className="mt-2 bg-black/50 p-2 rounded animate-in fade-in zoom-in duration-200">
                                                    <select
                                                        onChange={(e) => {
                                                            const lang = e.target.value;
                                                            if (!lang) return;

                                                            // Mock Translation Logic
                                                            const words = msg.content.toLowerCase().split(' ');

                                                            // Simple Dictionary
                                                            const dictionary = {
                                                                'hi': { 'hello': 'namaste', 'hi': 'namaste', 'sir': 'saheb', 'where': 'kahan', 'are': 'hai', 'you': 'aap' },
                                                                'kn': { 'hello': 'namaskara', 'hi': 'namaskara', 'sir': 'sahebru', 'where': 'ellidira', 'are': '', 'you': 'neevu' },
                                                                'ta': { 'hello': 'vanakkam', 'hi': 'vanakkam', 'sir': 'aiyya', 'where': 'enge', 'are': 'irukkenga', 'you': 'neenga' },
                                                                // Add minimal fallbacks for others
                                                            };

                                                            const dict = dictionary[lang] || {};
                                                            const translatedWords = words.map(w => dict[w] || w);
                                                            const translatedText = `[${lang.toUpperCase()}]: ${translatedWords.join(' ')}`;

                                                            const newMessages = messages.map(m =>
                                                                m.id === msg.id ? { ...m, translated: translatedText, showTranslate: false } : m
                                                            );
                                                            setMessages(newMessages);
                                                        }}
                                                        className="w-full text-xs bg-dark-800 text-white border border-gray-600 rounded p-1"
                                                    >
                                                        <option value="">Select Language...</option>
                                                        <option value="hi">Hindi (हिंदी)</option>
                                                        <option value="kn">Kannada (ಕನ್ನಡ)</option>
                                                        <option value="ta">Tamil (தமிழ்)</option>
                                                        <option value="te">Telugu (తెలుగు)</option>
                                                        <option value="ml">Malayalam (മലയാളം)</option>
                                                        <option value="mr">Marathi (मराठी)</option>
                                                        <option value="gu">Gujarati (ગુજરાતી)</option>
                                                        <option value="bn">Bengali (বাংলা)</option>
                                                        <option value="es">Spanish (Español)</option>
                                                        <option value="fr">French (Français)</option>
                                                        <option value="de">German (Deutsch)</option>
                                                        <option value="it">Italian (Italiano)</option>
                                                        <option value="pt">Portuguese (Português)</option>
                                                        <option value="ru">Russian (Русский)</option>
                                                        <option value="ja">Japanese (日本語)</option>
                                                        <option value="zh">Chinese (中文)</option>
                                                        <option value="ko">Korean (한국어)</option>
                                                        <option value="ar">Arabic (العربية)</option>
                                                        <option value="ur">Urdu (اردو)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-dark-800 border-t border-dark-700 flex items-center space-x-2">
                {!receiverId ? (
                    <div className="w-full text-center text-red-400 text-xs py-2 bg-red-900/20 rounded">
                        Cannot send message: Receiver info missing.
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-dark-900 border border-dark-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-600"
                        />

                        {/* Voice Record Button */}
                        <button
                            type="button"
                            onClick={handleVoiceRecord}
                            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-dark-700 text-gray-400 hover:text-white'}`}
                        >
                            {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <span className="text-lg">🎤</span>}
                        </button>

                        <button
                            type="submit"
                            className="p-2 bg-primary-600 hover:bg-primary-700 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newMessage.trim()}
                        >
                            <span className="text-lg">➤</span>
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
