import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic2, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col items-center bg-dark-900 text-cream-100 font-sans relative overflow-hidden">
      {/* Background Ambience Layer */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full px-4 md:px-8 py-4 md:py-5 flex justify-between items-center z-50 bg-dark-900/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-neon">
            <Mic2 className="text-white w-5 h-5" />
          </div>
          <span className="text-xl md:text-2xl font-display font-black tracking-tight text-white">
            DELULU<span className="text-orange-500">VOICE</span>
          </span>
        </div>
        <div className="flex gap-3 md:gap-6 items-center">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <>
              <Link
                to="/dashboard"
                className="relative group px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-dark-800 border border-orange-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
                <span className="relative text-[10px] md:text-sm font-bold text-orange-400 group-hover:text-orange-300 transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">GO TO</span> STUDIO
                </span>
              </Link>
              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-orange-500/50 transition-all hover:scale-105 shrink-0"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <span className="text-xs font-black text-white">
                      {initials || "?"}
                    </span>
                  </div>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-cream-200/60 hover:text-white transition-colors text-[10px] md:text-sm font-semibold tracking-wide"
              >
                LOG IN
              </Link>
              <Link
                to="/signup"
                className="relative group px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-dark-800 border border-orange-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
                <span className="relative text-[10px] md:text-sm font-bold text-orange-400 group-hover:text-orange-300 transition-colors flex items-center gap-2">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">GET 10 FREE CREDITS</span> <span className="sm:hidden">FREE</span>
                </span>
              </Link>
            </>
          )}
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

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black tracking-[-0.04em] mb-6 leading-[1.05] text-white">
            Drop your lyrics. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 animate-gradient-x">
              Capture the heat.
            </span>
          </h1>

          <p className="text-cream-200/60 text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed px-4">
            Generate Eminem-style rap tracks instantly from text. Collect and
            customize your own 3D cassette tapes. High fidelity audio and
            visuals.
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6 mt-8"
        >
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="group relative flex items-center justify-center gap-3 bg-white text-dark-900 px-6 md:px-10 py-4 md:py-5 rounded-full font-black text-base md:text-lg tracking-wide hover:scale-105 transition-transform overflow-hidden shadow-[0_0_40px_rgba(255,100,0,0.3)] hover:shadow-[0_0_60px_rgba(255,100,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
            <span className="relative z-20 flex items-center gap-2 group-hover:text-white transition-colors">
              {user ? "GO TO STUDIO" : "START CREATING NOW"}{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          {!user && (
            <p className="text-cream-200/40 text-sm font-medium">
              No credit card required. Get 10 free credits instantly.
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
