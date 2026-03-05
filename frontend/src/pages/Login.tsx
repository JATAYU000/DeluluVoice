import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mic2, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 group">
                <Mic2 className="text-orange-500 w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold tracking-tighter">DELULU<span className="text-orange-500">VOICE</span></span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-gray-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-gray-400">Log in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-1 block">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex justify-center items-center gap-2">
                        Sign In <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <p className="text-center text-gray-400 text-sm mt-6">
                    Don't have an account? <Link to="/signup" className="text-orange-500 hover:underline">Sign up</Link>
                </p>
            </motion.div>
        </div>
    );
}
