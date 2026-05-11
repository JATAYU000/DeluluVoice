import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mic2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password, rememberMe);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      onClick={() => navigate("/")}
    >
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 group">
        <Mic2 className="text-orange-500 w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="text-xl font-bold tracking-tighter">
          DELULU<span className="text-orange-500">VOICE</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400">Log in to your account</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                rememberMe ? "bg-orange-500" : "bg-white/10"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setRememberMe(!rememberMe);
              }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute shadow-md transition-all duration-200 ${
                  rememberMe ? "left-[calc(100%-18px)]" : "left-[3px]"
                }`}
              />
            </div>
            <span
              className={`text-sm transition-colors ${
                rememberMe ? "text-white" : "text-gray-500"
              }`}
            >
              Remember me
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-orange-500 hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
