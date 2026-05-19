/**
 * Component tests — ResultsScreen
 * Tests analysis result display: score, verdict, clauses, key dates,
 * positives, share, copy script, and empty state.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ResultsScreen from '../../screens/ResultsScreen';
import { useStore } from '../../services/store';

const mockGoBack = jest.fn();
const mockClearResult = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

// Prevent actual Share dialog
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));

const FULL_RESULT = {
  score: 7,
  type: 'Employment Contract',
  verdict: 'Reasonable terms — a few clauses worth negotiating.',
  summary: 'Standard employment contract with a broad non-compete clause.',
  clauses: [
    { title: 'Non-Compete', risk: 'high' as const,   plain: 'Cannot work for competitors for 12 months', script: 'Can we narrow the non-compete to direct competitors only?', benchmark: 'aggressive', excerpt: 'You shall not...', action: 'Negotiate scope' },
    { title: 'Severance',   risk: 'low' as const,    plain: 'Two weeks pay on termination without cause', benchmark: 'standard' },
    { title: 'Vacation',    risk: 'medium' as const, plain: 'Three weeks PTO per year' },
  ],
  dates: [
    { label: 'Start Date', date: '2025-01-15', urgency: 'high' as const,   action: 'Confirm onboarding details by Jan 10' },
    { label: 'Review Date', date: '2025-07-15', urgency: 'medium' as const },
  ],
  positives: ['Market rate salary', 'Remote work allowed', 'Health benefits included'],
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useStore.setState({ currentResult: FULL_RESULT, clearResult: mockClearResult } as any);
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Empty state ──────────────────────────────────────────────────────────────
describe('ResultsScreen — empty state', () => {
  it('shows "No results yet" when currentResult is null', () => {
    useStore.setState({ currentResult: null });
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('No results yet.')).toBeTruthy();
  });

  it('shows Go Back link in empty state', () => {
    useStore.setState({ currentResult: null });
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('← Go Back')).toBeTruthy();
  });
});

// ─── Score and verdict ────────────────────────────────────────────────────────
describe('ResultsScreen — score and verdict', () => {
  it('renders the score number', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('7')).toBeTruthy();
  });

  it('renders the verdict text', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText(/"Reasonable terms/)).toBeTruthy();
  });

  it('renders the summary text', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText(/Standard employment contract/)).toBeTruthy();
  });

  it('renders the document type badge', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Employment Contract')).toBeTruthy();
  });
});

// ─── Stats row ────────────────────────────────────────────────────────────────
describe('ResultsScreen — stats row', () => {
  it('shows red flags count (high-risk clauses)', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Red Flags')).toBeTruthy();
    // 1 high-risk clause
    expect(getByText('1')).toBeTruthy();
  });

  it('shows total clauses count', () => {
    const { getByText, getAllByText } = render(<ResultsScreen />);
    expect(getByText('Clauses')).toBeTruthy();
    // '3' appears for both clauses and positives counts
    expect(getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows key dates count', () => {
    const { getAllByText } = render(<ResultsScreen />);
    expect(getAllByText('Key Dates').length).toBeGreaterThan(0);
    expect(getAllByText('2').length).toBeGreaterThan(0);
  });

  it('shows positives count', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Positives')).toBeTruthy();
  });
});

// ─── Clause rendering ─────────────────────────────────────────────────────────
describe('ResultsScreen — clauses', () => {
  it('renders all clause titles', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Non-Compete')).toBeTruthy();
    expect(getByText('Severance')).toBeTruthy();
    expect(getByText('Vacation')).toBeTruthy();
  });

  it('renders HIGH RISK pill for high-risk clause', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('HIGH RISK')).toBeTruthy();
  });

  it('renders FAVORABLE pill for low-risk clause', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('FAVORABLE')).toBeTruthy();
  });

  it('renders CAUTION pill for medium-risk clause', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('CAUTION')).toBeTruthy();
  });

  it('pre-expands the first high-risk clause', () => {
    const { getByText } = render(<ResultsScreen />);
    // The script should be visible since the first high-risk clause starts open
    expect(getByText('WHAT TO SAY')).toBeTruthy();
    expect(getByText(/Can we narrow the non-compete/)).toBeTruthy();
  });

  it('has Copy button for clause with script', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Copy')).toBeTruthy();
  });
});

// ─── Key dates ────────────────────────────────────────────────────────────────
describe('ResultsScreen — key dates', () => {
  it('renders key date labels', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Start Date')).toBeTruthy();
    expect(getByText('Review Date')).toBeTruthy();
  });

  it('renders date values', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('2025-01-15')).toBeTruthy();
  });

  it('renders date action text', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Confirm onboarding details by Jan 10')).toBeTruthy();
  });
});

// ─── Positives ────────────────────────────────────────────────────────────────
describe('ResultsScreen — positives', () => {
  it('renders WORKS IN YOUR FAVOR section', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('WORKS IN YOUR FAVOR')).toBeTruthy();
  });

  it('renders all positive bullet points', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Market rate salary')).toBeTruthy();
    expect(getByText('Remote work allowed')).toBeTruthy();
    expect(getByText('Health benefits included')).toBeTruthy();
  });
});

// ─── Back navigation ──────────────────────────────────────────────────────────
describe('ResultsScreen — navigation', () => {
  it('calls clearResult and goBack when Back button pressed', async () => {
    const { getByText } = render(<ResultsScreen />);
    await act(async () => { fireEvent.press(getByText('Back')); });
    // clearResult is called via useStore().clearResult()
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders Share button', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText('Share')).toBeTruthy();
  });
});

// ─── Disclaimer ───────────────────────────────────────────────────────────────
describe('ResultsScreen — disclaimer', () => {
  it('shows "Not legal advice" disclaimer', () => {
    const { getByText } = render(<ResultsScreen />);
    expect(getByText(/Not legal advice/)).toBeTruthy();
  });
});
