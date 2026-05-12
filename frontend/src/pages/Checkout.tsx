import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Wallet, Lock } from 'lucide-react';
import { useTape } from '../context/TapeContext';
import { GoldCoin } from '../components/GoldCoin';

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setIsPro, addCredits } = useTape();
    const plan = location.state?.plan || 'Unknown Plan';
    const price = location.state?.price || '₹0';
    const credits = location.state?.credits || 0;
    const isProUnlock = location.state?.isProUnlock || false;

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handlePayment = async () => {
        setIsProcessing(true);
        setPaymentError(null);

        // Simulate payment gateway delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let error: string | null = null;
        if (isProUnlock) {
            error = await setIsPro(true);
        } else if (credits > 0) {
            error = await addCredits(credits);
        }

        if (error) {
            setPaymentError(error);
            setIsProcessing(false);
            return;
        }

        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-black pt-12 px-4 pb-20 font-sans flex justify-center">
            <Link to="/pricing" className="fixed top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors group z-50">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium font-mono text-sm tracking-widest uppercase">Back</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start mt-8"
            >
                {/* Order Summary */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
                    <h2 className="text-xl font-display font-black text-white/80 uppercase tracking-widest mb-8">
                        Order Summary
                    </h2>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                            <GoldCoin className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                                {plan}
                            </h3>
                            <p className="text-orange-500 font-mono text-sm tracking-widest uppercase mt-1">
                                {isProUnlock ? 'Lifetime Ownership' : `+${credits} Credits`}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6 mt-auto">
                        <div className="flex justify-between items-center mb-4 text-white/60 font-mono text-sm uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>{price}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-white/60 font-mono text-sm uppercase tracking-widest">
                            <span>Tax</span>
                            <span>₹0</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/10 pt-6">
                            <span className="font-display font-black text-xl text-white uppercase tracking-widest">Total</span>
                            <span className="text-4xl font-black text-white">{price}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-display font-black text-white/80 uppercase tracking-widest mb-2">
                        Payment Method
                    </h2>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                            <CreditCard className="w-6 h-6" />
                            <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Card</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('upi')}
                            className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Smartphone className="w-6 h-6" />
                            <span className="font-mono text-[10px] tracking-widest uppercase font-bold">UPI</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('wallet')}
                            className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'wallet' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Wallet className="w-6 h-6" />
                            <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Wallets</span>
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mt-2 relative overflow-hidden">
                        {paymentMethod === 'card' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-[10px] font-mono tracking-widest text-white/50 uppercase mb-2">Card Number</label>
                                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-mono tracking-widest text-white/50 uppercase mb-2">Expiry Date</label>
                                        <input type="text" placeholder="MM/YY" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono tracking-widest text-white/50 uppercase mb-2">CVC</label>
                                        <input type="text" placeholder="123" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono tracking-widest text-white/50 uppercase mb-2">Name on Card</label>
                                    <input type="text" placeholder="JOHN DOE" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                            </motion.div>
                        )}

                        {paymentMethod === 'upi' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 py-4">
                                <div className="flex justify-center mb-4">
                                    <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center border border-white/20">
                                        <div className="w-28 h-28 bg-black/5 border-4 border-dashed border-black/10 rounded flex items-center justify-center">
                                            <span className="text-black/30 font-display font-black uppercase text-xs">QR CODE</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center font-mono text-xs text-white/50 uppercase tracking-widest">or enter UPI ID</div>
                                <input type="text" placeholder="username@upi" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors text-center" />
                            </motion.div>
                        )}

                        {paymentMethod === 'wallet' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                                <button className="w-full py-4 bg-white text-black rounded-xl font-bold font-sans flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                                    Continue with Apple Pay
                                </button>
                                <button className="w-full py-4 bg-transparent border border-white text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                    Pay with Google Pay
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-5 bg-orange-500 hover:bg-orange-400 text-black font-black font-display text-lg tracking-widest uppercase rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,100,0,0.3)] mt-2 flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
                    >
                        {isProcessing ? 'Processing...' : `Pay ${price}`}
                        {!isProcessing && <Lock className="w-4 h-4" />}
                    </button>

                    {paymentError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center">
                            <p className="text-red-400 font-mono text-xs tracking-widest uppercase">{paymentError}</p>
                        </div>
                    )}

                    <p className="text-[9px] font-mono tracking-widest text-white/30 text-center uppercase">
                        Secured by Stripe • AES-256 Encryption
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
