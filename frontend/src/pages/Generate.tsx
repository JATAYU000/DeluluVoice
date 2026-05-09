import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Wand2, Mic2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTape, STRIPE_COLORS } from '../context/TapeContext';
import { GoldCoin } from '../components/GoldCoin';

export default function Generate() {
    const { credits, generationState, startGeneration, saveGeneratedTape } = useTape();
    const navigate = useNavigate();

    // Form State
    const [lyrics, setLyrics] = useState(generationState.lyrics || '');
    const [useInstruments, setUseInstruments] = useState(generationState.useInstruments ?? true);
    const [aiEnhancedLyrics, setAiEnhancedLyrics] = useState(generationState.aiEnhancedLyrics ?? false);

    // Completion State
    const [name, setName] = useState('');
    const [color, setColor] = useState(STRIPE_COLORS[0]);
    const [isPublic, setIsPublic] = useState(false);

    // UI State
    const [showInfo, setShowInfo] = useState(false);

    // Synchronize initial state if coming back to page while generating
    useEffect(() => {
        if (generationState.status === 'generating') {
            setLyrics(generationState.lyrics);
            setUseInstruments(generationState.useInstruments);
            setAiEnhancedLyrics(generationState.aiEnhancedLyrics);
        }
    }, [generationState]);

    const handleStart = () => {
        if (!lyrics.trim() || credits <= 0) return;
        startGeneration(lyrics, useInstruments, aiEnhancedLyrics);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        saveGeneratedTape(name, color, isPublic);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-12">
                <Link to="/dashboard" className="text-white/50 hover:text-white flex items-center gap-2 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-mono text-sm tracking-widest uppercase">Back to Studio</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <GoldCoin className="w-4 h-4" />
                        <span className="font-mono text-xs tracking-widest text-white/80">{credits}</span>
                    </div>
                </div>
            </header>

            <div className="w-full max-w-6xl flex-1 flex flex-col lg:flex-row gap-12 lg:gap-20">

                {/* Left Side: Input Area */}
                <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="font-display font-black text-4xl tracking-tighter uppercase">New Track</h1>
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-orange-500 text-black' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showInfo && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                                    <h3 className="font-display font-bold text-orange-400 mb-2 uppercase tracking-wide">Writing Guide</h3>
                                    <p className="text-sm text-white/70 mb-4 font-mono leading-relaxed">
                                        Write your lyrics exactly how you want them performed. Use bracketed tags [Verse], [Chorus], or [Drop] to guide the flow.
                                    </p>
                                    <div className="bg-black/50 p-4 rounded text-xs font-mono text-white/50 whitespace-pre-line border border-white/5 leading-relaxed">
                                        <span className="text-white/90">[Verse 1]</span>{'\n'}
                                        I'm far from perfect, there's so many lessons I done learned{'\n'}
                                        If money's evil, look at all the evil I done earned{'\n'}
                                        I'm doing what I'm supposed to, I'm a writer, I'm a fighter{'\n'}
                                        Entrepreneur, fresh out the sewer, watch me maneuver, what's it to ya?
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-1 shadow-inner relative flex flex-col min-h-[300px]">
                        <textarea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            disabled={generationState.status !== 'idle'}
                            placeholder="Write your masterpiece here..."
                            className="w-full flex-1 bg-transparent text-white p-6 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none placeholder-white/20"
                        />

                        <div className="border-t border-white/10 p-4 flex justify-between items-center bg-black/40 rounded-b-xl gap-4">
                            <div className="flex gap-6 items-center">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={useInstruments}
                                        onChange={(e) => setUseInstruments(e.target.checked)}
                                        disabled={generationState.status !== 'idle'}
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${useInstruments ? 'bg-orange-500' : 'bg-white/10'}`}>
                                        <motion.div
                                            className="w-4 h-4 rounded-full bg-white absolute shadow-md"
                                            animate={{ left: useInstruments ? 'calc(100% - 20px)' : '4px' }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                    <span className={`font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2 ${useInstruments ? 'text-white' : 'text-white/40'}`}>
                                        Instruments
                                        <Mic2 className={`w-4 h-4 ${useInstruments ? 'text-orange-500' : 'text-white/20'}`} />
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={aiEnhancedLyrics}
                                        onChange={(e) => setAiEnhancedLyrics(e.target.checked)}
                                        disabled={generationState.status !== 'idle'}
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${aiEnhancedLyrics ? 'bg-orange-500' : 'bg-white/10'}`}>
                                        <motion.div
                                            className="w-4 h-4 rounded-full bg-white absolute shadow-md"
                                            animate={{ left: aiEnhancedLyrics ? 'calc(100% - 20px)' : '4px' }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                    <span className={`font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2 ${aiEnhancedLyrics ? 'text-white' : 'text-white/40'}`}>
                                        AI Enhanced Lyrics
                                        <Wand2 className={`w-4 h-4 ${aiEnhancedLyrics ? 'text-orange-500' : 'text-white/20'}`} />
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Visualizer / State panel */}
                <div className="flex-[0.8] flex flex-col items-center justify-center relative perspective-[1000px]">

                    {/* IDLE STATE */}
                    {generationState.status === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl"
                        >
                            <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,100,0,0.2)]">
                                <Wand2 className="w-10 h-10 text-orange-500" />
                            </div>
                            <h2 className="font-display font-black text-2xl uppercase tracking-tighter mb-2">Ready to Record</h2>
                            <p className="text-white/40 text-sm text-center mb-8 font-mono">
                                10 Credits per generation.
                            </p>

                            <button
                                onClick={handleStart}
                                disabled={!lyrics.trim() || credits < 10}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-black font-display text-xl tracking-widest uppercase rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 cursor-pointer"
                            >
                                Generate Track
                            </button>
                        </motion.div>
                    )}

                    {/* GENERATING STATE: Visualizer Animation */}
                    {generationState.status === 'generating' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center justify-center p-8 bg-black border border-orange-500/30 rounded-3xl relative overflow-hidden shadow-[0_0_100px_rgba(255,100,0,0.15)]"
                        >
                            {/* Scanning Laser Line */}
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-orange-500/50 shadow-[0_0_20px_rgba(255,100,0,1)] z-0"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />

                            <div className="relative z-10 flex flex-col items-center w-full">
                                {/* Equalizer Bars */}
                                <div className="flex items-end justify-center gap-1.5 h-32 mb-8 w-full border-b border-orange-500/20 pb-1">
                                    {[...Array(16)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-full max-w-[12px] bg-gradient-to-t from-orange-600 to-yellow-400 rounded-t-sm shadow-[0_0_10px_rgba(255,150,0,0.5)]"
                                            animate={{
                                                height: ['10%', `${Math.random() * 60 + 40}%`, '10%']
                                            }}
                                            transition={{
                                                duration: 0.5 + Math.random() * 0.5,
                                                repeat: Infinity,
                                                repeatType: "mirror",
                                                delay: i * 0.05
                                            }}
                                        />
                                    ))}
                                </div>

                                <h2 className="font-display font-black text-3xl uppercase tracking-tighter text-orange-500 animate-pulse mb-1">Synthesizing</h2>
                                <p className="font-mono text-white/50 text-xs tracking-widest uppercase mb-6">Processing Audio Data...</p>

                                {/* Progress Bar Container */}
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                                    <motion.div
                                        className="absolute top-0 bottom-0 left-0 bg-orange-500 shadow-[0_0_15px_rgba(255,100,0,1)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${generationState.progress}%` }}
                                        transition={{ ease: "easeOut", duration: 0.5 }}
                                    />
                                </div>
                                <div className="w-full flex justify-between mt-2 font-mono text-[10px] text-orange-500/70 tracking-widest">
                                    <span>SYS.BURN</span>
                                    <span>{Math.round(generationState.progress)}%</span>
                                </div>
                                <div className="mt-8 text-center bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl w-full flex items-center justify-center gap-4">
                                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 shrink-0">
                                        <Info className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-mono text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">
                                            Safe to navigate away
                                        </p>
                                        <p className="font-mono text-[9px] text-white/60 uppercase tracking-widest leading-relaxed">
                                            Track continues burning in background.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* COMPLETE STATE: Tape Customization */}
                    {generationState.status === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: 90 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            className="w-full flex flex-col items-center p-8 bg-[#111] border border-[#333] rounded-3xl"
                        >
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>

                            <h2 className="font-display font-black text-2xl uppercase tracking-tighter mb-4 text-white">Track Mastered</h2>

                            <div className="w-full bg-black/50 p-6 rounded-xl border border-white/10 mb-6 flex flex-col gap-4">
                                <div>
                                    <label className="block font-mono text-xs text-white/50 mb-2 uppercase tracking-widest">Tape Label Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="E.g. Summer Mix '94"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-xs text-white/50 mb-2 uppercase tracking-widest">Spine Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {STRIPE_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                                                style={{ background: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-mono text-xs text-white/50 mb-2 uppercase tracking-widest">Visibility</label>
                                    <label className="flex items-center gap-3 cursor-pointer group w-max">
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isPublic ? 'bg-orange-500' : 'bg-white/10'}`}>
                                            <motion.div
                                                className="w-4 h-4 rounded-full bg-white absolute shadow-md"
                                                animate={{ left: isPublic ? 'calc(100% - 20px)' : '4px' }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </div>
                                        <span className={`font-mono text-xs tracking-widest uppercase transition-colors ${isPublic ? 'text-white' : 'text-white/40'}`}>
                                            {isPublic ? 'Public' : 'Private'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                className="w-full py-4 bg-white text-black hover:bg-white/90 font-black font-display text-lg tracking-widest uppercase rounded-xl transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                            >
                                Save to Shelf
                            </button>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
}
