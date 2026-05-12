import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

//const API = "http://localhost:8000";
const API = "https://deluluvoice.onrender.com";

export interface Cassette {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  audioUrl?: string;
  duration?: number;
  isPublic?: boolean;
  lyrics?: string;
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
  status: "idle" | "generating" | "complete" | "error";
  progress: number;
  lyrics: string;
  useInstruments: boolean;
  aiEnhancedLyrics: boolean;
  error?: string;
}

interface TapeContextType {
  inventory: Cassette[];
  publicRecords: Cassette[];
  credits: number;
  isPro: boolean;
  setIsPro: (val: boolean) => Promise<string | null>;
  addCredits: (amount: number) => Promise<string | null>;
  generationState: GenerationState;
  startGeneration: (
    lyrics: string,
    useInstruments: boolean,
    aiEnhancedLyrics: boolean,
  ) => void;
  saveGeneratedTape: (
    name: string,
    color: string,
    isPublic: boolean,
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

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── Status polling ──────────────────────────────────────────────────────────
  const startPolling = () => {
    // Clear any existing poll
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/generate/status`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete") {
          setGenerationState((prev) => ({
            ...prev,
            status: "complete",
            progress: 100,
          }));
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else if (data.status === "error") {
          setGenerationState((prev) => ({
            ...prev,
            status: "error",
            error: data.error || "Generation failed",
          }));
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          // Refresh user to get refunded credits
          if (user) {
            try {
              const meRes = await fetch(`${API}/me`, {
                credentials: "include",
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                setUser(meData);
              }
            } catch {
              /* ignore */
            }
          }
        } else if (data.status === "generating") {
          setGenerationState((prev) => ({
            ...prev,
            progress: data.progress ?? prev.progress,
          }));
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  };

  // ── Check for in-progress generation on mount (e.g., page refresh) ──────────
  useEffect(() => {
    if (!user) return;

    const checkExisting = async () => {
      try {
        const res = await fetch(`${API}/generate/status`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "generating") {
          setGenerationState((prev) => ({
            ...prev,
            status: "generating",
            progress: data.progress ?? 0,
          }));
          startPolling();
        } else if (data.status === "complete") {
          setGenerationState((prev) => ({
            ...prev,
            status: "complete",
            progress: 100,
          }));
        }
      } catch {
        /* ignore */
      }
    };

    checkExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startGeneration = async (
    lyrics: string,
    useInstruments: boolean,
    aiEnhancedLyrics: boolean,
  ) => {
    if (credits < 10) return;

    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lyrics, useInstruments, aiEnhancedLyrics }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Generation start failed:", err.detail);
        return;
      }

      // Deduct credits locally for instant UI feedback
      if (user) {
        setUser((prev) =>
          prev ? { ...prev, credits: prev.credits - 10 } : prev,
        );
      }

      setGenerationState({
        status: "generating",
        progress: 0,
        lyrics,
        useInstruments,
        aiEnhancedLyrics,
      });

      // Start polling for status
      startPolling();
    } catch (err) {
      console.error("Generation start failed:", err);
    }
  };

  const addCredits = async (amount: number): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/credits/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Failed to add credits";
      }
      const updatedUser = await res.json();
      setUser(updatedUser);
      return null;
    } catch {
      return "Network error";
    }
  };

  const setIsPro = async (_val: boolean): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/pro/upgrade`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Failed to upgrade";
      }
      const updatedUser = await res.json();
      setUser(updatedUser);
      return null;
    } catch {
      return "Network error";
    }
  };

  const saveGeneratedTape = async (
    name: string,
    color: string,
    isPublic: boolean,
  ) => {
    try {
      const res = await fetch(`${API}/generate/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, color, isPublic }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Save failed:", err.detail);
        return;
      }

      await refreshInventory();
      await refreshPublic();
      resetGeneration();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const deleteTape = async (id: string) => {
    await fetch(`${API}/song/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    await refreshInventory();
    await refreshPublic();
  };

  const resetGeneration = async () => {
    // Tell backend to cancel/cleanup if needed
    try {
      await fetch(`${API}/generate/cancel`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

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
    setPublicRecords((prev) =>
      prev.map((t) => (t.id === id ? updatedTape : t)),
    );
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
