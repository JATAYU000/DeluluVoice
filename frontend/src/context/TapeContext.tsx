import React, { createContext, useContext, useState, useEffect } from "react";

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
    aiEnhancedLyrics: boolean,
  ) => void;
  saveGeneratedTape: (
    name: string,
    color: string,
    isPublic: boolean,
    file: File,
  ) => Promise<void>;
  deleteTape: (id: string) => void;
  resetGeneration: () => void;
  updateTape: (id: string, updates: Partial<Cassette>) => void;
  addToInventory: (tape: Cassette) => void;
}

const TapeContext = createContext<TapeContextType | undefined>(undefined);

export function TapeProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<Cassette[]>([]); //INVENTORY_TAPES
  const [publicRecords, setPublicRecords] = useState<Cassette[]>([]); //PUBLIC_RECORDS_MOCK
  const [credits, setCredits] = useState(10);
  const [isPro, setIsPro] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    progress: 0,
    lyrics: "",
    useInstruments: true,
    aiEnhancedLyrics: false,
  });

  useEffect(() => {
    fetch("http://localhost:8000/songs")
      .then((res) => res.json())
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setInventory(safeData);
      })
      .catch((err) => {
        console.error(err);
        setInventory([]);
      });

    fetch("http://localhost:8000/public")
      .then((res) => res.json())
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setPublicRecords(safeData);
      })
      .catch((err) => {
        console.error(err);
        setPublicRecords([]);
      });
  }, []);

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
    aiEnhancedLyrics: boolean,
  ) => {
    if (credits < 10) return;
    setCredits((prev) => prev - 10);
    setGenerationState({
      status: "generating",
      progress: 0,
      lyrics,
      useInstruments,
      aiEnhancedLyrics,
    });
  };

  const addCredits = (amount: number) => {
    setCredits((prev) => prev + amount);
  };

  const saveGeneratedTape = async (
    name: string,
    color: string,
    isPublic: boolean,
    file: File,
  ) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("name", name);
    formData.append("color", color);
    formData.append("isPublic", String(isPublic));

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    const songsRes = await fetch("http://localhost:8000/songs");
    const songs = await songsRes.json();

    setInventory(Array.isArray(songs) ? songs : []);

    const publicRes = await fetch("http://localhost:8000/public");
    const publicSongs = await publicRes.json();

    setPublicRecords(Array.isArray(publicSongs) ? publicSongs : []);

    resetGeneration();
  };

  const deleteTape = async (id: string) => {
    await fetch(`http://localhost:8000/song/${id}`, {
      method: "DELETE",
    });

    const songsRes = await fetch("http://localhost:8000/songs");
    const songs = await songsRes.json();

    setInventory(Array.isArray(songs) ? songs : []);

    const publicRes = await fetch("http://localhost:8000/public");
    const publicSongs = await publicRes.json();

    setPublicRecords(Array.isArray(publicSongs) ? publicSongs : []);
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

  const updateTape = (id: string, updates: Partial<Cassette>) => {
    setInventory((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    if (updates.isPublic !== undefined) {
      const tape = inventory.find((t) => t.id === id);
      if (tape) {
        if (updates.isPublic) {
          setPublicRecords((prev) => {
            if (!prev.find((t) => t.id === id)) {
              return [...prev, { ...tape, ...updates }];
            }
            return prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
          });
        } else {
          setPublicRecords((prev) => prev.filter((t) => t.id !== id));
        }
      }
    }
  };

  const addToInventory = (tape: Cassette) => {
    setInventory((prev) => {
      if (prev.find((t) => t.id === tape.id)) return prev; // Already in inventory
      const maxTapes = isPro ? 39 : 26;
      if (prev.length < maxTapes) {
        return [...prev, { ...tape, isPublic: false }];
      }
      return prev;
    });
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
