import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'
import { getAIResponse } from '../data/chatbotData'

export default function AIChatbot({ role = 'rider' }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: `Hi! I'm Voyago AI. How can I help you today?`, sender: 'bot' }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!input.trim()) return

        const userMessage = { id: Date.now(), text: input, sender: 'user' }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        // Simulate AI thinking delay
        setTimeout(() => {
            const botResponse = generateResponse(userMessage.text, role)
            setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }])
            setIsTyping(false)
        }, 1000)
    }

    const generateResponse = (text, role) => {
        return getAIResponse(text, role);
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Voyago AI</h3>
                                <p className="text-xs text-primary-100 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0 border border-primary-200">
                                        <Bot className="w-4 h-4 text-primary-600" />
                                    </div>
                                )}
                                <div
                                    className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex self-start items-center space-x-1 ml-10">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 transition-all"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 text-gray-700"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${isOpen ? 'bg-gray-700 rotate-90' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-primary-500/30'
                    } text-white p-4 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    )
}
