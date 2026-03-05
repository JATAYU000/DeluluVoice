import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mic2, Music, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
    const [lyrics, setLyrics] = useState('');
    const [instrumental, setInstrumental] = useState(true);
    const navigate = useNavigate();

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lyrics.trim()) return;
        navigate('/signup');
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-dark-900 text-cream-100 font-sans relative overflow-hidden">
            {/* Background Ambience Layer */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Navigation Layer */}
            <nav className="fixed top-0 w-full px-8 py-5 flex justify-between items-center z-50 bg-dark-900/40 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-neon">
                        <Mic2 className="text-white w-5 h-5" />
                    </div>
                    <span className="text-2xl font-display font-black tracking-tight text-white">
                        DELULU<span className="text-orange-500">VOICE</span>
                    </span>
                </div>
                <div className="flex gap-6 items-center">
                    <Link
                        to="/login"
                        className="text-cream-200/60 hover:text-white transition-colors text-sm font-semibold tracking-wide"
                    >
                        LOG IN
                    </Link>
                    <Link
                        to="/signup"
                        className="relative group px-6 py-2.5 rounded-full bg-dark-800 border border-orange-500/30 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
                        <span className="relative text-sm font-bold text-orange-400 group-hover:text-orange-300 transition-colors flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> GET 10 FREE CREDITS
                        </span>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="w-full max-w-5xl flex flex-col items-center mt-32 px-4 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16 flex flex-col items-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest mb-8 border border-orange-500/20 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-neon" />
                        AI RAP GENERATOR V2.0
                    </div>

                    <h1 className="text-6xl md:text-8xl font-display font-black tracking-[-0.04em] mb-6 leading-[1.05] text-white">
                        Drop your lyrics. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 animate-gradient-x">
                            Capture the heat.
                        </span>
                    </h1>

                    <p className="text-cream-200/60 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Generate Eminem-style rap tracks instantly from text. Collect and customize your own 3D cassette tapes. High fidelity audio and visuals.
                    </p>
                </motion.div>

                {/* The Generator Console */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-3xl relative"
                >
                    {/* Outer Console Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-orange-500/10 rounded-3xl blur-md opacity-50" />

                    <div className="relative bg-dark-800/80 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
                        <form onSubmit={handleGenerate} className="flex flex-col gap-8">
                            <div className="flex flex-col gap-3">
                                <label htmlFor="lyrics" className="text-sm font-bold tracking-widest text-orange-500 uppercase flex items-center gap-2">
                                    <Music className="w-4 h-4" />
                                    Source Lyrics
                                </label>
                                <div className="relative group">
                                    <textarea
                                        id="lyrics"
                                        value={lyrics}
                                        onChange={(e) => setLyrics(e.target.value)}
                                        placeholder="Type or paste your verses here..."
                                        className="w-full h-48 bg-dark-900/50 border border-white/5 rounded-2xl p-6 text-xl text-white placeholder-cream-200/20 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none transition-all custom-scrollbar font-sans"
                                        required
                                    />
                                    {/* Subtle inner shadow effect on focus */}
                                    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-transparent group-focus-within:border-orange-500/30 transition-colors" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-8">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setInstrumental(!instrumental)}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${instrumental ? 'bg-orange-500 shadow-neon' : 'bg-dark-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${instrumental ? 'translate-x-8' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white tracking-wide">Generate Beat</span>
                                        <span className="text-xs text-cream-200/40">Includes instrumental backing</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!lyrics.trim()}
                                    className="group relative flex items-center justify-center gap-3 bg-white text-dark-900 px-8 py-4 rounded-full font-black tracking-wide hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        GENERATE MIX <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                                    <span className="relative z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 absolute inset-0 text-white transition-opacity justify-center">
                                        GENERATE MIX <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
