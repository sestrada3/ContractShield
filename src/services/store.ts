import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { AppConfig } from './api';

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
  isProFloor: boolean;
  isProFloorExpiry: number;
  freeUsed: number;
  freeLimit: number;
  credits: number;
  creditFloor: number;
  creditFloorExpiry: number;

  // Remote config
  appConfig: AppConfig | null;
  setAppConfig: (config: AppConfig) => void;

  // Analysis
  currentResult: AnalysisResult | null;
  history: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setIsPro: (isPro: boolean) => void;
  setIsProFloor: () => void;
  setUsage: (used: number, limit: number, credits?: number) => void;
  setCreditFloor: (credits: number) => void;
  clearFloor: () => void;
  setResult: (result: AnalysisResult) => void;
  setAnalyzing: (val: boolean) => void;
  setError: (error: string | null) => void;
  clearResult: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isPro: false,
  isProFloor: false,
  isProFloorExpiry: 0,
  freeUsed: 0,
  freeLimit: 3,
  credits: 0,
  creditFloor: 0,
  creditFloorExpiry: 0,
  appConfig: null,
  currentResult: null,
  history: [],
  isAnalyzing: false,
  error: null,

  setAppConfig: (appConfig) => set({ appConfig }),
  setUser: (user) => set({ user }),
  setIsPro: (isPro) => set((s) => {
    const floorActive = s.isProFloor && s.isProFloorExpiry > Date.now();
    // Don't let a stale server response downgrade pro status during the floor window.
    if (floorActive && !isPro) return {};
    return { isPro };
  }),
  setIsProFloor: () => set({ isProFloor: true, isProFloorExpiry: Date.now() + 10 * 60_000 }),
  setUsage: (freeUsed, freeLimit, credits) => set((s) => {
    const base = { freeUsed, freeLimit };
    if (credits === undefined) return { ...base, credits: s.credits };
    const floorActive = s.creditFloor > 0 && s.creditFloorExpiry > Date.now();
    if (floorActive && credits >= s.creditFloor) {
      // Server has caught up — use server value and clear floor
      return { ...base, credits, creditFloor: 0, creditFloorExpiry: 0 };
    }
    if (floorActive && credits < s.creditFloor) {
      // Server not yet caught up — hold the floor
      return { ...base, credits: s.creditFloor };
    }
    return { ...base, credits };
  }),
  setCreditFloor: (credits) => set(() => ({ creditFloor: credits, creditFloorExpiry: Date.now() + 5 * 60_000 })),
  clearFloor: () => set({ creditFloor: 0, creditFloorExpiry: 0 }),
  setResult: (result) => set((state) => ({
    currentResult: result,
    history: [result, ...state.history.slice(0, 19)],
  })),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error }),
  clearResult: () => set({ currentResult: null }),
}));
