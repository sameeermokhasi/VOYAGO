import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Wallet as WalletIcon, Plus, CreditCard, History, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { userService } from '../services/api';

export default function Wallet() {
    const { user, token, checkAuth } = useAuthStore();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');
    const [loading, setLoading] = useState(false);

    const [savedCards, setSavedCards] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCard, setNewCard] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });

    useEffect(() => {
        if (user) {
            setBalance(user.wallet_balance || 0);

            const fetchCards = async () => {
                try {
                    const cards = await userService.getCards();
                    setSavedCards(cards);
                } catch (error) {
                    console.error('Failed to load saved cards:', error);
                }
            };

            const fetchTransactions = async () => {
                try {
                    const data = await userService.getTransactions();
                    // Map backend response (created_at) to frontend expectation (date)
                    const formattedTransactions = data.map(tx => ({
                        ...tx,
                        date: tx.created_at
                    }));
                    setTransactions(formattedTransactions);
                } catch (error) {
                    console.error('Failed to load transactions:', error);
                }
            };

            fetchCards();
            fetchTransactions();
        }
    }, [user]);

    const handleAddMoney = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const amount = parseFloat(amountToAdd);
            if (isNaN(amount) || amount <= 0 || amount > 1000) {
                alert('Please enter a valid amount between 1 and 1000');
                setLoading(false);
                return;
            }

            await api.post('/users/wallet/add', { amount });

            await checkAuth(); // Refresh user data to get new balance
            setShowAddMoney(false);
            setAmountToAdd('');
            alert('Money added successfully!');
        } catch (error) {
            console.error('Failed to add money:', error);
            alert('Failed to add money. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        // Basic validation
        if (newCard.number.length < 16 || !newCard.expiry || !newCard.cvv || !newCard.name) {
            alert('Please fill in all card details correctly.');
            return;
        }

        try {
            const cardData = {
                last4: newCard.number.slice(-4),
                brand: 'visa', // Default/Mock brand
                expiry_month: newCard.expiry.split('/')[0],
                expiry_year: newCard.expiry.split('/')[1] || '25', // Fallback for demo
                holder_name: newCard.name
            };

            const addedCard = await userService.addCard(cardData);

            setSavedCards([...savedCards, addedCard]);
            setShowAddCard(false);
            setNewCard({ number: '', expiry: '', cvv: '', name: '' });
            alert('Card added successfully!');
        } catch (error) {
            console.error('Failed to add card:', error);
            if (error.response && error.response.data && error.response.data.detail) {
                alert(`Failed to add card: ${error.response.data.detail}`);
            } else {
                alert('Failed to add card. Please try again.');
            }
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to remove this card?")) return;
        try {
            await userService.deleteCard(cardId);
            setSavedCards(savedCards.filter(c => c.id !== cardId));
        } catch (error) {
            console.error('Failed to delete card:', error);
            alert('Failed to delete card.');
        }
    }

    const isRider = user?.role === 'rider' || user?.role?.value === 'rider';

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Wallet</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Balance Card */}
                    <div className="col-span-1">
                        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium opacity-90">Total Balance</h2>
                                <WalletIcon className="w-6 h-6 opacity-75" />
                            </div>
                            <div className="text-4xl font-bold mb-6">₹{balance.toFixed(2)}</div>

                            {isRider && (
                                <button
                                    onClick={() => setShowAddMoney(true)}
                                    className="w-full bg-white text-primary-700 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Money
                                </button>
                            )}

                            {!isRider && (
                                <div className="text-sm opacity-75 mt-2">
                                    Earnings from completed rides are automatically added here.
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Saved Cards
                            </h3>
                            <div className="space-y-3">
                                {savedCards.map((card) => (
                                    <div key={card.id} className="card p-4 flex items-center justify-between mb-3 bg-dark-800 border-dark-700 group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center text-[8px] font-bold">CARD</div>
                                            <span className="font-medium text-white">•••• {card.last4}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs text-gray-500 mr-3">Expires {card.expiry_month}/{card.expiry_year}</span>
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Card"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isRider && (
                                <button
                                    onClick={() => setShowAddCard(true)}
                                    className="text-primary-600 text-sm font-medium hover:underline mt-2 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add New Card
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="col-span-2">
                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center">
                                <History className="w-5 h-5 mr-2" />
                                Recent Transactions
                            </h3>

                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-dark-700 rounded-lg transition-colors">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${tx.type === 'credit' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                                }`}>
                                                {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{tx.description}</p>
                                                <p className="text-sm text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-white'
                                            }`}>
                                            {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Money Modal */}
                {showAddMoney && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 border border-dark-700">
                            <h3 className="text-xl font-bold mb-4 text-white">Add Money to Wallet</h3>
                            <p className="text-gray-400 mb-6">Enter amount to add (Max ₹1000)</p>

                            <form onSubmit={handleAddMoney}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={amountToAdd}
                                        onChange={(e) => setAmountToAdd(e.target.value)}
                                        placeholder="Enter amount"
                                        min="1"
                                        max="1000"
                                        className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-dark-900 text-white"
                                        required
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddMoney(false)}
                                        className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Add Money'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Add Card Modal */}
                {showAddCard && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 border border-dark-700">
                            <h3 className="text-xl font-bold mb-4 text-white">Add New Card</h3>

                            <form onSubmit={handleAddCard}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
                                        <input
                                            type="text"
                                            value={newCard.number}
                                            onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                                            placeholder="0000 0000 0000 0000"
                                            maxLength="19"
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-dark-900 text-white"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                value={newCard.expiry}
                                                onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                                                placeholder="MM/YY"
                                                maxLength="5"
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-dark-900 text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                                            <input
                                                type="password"
                                                value={newCard.cvv}
                                                onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                                                placeholder="123"
                                                maxLength="3"
                                                className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-dark-900 text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Cardholder Name</label>
                                        <input
                                            type="text"
                                            value={newCard.name}
                                            onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-dark-900 text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCard(false)}
                                        className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                                    >
                                        Add Card
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
