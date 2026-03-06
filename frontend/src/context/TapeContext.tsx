import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Cassette {
    id: string;
    name: string;
    color: string;
    createdAt: string;
    audioUrl?: string;
    duration?: number;
}

export const STRIPE_COLORS = [
    'linear-gradient(to bottom right, #ff5500, #ff8c00)',
    'linear-gradient(to bottom right, #8b5cf6, #d946ef)',
    'linear-gradient(to bottom right, #10b981, #34d399)',
    'linear-gradient(to bottom right, #3b82f6, #60a5fa)',
    'linear-gradient(to bottom right, #ef4444, #f87171)',
    'linear-gradient(to bottom right, #ec4899, #f472b6)',
    'linear-gradient(to bottom right, #f59e0b, #fbbf24)'
];

const MOCK_TAPES: Cassette[] = [
    { id: '1', name: 'Midnight Cruising', color: 'linear-gradient(to bottom right, #ff5500, #ff8c00)', createdAt: '1987-05-12T00:00:00.000Z', audioUrl: '/audio/dummy.mp3', duration: 15 },
    { id: '2', name: 'Neon Dreams', color: 'linear-gradient(to bottom right, #8b5cf6, #d946ef)', createdAt: '1989-11-23T00:00:00.000Z', audioUrl: '/audio/dummy.mp3', duration: 15 },
    { id: '3', name: 'Cyberpunk Verse', color: 'linear-gradient(to bottom right, #10b981, #34d399)', createdAt: '1992-02-14T00:00:00.000Z', audioUrl: '/audio/dummy.mp3', duration: 15 },
    { id: '4', name: 'LoFi Study Beat', color: 'linear-gradient(to bottom right, #3b82f6, #60a5fa)', createdAt: '1995-08-08T00:00:00.000Z', audioUrl: '/audio/dummy.mp3', duration: 15 },
    { id: '5', name: 'Hard Drill Pt 2', color: 'linear-gradient(to bottom right, #ef4444, #f87171)', createdAt: '1998-12-31T00:00:00.000Z', audioUrl: '/audio/dummy.mp3', duration: 15 },
];

export interface GenerationState {
    status: 'idle' | 'generating' | 'complete';
    progress: number;
    lyrics: string;
    useInstruments: boolean;
}

interface TapeContextType {
    tapes: Cassette[];
    credits: number;
    isPro: boolean;
    setIsPro: (val: boolean) => void;
    addCredits: (amount: number) => void;
    generationState: GenerationState;
    startGeneration: (lyrics: string, useInstruments: boolean) => void;
    saveGeneratedTape: (name: string, color: string) => void;
    deleteTape: (id: string) => void;
    resetGeneration: () => void;
    updateTape: (id: string, updates: Partial<Cassette>) => void;
}

const TapeContext = createContext<TapeContextType | undefined>(undefined);

export function TapeProvider({ children }: { children: React.ReactNode }) {
    const [tapes, setTapes] = useState<Cassette[]>(MOCK_TAPES);
    const [credits, setCredits] = useState(10);
    const [isPro, setIsPro] = useState(false);
    const [generationState, setGenerationState] = useState<GenerationState>({
        status: 'idle',
        progress: 0,
        lyrics: '',
        useInstruments: true
    });

    // Simulates the backend generation process
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (generationState.status === 'generating') {
            interval = setInterval(() => {
                setGenerationState(prev => {
                    if (prev.progress >= 100) {
                        clearInterval(interval);
                        return { ...prev, status: 'complete', progress: 100 };
                    }
                    // Random progress bumps to feel like real work
                    const bump = Math.random() * 3 + 1;
                    return { ...prev, progress: Math.min(100, prev.progress + bump) };
                });
            }, 1200);
        }
        return () => clearInterval(interval);
    }, [generationState.status]);

    const startGeneration = (lyrics: string, useInstruments: boolean) => {
        if (credits < 10) return;
        setCredits(prev => prev - 10);
        setGenerationState({
            status: 'generating',
            progress: 0,
            lyrics,
            useInstruments
        });
    };

    const addCredits = (amount: number) => {
        setCredits(prev => prev + amount);
    };

    const saveGeneratedTape = (name: string, color: string) => {
        const newTape: Cassette = {
            id: Math.random().toString(36).substring(2, 10),
            name,
            color,
            createdAt: new Date().toISOString(),
            audioUrl: '/audio/dummy.mp3',
            duration: 15
        };

        setTapes((prev) => {
            const maxTapes = isPro ? 39 : 26;
            if (prev.length < maxTapes) {
                return [...prev, newTape];
            }
            return prev;
        });

        resetGeneration();
    };

    const deleteTape = (id: string) => {
        setTapes((prev) => prev.filter(t => t && t.id !== id));
    };

    const resetGeneration = () => {
        setGenerationState({
            status: 'idle',
            progress: 0,
            lyrics: '',
            useInstruments: true
        });
    };

    const updateTape = (id: string, updates: Partial<Cassette>) => {
        setTapes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    return (
        <TapeContext.Provider value={{
            tapes,
            credits,
            isPro,
            setIsPro,
            addCredits,
            generationState,
            startGeneration,
            saveGeneratedTape,
            deleteTape,
            resetGeneration,
            updateTape
        }}>
            {children}
        </TapeContext.Provider>
    );
}

export function useTape() {
    const context = useContext(TapeContext);
    if (context === undefined) {
        throw new Error('useTape must be used within a TapeProvider');
    }
    return context;
}
