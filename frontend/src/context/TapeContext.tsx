import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:8000";

export interface Cassette {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  audioUrl?: string;
  duration?: number;
  isPublic?: boolean;
}

export const STRIPE_COLORS = [
  "linear-gradient(to bottom right, #ff5500, #ff8c00)",
  "linear-gradient(to bottom right, #8b5cf6, #d946ef)",
  "linear-gradient(to bottom right, #10b981, #34d399)",
  "linear-gradient(to bottom right, #3b82f6, #60a5fa)",
  "linear-gradient(to bottom right, #ef4444, #f87171)",
  "linear-gradient(to bottom right, #ec4899, #f472b6)",
  "linear-gradient(to bottom right, #f59e0b, #fbbf24)",
];

export interface GenerationState {
  status: "idle" | "generating" | "complete";
  progress: number;
  lyrics: string;
  useInstruments: boolean;
  aiEnhancedLyrics: boolean;
}

interface TapeContextType {
  inventory: Cassette[];
  publicRecords: Cassette[];
  credits: number;
  isPro: boolean;
  setIsPro: (val: boolean) => void;
  addCredits: (amount: number) => void;
  generationState: GenerationState;
  startGeneration: (
    lyrics: string,
    useInstruments: boolean,
    aiEnhancedLyrics: boolean
  ) => void;
  saveGeneratedTape: (
    name: string,
    color: string,
    isPublic: boolean,
    file?: File
  ) => Promise<void>;
  deleteTape: (id: string) => void;
  resetGeneration: () => void;
  updateTape: (id: string, updates: Partial<Cassette>) => void;
  addToInventory: (tape: Cassette) => void;
  refreshInventory: () => Promise<void>;
}

const TapeContext = createContext<TapeContextType | undefined>(undefined);

export function TapeProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();

  const [inventory, setInventory] = useState<Cassette[]>([]);
  const [publicRecords, setPublicRecords] = useState<Cassette[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    progress: 0,
    lyrics: "",
    useInstruments: true,
    aiEnhancedLyrics: false,
  });

  // Derived from auth context
  const credits = user?.credits ?? 0;
  const isPro = user?.is_pro ?? false;

  const refreshInventory = async () => {
    if (!user) {
      setInventory([]);
      return;
    }
    try {
      const res = await fetch(`${API}/songs`, { credentials: "include" });
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      setInventory([]);
    }
  };

  const refreshPublic = async () => {
    try {
      const res = await fetch(`${API}/public`);
      const data = await res.json();
      setPublicRecords(Array.isArray(data) ? data : []);
    } catch {
      setPublicRecords([]);
    }
  };

  // Fetch songs when user changes
  useEffect(() => {
    refreshInventory();
    refreshPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Simulates the backend generation process
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (generationState.status === "generating") {
      interval = setInterval(() => {
        setGenerationState((prev) => {
          if (prev.progress >= 100) {
            clearInterval(interval);
            return { ...prev, status: "complete", progress: 100 };
          }
          // Random progress bumps to feel like real work
          const bump = Math.random() * 3 + 1;
          return { ...prev, progress: Math.min(100, prev.progress + bump) };
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [generationState.status]);

  const startGeneration = (
    lyrics: string,
    useInstruments: boolean,
    aiEnhancedLyrics: boolean
  ) => {
    if (credits < 10) return;
    // Deduct credits locally — backend would also deduct in a real flow
    if (user) {
      setUser((prev) => (prev ? { ...prev, credits: prev.credits - 10 } : prev));
    }
    setGenerationState({
      status: "generating",
      progress: 0,
      lyrics,
      useInstruments,
      aiEnhancedLyrics,
    });
  };

  const addCredits = (amount: number) => {
    if (user) {
      setUser((prev) => (prev ? { ...prev, credits: prev.credits + amount } : prev));
    }
  };

  const setIsPro = (val: boolean) => {
    if (user) {
      setUser((prev) => (prev ? { ...prev, is_pro: val } : prev));
    }
  };

  const saveGeneratedTape = async (
    name: string,
    color: string,
    isPublic: boolean,
    file?: File
  ) => {
    const formData = new FormData();
    if (!file) {
      console.log("No file provided");
      return;
    }
    formData.append("file", file);
    formData.append("name", name);
    formData.append("color", color);
    formData.append("isPublic", String(isPublic));

    await fetch(`${API}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    await refreshInventory();
    await refreshPublic();
    resetGeneration();
  };

  const deleteTape = async (id: string) => {
    await fetch(`${API}/song/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    await refreshInventory();
    await refreshPublic();
  };

  const resetGeneration = () => {
    setGenerationState({
      status: "idle",
      progress: 0,
      lyrics: "",
      useInstruments: true,
      aiEnhancedLyrics: false,
    });
  };

  const updateTape = async (id: string, updates: Partial<Cassette>) => {
    const response = await fetch(`${API}/song/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    const updatedTape = await response.json();

    setInventory((prev) => prev.map((t) => (t.id === id ? updatedTape : t)));
    setPublicRecords((prev) => prev.map((t) => (t.id === id ? updatedTape : t)));
  };

  const addToInventory = async (tape: Cassette) => {
    try {
      const res = await fetch(`${API}/inventory/${tape.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await refreshInventory();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Add to inventory failed:", err.detail);
      }
    } catch (err) {
      console.error("Add to inventory failed:", err);
    }
  };

  return (
    <TapeContext.Provider
      value={{
        inventory,
        publicRecords,
        credits,
        isPro,
        setIsPro,
        addCredits,
        generationState,
        startGeneration,
        saveGeneratedTape,
        deleteTape,
        resetGeneration,
        updateTape,
        addToInventory,
        refreshInventory,
      }}
    >
      {children}
    </TapeContext.Provider>
  );
}

export function useTape() {
  const context = useContext(TapeContext);
  if (context === undefined) {
    throw new Error("useTape must be used within a TapeProvider");
  }
  return context;
}
