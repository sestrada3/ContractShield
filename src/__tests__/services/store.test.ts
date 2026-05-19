/**
 * Unit tests — Zustand store (store.ts)
 * Pure state management tests, no mocks required.
 */

import { useStore, AnalysisResult } from '../../services/store';

const mockResult: AnalysisResult = {
  score: 7,
  type: 'Employment Contract',
  verdict: 'Reasonable terms with minor red flags.',
  summary: 'Standard employment contract with standard non-compete.',
  clauses: [
    { title: 'Non-compete', risk: 'high', plain: 'Cannot work for competitors for 12 months' },
    { title: 'Severance',   risk: 'low',  plain: 'Two weeks pay on termination' },
  ],
  dates: [
    { label: 'Start date', date: '2025-01-15', urgency: 'high' },
  ],
  positives: ['Market rate salary', 'Remote work allowed'],
};

const mockUser: any = {
  id: 'user-abc',
  email: 'user@test.com',
  created_at: '2024-01-01T00:00:00Z',
};

// Reset store to initial state before each test
beforeEach(() => {
  useStore.setState({
    user: null,
    isPro: false,
    freeUsed: 0,
    freeLimit: 3,
    currentResult: null,
    history: [],
    isAnalyzing: false,
    error: null,
  });
});

// ─── Initial state ────────────────────────────────────────────────────────────
describe('Initial state', () => {
  it('user is null', () => {
    expect(useStore.getState().user).toBeNull();
  });

  it('isPro is false', () => {
    expect(useStore.getState().isPro).toBe(false);
  });

  it('freeUsed starts at 0', () => {
    expect(useStore.getState().freeUsed).toBe(0);
  });

  it('freeLimit starts at 3', () => {
    expect(useStore.getState().freeLimit).toBe(3);
  });

  it('currentResult is null', () => {
    expect(useStore.getState().currentResult).toBeNull();
  });

  it('history is empty array', () => {
    expect(useStore.getState().history).toEqual([]);
  });

  it('isAnalyzing is false', () => {
    expect(useStore.getState().isAnalyzing).toBe(false);
  });

  it('error is null', () => {
    expect(useStore.getState().error).toBeNull();
  });
});

// ─── setUser ──────────────────────────────────────────────────────────────────
describe('setUser', () => {
  it('sets user to provided value', () => {
    useStore.getState().setUser(mockUser);
    expect(useStore.getState().user).toEqual(mockUser);
  });

  it('sets user to null (logout)', () => {
    useStore.setState({ user: mockUser });
    useStore.getState().setUser(null);
    expect(useStore.getState().user).toBeNull();
  });

  it('does not modify other state fields', () => {
    useStore.setState({ isPro: true, freeUsed: 2 });
    useStore.getState().setUser(mockUser);
    expect(useStore.getState().isPro).toBe(true);
    expect(useStore.getState().freeUsed).toBe(2);
  });
});

// ─── setIsPro ─────────────────────────────────────────────────────────────────
describe('setIsPro', () => {
  it('sets isPro to true', () => {
    useStore.getState().setIsPro(true);
    expect(useStore.getState().isPro).toBe(true);
  });

  it('sets isPro to false', () => {
    useStore.setState({ isPro: true });
    useStore.getState().setIsPro(false);
    expect(useStore.getState().isPro).toBe(false);
  });
});

// ─── setUsage ─────────────────────────────────────────────────────────────────
describe('setUsage', () => {
  it('updates freeUsed and freeLimit', () => {
    useStore.getState().setUsage(2, 5);
    expect(useStore.getState().freeUsed).toBe(2);
    expect(useStore.getState().freeLimit).toBe(5);
  });

  it('accepts 0 values', () => {
    useStore.setState({ freeUsed: 3, freeLimit: 3 });
    useStore.getState().setUsage(0, 3);
    expect(useStore.getState().freeUsed).toBe(0);
  });
});

// ─── setResult ────────────────────────────────────────────────────────────────
describe('setResult', () => {
  it('sets currentResult', () => {
    useStore.getState().setResult(mockResult);
    expect(useStore.getState().currentResult).toEqual(mockResult);
  });

  it('prepends result to history', () => {
    useStore.getState().setResult(mockResult);
    expect(useStore.getState().history[0]).toEqual(mockResult);
  });

  it('keeps multiple results in history in order (newest first)', () => {
    const result2 = { ...mockResult, score: 3, type: 'Lease' };
    useStore.getState().setResult(mockResult);
    useStore.getState().setResult(result2);
    expect(useStore.getState().history[0]).toEqual(result2);
    expect(useStore.getState().history[1]).toEqual(mockResult);
  });

  it('caps history at 20 items', () => {
    for (let i = 0; i < 22; i++) {
      useStore.getState().setResult({ ...mockResult, score: i });
    }
    expect(useStore.getState().history).toHaveLength(20);
  });

  it('keeps most recent 20 when capped', () => {
    for (let i = 0; i < 22; i++) {
      useStore.getState().setResult({ ...mockResult, score: i });
    }
    // Most recent: score=21 (last added)
    expect(useStore.getState().history[0].score).toBe(21);
    // Oldest in history: score=2 (items 0 and 1 were evicted)
    expect(useStore.getState().history[19].score).toBe(2);
  });
});

// ─── setAnalyzing ─────────────────────────────────────────────────────────────
describe('setAnalyzing', () => {
  it('sets isAnalyzing to true', () => {
    useStore.getState().setAnalyzing(true);
    expect(useStore.getState().isAnalyzing).toBe(true);
  });

  it('sets isAnalyzing to false', () => {
    useStore.setState({ isAnalyzing: true });
    useStore.getState().setAnalyzing(false);
    expect(useStore.getState().isAnalyzing).toBe(false);
  });
});

// ─── setError ─────────────────────────────────────────────────────────────────
describe('setError', () => {
  it('sets error string', () => {
    useStore.getState().setError('Analysis failed');
    expect(useStore.getState().error).toBe('Analysis failed');
  });

  it('clears error by setting null', () => {
    useStore.setState({ error: 'Some error' });
    useStore.getState().setError(null);
    expect(useStore.getState().error).toBeNull();
  });
});

// ─── clearResult ──────────────────────────────────────────────────────────────
describe('clearResult', () => {
  it('sets currentResult to null', () => {
    useStore.setState({ currentResult: mockResult });
    useStore.getState().clearResult();
    expect(useStore.getState().currentResult).toBeNull();
  });

  it('does not affect history when clearing', () => {
    useStore.getState().setResult(mockResult);
    useStore.getState().clearResult();
    expect(useStore.getState().history).toHaveLength(1);
  });
});
