import { Music } from 'lucide-react';

export function GoldCoin({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <div className={`relative rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border border-yellow-200 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0 ${className}`}>
            <div className="absolute inset-[15%] rounded-full border-[0.5px] border-yellow-700/50 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-inner">
                <Music className="w-[60%] h-[60%] text-yellow-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" strokeWidth={3} />
            </div>

            {/* Specular highlight */}
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[1px] rotate-45 transform pointer-events-none mix-blend-overlay" />
        </div>
    );
}
