import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Check, ArrowLeft, Crown } from 'lucide-react';
import { GoldCoin } from '../components/GoldCoin';

const creditPackages = [
    {
        credits: 50,
        price: "₹99",
        originalPrice: "₹149",
        popular: false
    },
    {
        credits: 200,
        price: "₹299",
        originalPrice: "₹499",
        popular: true
    },
    {
        credits: 500,
        price: "₹499",
        originalPrice: "₹999",
        popular: false
    }
];

const proFeatures = [
    "Faster Synthesis Rates",
    "Extra Shelf Row (Unlocks 13 More Tape Slots)",
    "Premium Audio Quality",
    "Priority Generation Queue",
    "One-Time Purchase - Yours Forever"
];

export default function Pricing() {
    return (
        <div className="min-h-screen bg-black pt-10 px-4 pb-10 font-sans flex flex-col items-center justify-center">
            <Link to="/dashboard" className="fixed top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group z-50">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium font-mono text-sm tracking-widest uppercase">Back to Studio</span>
            </Link>

            <div className="max-w-6xl mx-auto flex flex-col items-center w-full">
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 text-orange-500 font-bold tracking-tighter text-lg mb-2"
                    >
                        <Mic2 className="w-5 h-5" /> DELULUVOICE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-extrabold mb-2 font-display uppercase tracking-tighter text-white"
                    >
                        Upgrade Your Studio
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-white/50 text-sm font-mono"
                    >
                        1 Track = 10 Credits. Get more bars for your buck.
                    </motion.p>
                </div>

                {/* Lifetime Pro Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-4xl mb-8 bg-gradient-to-br from-orange-500/20 to-purple-600/20 border-2 border-orange-500/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,100,0,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />

                    <div className="flex-1 relative z-10 w-full">
                        <div className="inline-flex items-center gap-1 bg-orange-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <Crown className="w-3 h-3" /> Lifetime Ownership
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-2">
                            Pro Studio Plan
                        </h2>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-4xl font-black text-white">₹999</span>
                            <span className="text-lg text-white/40 line-through font-bold">₹1,999</span>
                        </div>

                        <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-4">
                            {proFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-2 text-white/80 font-mono text-[11px] leading-tight">
                                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-orange-500" />
                                    </div>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="w-full md:w-auto shrink-0 relative z-10 mt-4 md:mt-0">
                        <Link
                            to="/checkout"
                            state={{ plan: "Pro Studio Plan", price: "₹999", isProUnlock: true }}
                            className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-black font-display text-base tracking-widest uppercase rounded-xl transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,100,0,0.3)] inline-flex justify-center items-center"
                        >
                            Unlock Pro
                        </Link>
                    </div>
                </motion.div>

                {/* Credit Packages */}
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <h3 className="text-lg font-display font-black text-white/80 uppercase tracking-widest mb-3 text-center">
                        Need More Tape?
                    </h3>
                    <div className="grid md:grid-cols-3 gap-3 w-full">
                        {creditPackages.map((pkg, i) => (
                            <motion.div
                                key={pkg.credits}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className={`relative bg-white/5 border rounded-xl p-5 flex flex-col items-center text-center backdrop-blur-sm ${pkg.popular
                                    ? 'border-orange-500/50 shadow-2xl shadow-orange-500/10 md:-translate-y-1 bg-gradient-to-b from-orange-500/10 to-transparent'
                                    : 'border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        Most Popular
                                    </div>
                                )}

                                <div className="text-orange-500 mb-4 flex flex-col items-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <GoldCoin className="w-8 h-8 md:w-10 md:h-10" />
                                        <span className="text-5xl font-display font-black tracking-tighter">{pkg.credits}</span>
                                    </div>
                                    <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">Credits</span>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-6 w-full border-t border-white/10 pt-4">
                                    <span className="text-2xl font-bold text-white">{pkg.price}</span>
                                    <span className="text-white/30 line-through text-sm">{pkg.originalPrice}</span>
                                </div>

                                <Link
                                    to="/checkout"
                                    state={{ plan: `${pkg.credits} Credits Pack`, price: pkg.price, credits: pkg.credits }}
                                    className={`w-full py-3 rounded-lg font-black font-display text-sm tracking-widest uppercase transition-all active:scale-[0.98] flex justify-center items-center ${pkg.popular
                                        ? 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_20px_rgba(255,100,0,0.3)]'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    Buy Pack
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
