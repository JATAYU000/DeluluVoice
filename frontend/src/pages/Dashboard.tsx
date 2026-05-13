import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic2,
  Play,
  X,
  Plus,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Download,
} from "lucide-react";
import { useTape, type Cassette, STRIPE_COLORS } from "../context/TapeContext";
import { useAuth } from "../context/AuthContext";
import { GoldCoin } from "../components/GoldCoin";
import ProfileModal from "../components/ProfileModal";

interface CassetteGraphicProps {
  tape: Cassette;
  className?: string;
  isEditing?: boolean;
  tempName?: string;
  tempColor?: string;
  onChangeName?: (name: string) => void;
  onChangeColor?: (color: string) => void;
}

function CassetteGraphic({
  tape,
  className = "",
  isEditing,
  tempName,
  tempColor,
  onChangeName,
  onChangeColor,
}: CassetteGraphicProps) {
  const displayColor = isEditing ? tempColor || tape.color : tape.color;
  const displayName = isEditing ? (tempName ?? tape.name) : tape.name;

  return (
    <div
      className={`w-full h-full bg-[#2a2a2a] rounded-md shadow-2xl border-2 border-[#1a1a1a] relative p-1.5 flex flex-col ring-1 ring-black/80 ${className}`}
    >
      {/* Screws */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(0,0,0,1)]" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(0,0,0,1)]" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(0,0,0,1)]" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[inset_0_1px_1px_rgba(0,0,0,1)]" />

      {/* Main Label */}
      <div className="flex-1 bg-[#ede8d5] rounded-[3px] p-2 flex flex-col relative shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] overflow-hidden border border-[#d1cbb8]">
        {/* Vintage red stripe */}
        <div className="absolute top-[35%] left-0 right-0 h-1.5 bg-[#c24a42]" />
        <div
          className="absolute top-0 bottom-0 left-0 w-2 opacity-80"
          style={{ background: displayColor }}
        />

        {/* Top Text Area */}
        <div className="flex justify-between items-start w-full relative z-10 px-2 h-[35%]">
          <span className="text-black font-display font-black text-3xl leading-none tracking-tighter">
            A
          </span>
          <div className="flex flex-col flex-1 mx-4 gap-[2px] mt-1 opacity-20">
            <div className="w-full h-[2px] bg-black" />
            <div className="w-full h-[2px] bg-black" />
            <div className="w-full h-[2px] bg-black" />
          </div>
        </div>

        {/* Track Name */}
        {isEditing ? (
          <input
            autoFocus
            type="text"
            maxLength={20}
            value={displayName}
            onChange={(e) => onChangeName && onChangeName(e.target.value)}
            className="absolute top-0.5 left-10 right-10 text-center text-black/90 font-display font-black text-sm uppercase z-20 bg-white/50 border border-black/20 rounded px-1 py-0.5 outline-none ring-1 ring-orange-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="absolute top-2 left-6 right-6 text-center text-black/80 font-display font-black text-[10px] uppercase truncate z-10">
            {displayName}
          </span>
        )}

        {/* Edit Color Picker */}
        {isEditing && (
          <div
            className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30 bg-black/80 p-1 rounded-full shadow-lg border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {STRIPE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-3 h-3 rounded-full hover:scale-125 transition-all ${displayColor === c ? "border border-white scale-125" : ""}`}
                style={{ background: c }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChangeColor && onChangeColor(c);
                }}
              />
            ))}
            {/* Custom Color Input */}
            <div
              className={`relative w-3 h-3 rounded-full overflow-hidden transition-all hover:scale-125 flex items-center justify-center border border-white/20
                            ${!STRIPE_COLORS.includes(displayColor) ? "border-white scale-125" : ""}`}
              style={{
                background: !STRIPE_COLORS.includes(displayColor)
                  ? displayColor
                  : "#333",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-2 h-2 text-white absolute mix-blend-overlay pointer-events-none" />
              <input
                type="color"
                value={
                  !STRIPE_COLORS.includes(displayColor)
                    ? displayColor
                    : "#ffffff"
                }
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChangeColor && onChangeColor(e.target.value);
                }}
                className="absolute -inset-2 w-8 h-8 cursor-pointer opacity-0"
              />
            </div>
          </div>
        )}

        {/* Spools Cutout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[35%] bg-[#1a1a1a] rounded-full flex items-center justify-between px-2 border border-[rgba(0,0,0,0.5)] shadow-[inset_0_4px_10px_rgba(0,0,0,1)] z-10">
          <div className="w-6 h-6 rounded-full bg-white/10 border-[3px] border-[#222]" />
          <div className="absolute left-[40%] right-[40%] h-[70%] bg-[#222]/80 rounded-[1px] shadow-inner border border-black/40" />
          <div className="w-6 h-6 rounded-full bg-white/10 border-[3px] border-[#222]" />
        </div>

        {/* Bottom Text Area */}
        <div className="mt-auto flex justify-between items-end w-full relative z-10 px-2 pb-0 opacity-90">
          <span className="text-black/60 font-mono text-[8px] font-bold tracking-widest whitespace-nowrap mb-0.5">
            {new Date(tape.createdAt || new Date()).toLocaleDateString(
              "en-US",
              { month: "2-digit", day: "2-digit", year: "2-digit" },
            )}
          </span>
          <span className="text-black font-display font-black text-2xl leading-none tracking-tighter">
            90
          </span>
        </div>

        <span className="absolute bottom-1 right-[20%] text-black/90 font-mono text-[7px] font-bold tracking-widest z-10 scale-y-110">
          TYPE ((NORMAL BIAS))
        </span>
      </div>

      {/* Bottom Trapezoid bump area */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-2.5 bg-[#1f1f1f] border-t border-[#111] rounded-t-sm flex items-end justify-center gap-6 pb-[1px] z-20">
        <div className="w-2.5 h-1.5 rounded-sm bg-black shadow-inner border border-[#333]/50" />
        <div className="w-2.5 h-1.5 rounded-sm bg-black shadow-inner border border-[#333]/50" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    inventory,
    publicRecords,
    credits,
    isPro,
    updateTape,
    deleteTape,
    addToInventory,
  } = useTape();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showTapeModal, setShowTapeModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "public">(
    "inventory",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // The tape currently selected to be played or playing
  const [selectedTape, setSelectedTape] = useState<Cassette | null>(null);

  // Player state: 'idle', 'inserting', 'ready', 'playing', 'ejecting'
  const [playerState, setPlayerState] = useState<
    "idle" | "inserting" | "ready" | "playing" | "ejecting"
  >("idle");

  // Volume Knob State (-135deg to +135deg)
  const [volumeRotation, setVolumeRotation] = useState(81); // 80% volume default

  // Audio Playback States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleVolumePan = (
    _e: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    // Calculate rotation based on vertical drag primarily
    const delta = info.delta.y * -1 + info.delta.x;
    setVolumeRotation((prev) => {
      let next = prev + delta;
      if (next < -135) next = -135;
      if (next > 135) next = 135;
      return next;
    });
  };

  // Rename Modal State
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STRIPE_COLORS[0]);
  const [isPublicEdit, setIsPublicEdit] = useState(false);
  const [editingTapeId, setEditingTapeId] = useState<string | null>(null);

  const openEditModal = (tape: Cassette) => {
    setEditingTapeId(tape.id);
    setNewName(tape.name);
    setNewColor(tape.color);
    setIsPublicEdit(tape.isPublic || false);
    setShowTapeModal(true);
    setIsDeleting(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTapeId || !newName.trim()) return;

    updateTape(editingTapeId, {
      name: newName,
      color: newColor,
      isPublic: isPublicEdit,
    });
    if (selectedTape?.id === editingTapeId) {
      setSelectedTape((prev) =>
        prev
          ? { ...prev, name: newName, color: newColor, isPublic: isPublicEdit }
          : prev,
      );
    }

    setShowTapeModal(false);
    setEditingTapeId(null);
    setNewName("");
    setNewColor(STRIPE_COLORS[0]);
    setIsPublicEdit(false);
    setIsDeleting(false);
  };

  const handleDeleteTape = () => {
    if (!editingTapeId) return;
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    deleteTape(editingTapeId);
    if (selectedTape?.id === editingTapeId) {
      handleEject(); // eject if currently playing
    }
    setShowTapeModal(false);
    setEditingTapeId(null);
    setIsDeleting(false);
  };

  const openNewTapeModal = () => {
    navigate("/generate");
  };

  const handleSelectTape = (tape: Cassette) => {
    if (
      selectedTape?.id === tape.id ||
      playerState === "inserting" ||
      playerState === "ejecting"
    )
      return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Eject current if any
    if (selectedTape) {
      setPlayerState("ejecting");
      setTimeout(() => {
        setSelectedTape(tape);
        setPlayerState("inserting");
      }, 600);
    } else {
      setSelectedTape(tape);
      setPlayerState("inserting");
    }
  };

  const handleEject = () => {
    if (
      !selectedTape ||
      playerState === "inserting" ||
      playerState === "ejecting"
    )
      return;

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlayerState("ejecting");
    setTimeout(() => {
      setSelectedTape(null);
      setPlayerState("idle");
    }, 600);
  };

  const handlePlayPause = () => {
    if (
      !selectedTape ||
      playerState === "inserting" ||
      playerState === "ejecting"
    )
      return;

    if (playerState === "playing") {
      audioRef.current?.pause();
      setPlayerState("ready");
    } else if (playerState === "ready") {
      audioRef.current
        ?.play()
        .catch((e) => console.error("Playback failed:", e));
      setPlayerState("playing");
    }
  };

  const handleNext = () => {
    if (
      !selectedTape ||
      playerState === "inserting" ||
      playerState === "ejecting"
    )
      return;
    const currentList = publicRecords.find((t) => t.id === selectedTape.id)
      ? publicRecords
      : inventory;
    const currentIndex = currentList.findIndex((t) => t.id === selectedTape.id);
    const nextIndex = (currentIndex + 1) % currentList.length;
    if (currentList[nextIndex]) handleSelectTape(currentList[nextIndex]);
  };

  const handlePrev = () => {
    if (
      !selectedTape ||
      playerState === "inserting" ||
      playerState === "ejecting"
    )
      return;
    const currentList = publicRecords.find((t) => t.id === selectedTape.id)
      ? publicRecords
      : inventory;
    const currentIndex = currentList.findIndex((t) => t.id === selectedTape.id);
    const prevIndex =
      (currentIndex - 1 + currentList.length) % currentList.length;
    if (currentList[prevIndex]) handleSelectTape(currentList[prevIndex]);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      const normalized = (volumeRotation + 135) / 270;
      audioRef.current.volume = Math.max(0, Math.min(1, normalized));
    }
  }, [volumeRotation, selectedTape]);

  // Audio Hooks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setPlayerState("ready");
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [selectedTape]);

  // Auto-progress inserting state
  useEffect(() => {
    if (playerState === "inserting") {
      const timer = setTimeout(() => {
        setPlayerState("ready");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [playerState]);

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#050505] overflow-y-auto lg:overflow-hidden flex flex-col relative font-sans text-white">
      {/* Background Ambience Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,20,20,1)_0%,rgba(5,5,5,1)_100%)] z-0" />
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-[#ff5500]/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* HEADER */}
      <header className="absolute top-0 w-full p-4 md:p-6 px-4 md:px-10 flex justify-between items-center z-40 bg-gradient-to-b from-black to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
            <Mic2 className="text-orange-500 w-5 h-5 shadow-neon" />
          </div>
          <span className="text-lg md:text-2xl font-display font-black tracking-tight text-white drop-shadow-md">
            DELULU<span className="text-orange-500">VOICE</span>
          </span>
        </div>

        <div className="flex items-center gap-6 pointer-events-auto">
          <Link
            to="/pricing"
            className="bg-[#111]/80 backdrop-blur-md border border-white/5 py-1.5 pl-2 pr-4 md:pr-5 rounded-full flex items-center gap-1 md:gap-2 hover:bg-[#1a1a1a] hover:border-orange-500/30 transition-all shadow-glass"
          >
            <GoldCoin className="w-6 h-6 md:w-7 md:h-7" />
            <span className="font-bold text-xs md:text-sm text-[#fdfbf7]">{isPro ? '∞' : credits}</span>
          </Link>
          <button
            onClick={openNewTapeModal}
            className="group relative bg-[#fdfbf7] text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-black tracking-wide flex items-center gap-2 hover:scale-105 transition-all overflow-hidden shadow-neon"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
            <span className="relative z-10 flex items-center gap-1 md:gap-2 group-hover:text-white transition-colors">
              <Plus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">NEW RAP</span> <span className="sm:hidden">NEW</span>
            </span>
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-orange-500/50 transition-all hover:scale-105 shrink-0"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <span className="text-xs font-black text-white">
                  {user?.name
                    ?.split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?"}
                </span>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* MAIN 2D LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 pt-24 pb-12 px-4 md:px-10 gap-12 lg:gap-20 lg:h-full z-10 relative items-center justify-center">
        {/* LEFT COLUMN: Physical shelf on mobile follows the player */}
        <div className="order-2 lg:order-1 w-full lg:w-[48%] lg:max-w-[540px] h-auto lg:h-[95%] flex flex-col relative select-none">
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`text-sm font-display font-black tracking-widest uppercase drop-shadow transition-colors ${activeTab === "inventory" ? "text-orange-500" : "text-[#fdfbf7]/40 hover:text-white"}`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab("public")}
                className={`text-sm font-display font-black tracking-widest uppercase drop-shadow transition-colors ${activeTab === "public" ? "text-orange-500" : "text-[#fdfbf7]/40 hover:text-white"}`}
              >
                Public Records
              </button>
            </div>
            {activeTab === "inventory" && (
              <span className="text-xs font-mono font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                {Array.isArray(inventory) ? inventory.length : 0} /{" "}
                {isPro ? 39 : 26}
              </span>
            )}
          </div>

          <div className="flex-1 w-full bg-[#111] flex flex-col rounded-xl border-2 border-[#1a1a1a] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] p-4 px-6 relative z-50 overflow-hidden min-h-[400px] lg:min-h-0">
            {/* The dark inner cavity of the shelf */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#050505] pointer-events-none rounded-xl" />

            {activeTab === "inventory" ? (
              <div className="h-full relative overflow-y-auto no-scrollbar pt-2">
                {/* MOBILE VIEW: Wrapping Grid of Spines */}
                <div className="flex md:hidden flex-wrap gap-x-2 gap-y-4 justify-center pb-8">
                  {(Array.isArray(inventory) ? inventory : []).map((tape, i) => {
                    const isPlaying = selectedTape?.id === tape.id;
                    const isLocked = !isPro && i >= 26;

                    if (isLocked) return null;

                    return (
                      <button
                        key={tape.id}
                        onClick={() => handleSelectTape(tape)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openEditModal(tape);
                        }}
                        className={`group relative h-32 w-[7.5%] flex-shrink-0 flex justify-center bg-gradient-to-b from-[#222] to-[#1a1a1a] border border-[#333] border-b-[#050505] rounded-[2px] shadow-[2px_0_4px_rgba(0,0,0,0.6)] transition-all duration-300 origin-bottom ${isPlaying ? "opacity-0 pointer-events-none" : "active:scale-95"}`}
                      >
                        <div
                          className="absolute top-1 inset-x-1 h-2 rounded-[1px] opacity-90 border-b border-[#000]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"
                          style={{ background: tape.color }}
                        />
                        <div className="absolute top-5 w-1 h-1 rounded-full bg-black" />
                        <span
                          className="font-mono text-[8px] font-bold text-white/80 tracking-widest uppercase truncate transform -rotate-90 whitespace-nowrap absolute"
                          style={{
                            bottom: "35%",
                            width: "80px",
                            transformOrigin: "center",
                          }}
                        >
                          {tape.name}
                        </span>
                      </button>
                    );
                  })}

                  {/* Empty slots for mobile */}
                  {Array.from({
                    length: Math.max(
                      0,
                      (isPro ? 39 : 26) - (Array.isArray(inventory) ? inventory.length : 0),
                    ),
                  }).map((_, i) => {
                    const slotIndex = (Array.isArray(inventory) ? inventory.length : 0) + i;
                    const isLocked = !isPro && slotIndex >= 26;
                    if (isLocked) return null;

                    return (
                      <div
                        key={`empty-${i}`}
                        className="h-32 w-[7.5%] bg-white/5 border border-white/5 rounded-[2px] opacity-20"
                      />
                    );
                  })}
                </div>

                {/* DESKTOP VIEW: Fixed 3-Row Physical Shelf */}
                <div className="hidden md:flex flex-col h-full gap-4 relative justify-around">
                  {Array.from({ length: 3 }).map((_, rowIndex) => {
                    const tapesInRow = (
                      Array.isArray(inventory) ? inventory : []
                    ).slice(rowIndex * 13, (rowIndex + 1) * 13);
                    return (
                      <div
                        key={rowIndex}
                        className="flex-1 border-b-[6px] border-[#222] shadow-[0_4px_10px_rgba(0,0,0,1)] relative flex items-end pb-1 gap-1"
                      >
                        <div className="absolute -bottom-[6px] left-[-24px] right-[-24px] h-[6px] bg-[#1a1a1a] border-t border-white/5 shadow-[0_4px_6px_rgba(0,0,0,0.8)] z-[-1]" />

                        {Array.from({ length: 13 }).map((_, colIndex) => {
                          const slotKey = rowIndex * 13 + colIndex;
                          const isLocked = !isPro && rowIndex === 2;
                          const tape = tapesInRow[colIndex];

                          if (isLocked) {
                            return (
                              <div
                                key={slotKey}
                                className="w-[7.5%] h-[95%] opacity-0 pointer-events-none flex-shrink-0"
                              />
                            );
                          }

                          if (!tape)
                            return (
                              <div
                                key={slotKey}
                                className="w-[7.5%] h-[95%] opacity-0 pointer-events-none flex-shrink-0"
                              />
                            );

                          const isPlaying = selectedTape?.id === tape.id;

                          return (
                            <button
                              key={slotKey}
                              onClick={() => handleSelectTape(tape)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                openEditModal(tape);
                              }}
                              className={`group relative h-[100%] w-[7.5%] flex-shrink-0 flex justify-center bg-gradient-to-b from-[#222] to-[#1a1a1a] border border-[#333] border-b-[#050505] rounded-[2px] shadow-[2px_0_4px_rgba(0,0,0,0.6)] transition-all duration-300 origin-bottom ${isPlaying ? "opacity-0 pointer-events-none" : "hover:-translate-y-2 hover:scale-[1.10] hover:z-[60] hover:shadow-[0_20px_40px_rgba(0,0,0,0.9)]"}`}
                            >
                              <div
                                className="absolute top-1 inset-x-1 h-3 rounded-[1px] opacity-90 border-b border-[#000]/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"
                                style={{ background: tape.color }}
                              />
                              <div className="absolute top-6 w-1.5 h-1.5 rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                              <span
                                className="font-mono text-[9px] font-bold text-white/80 tracking-widest uppercase truncate drop-shadow transform -rotate-90 whitespace-nowrap absolute"
                                style={{
                                  bottom: "40%",
                                  width: "100px",
                                  transformOrigin: "center",
                                }}
                              >
                                {tape.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Pro Lock Overlay */}
                {!isPro && (
                  <div className="md:absolute relative w-full md:w-auto md:bottom-4 md:left-4 md:right-4 md:h-[28%] h-auto min-h-[140px] mt-8 md:mt-0 bg-black/60 backdrop-blur-sm border border-orange-500/30 rounded-lg z-[60] flex flex-col items-center justify-center p-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-orange-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display font-black text-white text-base md:text-lg tracking-widest uppercase mb-1">
                      Row Locked
                    </h3>
                    <p className="text-[8px] md:text-[9px] font-mono tracking-widest text-white/50 uppercase text-center mb-4">
                      Upgrade to Pro to unlock 13 more tape slots
                    </p>
                    <Link
                      to="/pricing"
                      className="bg-orange-500 hover:bg-orange-400 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Unlock Now
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full relative z-10 w-full pt-2">
                <input
                  type="text"
                  placeholder="Search public records..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                    setTimeout(() => setIsSearching(false), 500);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500 mb-6 transition-colors shadow-inner"
                />
                {isSearching ? (
                  <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-orange-500 animate-pulse uppercase tracking-widest gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    Searching Databanks...
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-3 space-y-3 pb-4">
                    {publicRecords
                      .filter((t) =>
                        t.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .map((tape) => (
                        <div
                          key={tape.id}
                          className={`w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-4 flex items-center justify-between hover:border-orange-500/50 transition-colors ${selectedTape?.id === tape.id ? "border-orange-500 bg-orange-500/5" : ""}`}
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div
                              className="w-1.5 h-8 rounded-full"
                              style={{ background: tape.color }}
                            />
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-display font-black text-base truncate">
                                {tape.name}
                              </span>
                              <span className="font-mono text-[10px] text-white/40">
                                {new Date(tape.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleSelectTape(tape)}
                              className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-transform shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)] border border-[#333]"
                            >
                              <Play
                                className="w-4 h-4 text-orange-500 ml-0.5"
                                fill="currentColor"
                              />
                            </button>
                            <button
                              onClick={() => addToInventory(tape)}
                              className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-transform shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)] border border-[#333]"
                              title="Add to Inventory"
                            >
                              <Plus className="w-5 h-5 text-white/50 hover:text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {publicRecords.filter((t) =>
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    ).length === 0 && (
                      <div className="text-center font-mono text-xs text-white/30 mt-12 flex flex-col items-center gap-2">
                        <Mic2 className="w-6 h-6 text-white/10" />
                        No records found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FRONT-FACING RETRO BOOMBOX PLAYER */}
        <div className="order-1 lg:order-2 w-full lg:flex-1 lg:max-w-[600px] flex items-center justify-center">
          {/* The Main Boombox Chassis (Based on User Reference Image) */}
          <div className="w-full aspect-[4/3] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_4px_4px_rgba(255,255,255,0.1),inset_0_-8px_4px_rgba(0,0,0,0.6)] border-2 border-[#111] border-b-[#000] p-4 flex flex-col relative z-20">
            {/* 0. The Floating Carry Handle */}
            <div className="absolute -top-10 left-8 right-8 h-10 border-4 border-b-0 border-[#111] rounded-t-xl z-[-1]" />
            <div className="absolute -top-12 left-[10%] right-[10%] h-4 bg-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-t-lg z-[-1] border-t border-white/10" />
            {/* Silver antenna peeking out */}
            <div className="absolute -top-32 left-1/2 w-1.5 h-32 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rotate-12 origin-bottom shadow-[-2px_2px_4px_rgba(0,0,0,0.5)] z-[-2] rounded-t-full" />

            {/* 1. Top Controls Deck */}
            <div className="w-full h-16 bg-[#111] rounded-t-lg border-b-4 border-[#000] shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] px-6 flex justify-between items-end pb-2 mb-2 relative">
              <div className="absolute top-2 left-6 text-[8px] font-mono text-white/30 tracking-widest text-[#444]">
                RECORD PLAYER SYSTEM DELULU-800
              </div>

              {/* Left Side: Brand Logo / empty */}
              <div className="flex gap-1 mb-1">
                <span className="font-display font-black tracking-tighter text-[#333] text-2xl drop-shadow">
                  DL-800 <span className="text-orange-900/40">PRO</span>
                </span>
              </div>

              {/* Right Side: Big Volume Knob */}
              <div className="flex flex-col items-center gap-1 mb-1 relative">
                <span className="absolute -top-7 right-4 text-[7px] font-display font-black text-orange-500/80 uppercase tracking-widest whitespace-nowrap">
                  MASTER VOLUME
                </span>
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#333] via-[#222] to-[#111] border-[3px] border-[#000] shadow-[0_6px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center relative cursor-grab active:cursor-grabbing transition-shadow touch-none"
                  animate={{ rotate: volumeRotation }}
                  onPan={handleVolumePan}
                >
                  <div className="absolute inset-[3px] rounded-full border border-black/60 shadow-inner overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 rounded-full border border-white/5 bg-[repeating-conic-gradient(from_0deg,transparent,transparent_10deg,rgba(0,0,0,0.3)_10deg,rgba(0,0,0,0.3)_20deg)] mix-blend-overlay" />
                  </div>
                  <div className="w-1.5 h-4 bg-orange-500 rounded-full mb-6 shadow-[0_0_5px_rgba(255,85,0,0.8)] z-10 pointer-events-none" />
                </motion.div>
              </div>
            </div>

            {/* Main Machine Face (Wood/Orange retro paneling) */}
            <div className="w-full flex-1 bg-[#8c4623] rounded-sm p-4 flex gap-4 border border-[#3a1b0b] shadow-inner relative">
              {/* Wood grain texture effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply flex flex-col justify-around">
                {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-[1px] bg-black/40 skew-y-1"
                  />
                ))}
              </div>

              {/* LEFT HALF: Cassette Deck + Controls */}
              <div className="flex-[1.1] flex flex-col gap-3 relative perspective-[1200px]">
                {/* The Deck Housing */}
                <div className="w-full h-[75%] bg-[#1a1a1a] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-4 border-[#0a0a0a] p-2 relative flex flex-col">
                  <div className="w-full h-6 flex justify-between items-center px-2 border-b border-[#333] pb-1 mb-2">
                    <span className="text-[8px] font-mono text-white/60">
                      CASSETTE RECORDER
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] ${playerState === "playing" ? "bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse" : "bg-[#111]"}`}
                    />
                  </div>

                  {/* The Deep Cavity inside the player */}
                  <div className="w-full flex-1 bg-[#050505] rounded shadow-[inset_0_15px_25px_rgba(0,0,0,1)] flex items-center justify-center z-0 relative border border-[#000]">
                    <div className="w-[85%] h-[40%] border border-[#1a1a1a] rounded flex items-center justify-between px-8 bg-black/40">
                      {/* Spindles */}
                      <div
                        className={`w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#0a0a0a] relative flex items-center justify-center ${playerState === "playing" ? "animate-spin" : ""}`}
                        style={{
                          animationDuration: "3s",
                          animationTimingFunction: "linear",
                          animationIterationCount: "infinite",
                        }}
                      >
                        <div className="w-1 h-6 bg-[#333] absolute" />
                        <div className="w-6 h-1 bg-[#333] absolute" />
                        <div className="w-2 h-2 rounded-full bg-black shadow-inner" />
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#0a0a0a] relative flex items-center justify-center ${playerState === "playing" ? "animate-spin" : ""}`}
                        style={{
                          animationDuration: "3s",
                          animationTimingFunction: "linear",
                          animationIterationCount: "infinite",
                        }}
                      >
                        <div className="w-1 h-6 bg-[#333] absolute" />
                        <div className="w-6 h-1 bg-[#333] absolute" />
                        <div className="w-2 h-2 rounded-full bg-black shadow-inner" />
                      </div>
                    </div>

                    {/* The Tape Graphic sliding in */}
                    <div
                      className="absolute w-[86%] h-[56%] top-[22%] left-[7%] z-[60] transition-all duration-[600ms] ease-out pointer-events-none flex items-center justify-center transform-gpu"
                      style={{
                        transform:
                          playerState === "ready" || playerState === "playing"
                            ? "translateY(0) scale(1)"
                            : "translateY(-180px) scale(0.8)",
                        opacity: playerState === "idle" ? 0 : 1,
                      }}
                    >
                      {selectedTape && playerState !== "idle" && (
                        <div className="w-full h-full drop-shadow-2xl">
                          <CassetteGraphic tape={selectedTape} />
                        </div>
                      )}
                    </div>

                    {/* The 3D Hinged Lid Cover (Rotates on X axis) */}
                    <div
                      className="absolute inset-[-4px] bg-[#222]/50 backdrop-blur-[1px] rounded border-2 border-[#111] border-t-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.6)] origin-bottom transition-all duration-[600ms] ease-out z-[70] flex items-center justify-center pointer-events-none"
                      style={{
                        transform:
                          playerState === "idle" ||
                          playerState === "ejecting" ||
                          playerState === "inserting"
                            ? "rotateX(-45deg)"
                            : "rotateX(0deg)",
                      }}
                    >
                      {/* Rectangular Glass Window */}
                      <div className="w-[90%] h-[45%] border-2 border-[#000] bg-white/5 rounded-[2px] overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mt-4">
                        {/* Glass streak reflection */}
                        <div className="absolute top-[-50%] left-0 w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/20 to-transparent -rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Built-in mic detail below deck */}
                  <div className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-[#111] shadow-inner grid grid-cols-2 gap-[1px] p-[2px] opacity-70 border border-[#000]">
                    <div className="bg-black rounded-full" />
                    <div className="bg-black rounded-full" />
                    <div className="bg-black rounded-full" />
                    <div className="bg-black rounded-full" />
                  </div>
                </div>

                {/* Playback Controls (Moved Below Deck) */}
                <div className="h-[25%] bg-[#1a1a1a] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-[3px] border-[#0a0a0a] flex flex-col p-2 gap-1.5 relative z-10 w-full">
                  {/* Progress track */}
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[7px] font-mono text-white/50 w-6 text-right">
                      {Math.floor(currentTime / 60)}:
                      {Math.floor(currentTime % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <div
                      className="flex-1 h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#222] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] relative cursor-pointer group"
                      onClick={handleProgressClick}
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-orange-500 shadow-[0_0_8px_rgba(255,85,0,0.8)] transition-all duration-100 ease-linear pointer-events-none"
                        style={{
                          width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[7px] font-mono text-white/50 w-6">
                      {Math.floor(duration / 60)}:
                      {Math.floor(duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>
                  {/* Buttons */}
                  <div className="w-full flex-1 flex items-center justify-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="flex-1 h-full bg-gradient-to-b from-[#2a2a2a] to-[#111] border-[1.5px] border-[#444] border-b-black rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center group"
                    >
                      <SkipBack className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      className={`flex-[1.5] h-full bg-gradient-to-b from-[#2a2a2a] to-[#111] border-[1.5px] border-[#444] border-b-black rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center group ${playerState === "playing" ? "bg-gradient-to-b from-[#111] to-[#000] translate-y-[2px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border-[#000]" : ""}`}
                    >
                      {playerState === "playing" ? (
                        <Pause
                          className="w-6 h-6 text-orange-500 drop-shadow-[0_0_8px_rgba(255,85,0,0.8)]"
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          className="w-6 h-6 text-white/50 group-hover:text-white transition-colors"
                          fill="currentColor"
                        />
                      )}
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 h-full bg-gradient-to-b from-[#2a2a2a] to-[#111] border-[1.5px] border-[#444] border-b-black rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center group"
                    >
                      <SkipForward className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                    <button
                      onClick={handleEject}
                      className={`flex-[1.2] h-full bg-gradient-to-b from-[#2a2a2a] to-[#111] border-[1.5px] border-[#444] border-b-black rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all flex items-center justify-center group ${playerState === "ejecting" ? "bg-[#000] translate-y-[2px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border-black" : ""}`}
                    >
                      <Square
                        className="w-5 h-5 text-red-500/80 group-hover:text-red-500 transition-colors"
                        fill="currentColor"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT HALF: Radio Tuning & Speaker Panel */}
              <div className="flex-1 flex flex-col gap-4 relative z-10">
                {/* AM/FM Tuning Dial Window */}
                <div className="w-full h-16 bg-[#000] rounded shadow-[inset_0_4px_10px_rgba(0,0,0,1)] border border-[#333] relative overflow-hidden flex flex-col p-1.5">
                  <div className="w-full flex-1 border border-[#1a1a1a] bg-[#111] relative flex flex-col justify-center px-4 overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent mix-blend-screen pointer-events-none" />
                    {/* Tuning markings */}
                    <div className="flex justify-between w-full opacity-60">
                      {[88, 92, 96, 100, 104, 108].map((freq) => (
                        <div key={freq} className="flex flex-col items-center">
                          <div className="h-2 w-[1px] bg-white/80 mb-0.5" />
                          <span className="text-[6px] font-mono text-white tracking-tighter">
                            {freq}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between w-full opacity-40 mt-1">
                      {[5, 6, 7, 8, 10, 12, 14, 16].map((freq) => (
                        <div key={freq} className="flex flex-col items-center">
                          <div className="h-1.5 w-[1px] bg-red-400 mb-0.5" />
                          <span className="text-[5px] font-mono text-red-300 tracking-tighter">
                            {freq}00
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Red tuning needle */}
                    <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)] left-[40%]" />
                  </div>
                </div>

                {/* Main Speaker Grille Grate */}
                <div className="w-full flex-1 bg-[#1a1a1a] rounded shadow-lg border border-[#333] border-t-[#222] border-l-[#222] flex items-center justify-center p-3 relative overflow-hidden">
                  {/* Inner speaker cone detail shadow */}
                  <div className="absolute w-32 h-32 rounded-full border border-[#0a0a0a] bg-black/40 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] z-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
                  </div>

                  {/* Hidden Audio Element */}
                  {selectedTape && selectedTape.audioUrl && (
                    <audio
                      ref={audioRef}
                      src={selectedTape.audioUrl}
                      preload="metadata"
                    />
                  )}

                  {/* Cassette Slot & Cover */}
                  <div className="w-full h-full z-10 flex flex-col justify-between">
                    {/* Horizontal Slats */}
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-full h-3 bg-[#111] border-t border-white/5 border-b border-[#050505] shadow-[0_2px_4px_rgba(0,0,0,0.5)] rounded-sm"
                      />
                    ))}
                  </div>

                  {/* Branding Badge on speaker */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#000] border border-white/20 shadow-md rounded-[1px] rotate-[-5deg]">
                    <span className="text-[7px] font-display font-black text-orange-500 tracking-widest">
                      Hi-Fi Audio
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showTapeModal && (() => {
              const editingTape = inventory.find((t) => t.id === editingTapeId);
              const handleDownload = async () => {
                if (!editingTape?.audioUrl) return;
                try {
                  const response = await fetch(editingTape.audioUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `delulu-${newName || editingTape.name || "track"}.mp3`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error("Download failed:", err);
                }
              };

              return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={() => {
                  setShowTapeModal(false);
                  setEditingTapeId(null);
                  setIsDeleting(false);
                }}
              >
                <motion.form
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 30 }}
                  className="relative flex flex-col items-center gap-5 w-full max-w-[480px]"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={handleSaveEdit}
                >
                  {/* Top-right action buttons */}
                  <div className="absolute -top-12 right-0 flex items-center gap-2">
                    {editingTape?.audioUrl && (
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="text-white/50 hover:text-orange-500 transition-colors bg-white/10 hover:bg-white/15 p-2 rounded-full"
                        title="Download MP3"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTapeModal(false);
                        setEditingTapeId(null);
                        setIsDeleting(false);
                      }}
                      className="text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* The giant tape interface */}
                  <div className="w-full max-w-[450px] aspect-[450/280]">
                    <CassetteGraphic
                      tape={{
                        id: editingTapeId || "temp",
                        name: newName,
                        color: newColor,
                        createdAt: editingTape?.createdAt || "",
                      }}
                      isEditing={true}
                      tempName={newName}
                      tempColor={newColor}
                      onChangeName={setNewName}
                      onChangeColor={setNewColor}
                    />
                  </div>

                  {/* Lyrics display */}
                  {editingTape?.lyrics && (
                    <div className="w-full bg-[#111] border border-white/10 rounded-xl p-1 max-h-[160px] overflow-y-auto shadow-inner">
                      <pre className="text-white/60 font-mono text-xs leading-relaxed whitespace-pre-wrap text-center p-3 select-text">
                        {editingTape.lyrics}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex justify-center mb-1">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isPublicEdit}
                          onChange={(e) => setIsPublicEdit(e.target.checked)}
                        />
                        <div
                          className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isPublicEdit ? "bg-orange-500" : "bg-white/10"}`}
                        >
                          <motion.div
                            className="w-4 h-4 rounded-full bg-white absolute shadow-md"
                            animate={{
                              left: isPublicEdit ? "calc(100% - 20px)" : "4px",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        </div>
                        <span
                          className={`font-mono text-xs tracking-widest uppercase transition-colors ${isPublicEdit ? "text-white" : "text-white/40"}`}
                        >
                          {isPublicEdit ? "Public" : "Private"}
                        </span>
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button
                        type="button"
                        onClick={handleDeleteTape}
                        className={`flex-1 py-4 font-black font-display tracking-widest uppercase rounded-xl transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-[0.98] ${
                          isDeleting
                            ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                            : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                        }`}
                      >
                        {isDeleting ? "Confirm Delete" : "Delete Tape"}
                      </button>
                      <button
                        type="submit"
                        disabled={!newName}
                        className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black font-display tracking-widest uppercase rounded-xl shadow-neon transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        Save Updates
                      </button>
                    </div>
                  </div>
                </motion.form>
              </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Profile Modal */}
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onLogout={() => navigate("/")}
            onAccountDeleted={() => navigate("/")}
          />
        </div>
      </div>
    </div>
  );
}
