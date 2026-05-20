import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

export interface AnalysisResult {
  score: number;
  type: string;
  verdict: string;
  summary: string;
  clauses: Clause[];
  dates: KeyDate[];
  positives: string[];
}

export interface Clause {
  title: string;
  risk: 'high' | 'medium' | 'low';
  plain: string;
  excerpt?: string;
  standard?: string;
  benchmark?: string;
  script?: string;
  action?: string;
}

export interface KeyDate {
  label: string;
  date: string;
  urgency: 'high' | 'medium' | 'low';
  action?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isPro: boolean;
  freeUsed: number;
  freeLimit: number;
  credits: number;

  // Analysis
  currentResult: AnalysisResult | null;
  history: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setIsPro: (isPro: boolean) => void;
  setUsage: (used: number, limit: number, credits?: number) => void;
  setResult: (result: AnalysisResult) => void;
  setAnalyzing: (val: boolean) => void;
  setError: (error: string | null) => void;
  clearResult: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isPro: false,
  freeUsed: 0,
  freeLimit: 3,
  credits: 0,
  currentResult: null,
  history: [],
  isAnalyzing: false,
  error: null,

  setUser: (user) => set({ user }),
  setIsPro: (isPro) => set({ isPro }),
  setUsage: (freeUsed, freeLimit, credits) => set((s) => ({ freeUsed, freeLimit, credits: credits ?? s.credits })),
  setResult: (result) => set((state) => ({
    currentResult: result,
    history: [result, ...state.history.slice(0, 19)],
  })),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error }),
  clearResult: () => set({ currentResult: null }),
}));
