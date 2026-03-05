import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Check, ArrowLeft } from 'lucide-react';

const packages = [
    {
        name: "Starter",
        credits: 50,
        price: "₹99",
        features: ["5 Audio Generations", "Standard Quality", "Basic Cassette Customization"],
        popular: false
    },
    {
        name: "Pro",
        credits: 200,
        price: "₹299",
        features: ["20 Audio Generations", "High Quality Audio", "Premium Cassette Customization", "Priority Generation"],
        popular: true
    },
    {
        name: "Studio",
        credits: 500,
        price: "₹499",
        features: ["50 Audio Generations", "Lossless Quality", "All Cassette Features", "Instant Generation", "Commercial Rights"],
        popular: false
    }
];

export default function Pricing() {
    return (
        <div className="min-h-screen bg-black pt-20 px-4 pb-20">
            <Link to="/dashboard" className="fixed top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group z-50">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Dashboard</span>
            </Link>

            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 text-orange-500 font-bold tracking-tighter text-xl mb-4"
                    >
                        <Mic2 /> DELULUVOICE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold mb-4"
                    >
                        Simple, transparent pricing
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg"
                    >
                        1 Audio Generation = 10 Credits. Get more bars for your buck.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
                    {packages.map((pkg, i) => (
                        <motion.div
                            key={pkg.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className={`relative bg-gray-900/40 border rounded-3xl p-8 flex flex-col backdrop-blur-sm ${pkg.popular ? 'border-orange-500 shadow-2xl shadow-orange-500/20 md:-translate-y-4' : 'border-white/10 hover:border-white/20 transition-colors'
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-extrabold">{pkg.price}</span>
                            </div>
                            <p className="text-orange-400 font-medium mb-6">{pkg.credits} Credits</p>

                            <ul className="flex flex-col gap-4 mb-8 flex-grow">
                                {pkg.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3 text-gray-300">
                                        <Check className="w-5 h-5 text-orange-500 shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-4 rounded-xl font-bold transition-all ${pkg.popular
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}>
                                Buy {pkg.credits} Credits
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
