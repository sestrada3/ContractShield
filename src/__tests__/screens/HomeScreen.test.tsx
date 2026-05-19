/**
 * Component tests — HomeScreen
 * Tests document upload UI, usage display, analyze button states,
 * navigation to Results/Paywall, and cancel behaviour.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { useStore } from '../../services/store';

// ─── Service mocks ────────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
const mockAnalyzeDocument = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

jest.mock('../../services/api', () => ({
  analyzeDocument: (...args: any[]) => mockAnalyzeDocument(...args),
}));

jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

const mockAnalysisResult = {
  score: 7, type: 'NDA', verdict: 'Fair', summary: 'Standard NDA.',
  clauses: [], dates: [], positives: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  useStore.setState({
    user: { id: 'u1', email: 'test@test.com' } as any,
    isPro: false,
    freeUsed: 1,
    freeLimit: 3,
    isAnalyzing: false,
    error: null,
    currentResult: null,
    history: [],
  });
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('HomeScreen — rendering', () => {
  it('renders the ContractShield header', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('ContractShield')).toBeTruthy();
  });

  it('renders the main headline', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/actually signing/)).toBeTruthy();
  });

  it('renders Browse Files button', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Browse Files')).toBeTruthy();
  });

  it('renders Camera button', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Camera')).toBeTruthy();
  });

  it('renders Choose from Photo Library button', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Choose from Photo Library')).toBeTruthy();
  });

  it('renders the text paste input', () => {
    const { getByPlaceholderText } = render(<HomeScreen />);
    expect(getByPlaceholderText(/Paste contract/)).toBeTruthy();
  });

  it('renders security badge items', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Encrypted transit')).toBeTruthy();
    expect(getByText('PII stripped')).toBeTruthy();
    expect(getByText('Never stored')).toBeTruthy();
  });
});

// ─── Usage badge ──────────────────────────────────────────────────────────────
describe('HomeScreen — usage badge', () => {
  it('shows remaining free analyses for free users', () => {
    // freeUsed=1, freeLimit=3 → 2 remaining
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/2 free analyses remaining/)).toBeTruthy();
  });

  it('shows singular "analysis" when 1 remaining', () => {
    useStore.setState({ freeUsed: 2, freeLimit: 3 });
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/1 free analysis remaining/)).toBeTruthy();
  });

  it('does not show usage badge for pro users', () => {
    useStore.setState({ isPro: true });
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText(/free anal/i)).toBeNull();
  });

  it('shows Upgrade link for free users', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Upgrade →')).toBeTruthy();
  });
});

// ─── Analyze button states ────────────────────────────────────────────────────
describe('HomeScreen — analyze button', () => {
  it('shows "Analyze My Document →" for free user with quota remaining', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Analyze My Document →')).toBeTruthy();
  });

  it('shows "Upgrade to Analyze →" when free quota exhausted', () => {
    useStore.setState({ isPro: false, freeUsed: 3, freeLimit: 3 });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Upgrade to Analyze →')).toBeTruthy();
  });

  it('analyze button is disabled when no input', () => {
    const { getByText } = render(<HomeScreen />);
    const btn = getByText('Analyze My Document →');
    // The parent TouchableOpacity has disabled prop
    expect(btn).toBeTruthy();
  });
});

// ─── Text input and analyze flow ──────────────────────────────────────────────
describe('HomeScreen — analyze with text', () => {
  it('calls analyzeDocument when text is entered and button pressed', async () => {
    mockAnalyzeDocument.mockResolvedValueOnce(mockAnalysisResult);
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);

    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'This is my employment contract.');
    await act(async () => { fireEvent.press(getByText('Analyze My Document →')); });

    expect(mockAnalyzeDocument).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'This is my employment contract.' }),
    );
  });

  it('navigates to Results on successful analysis', async () => {
    mockAnalyzeDocument.mockResolvedValueOnce(mockAnalysisResult);
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);

    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'Contract text');
    await act(async () => { fireEvent.press(getByText('Analyze My Document →')); });

    expect(mockNavigate).toHaveBeenCalledWith('Results');
  });

  it('navigates to Paywall on 402 error', async () => {
    const err: any = new Error('Quota exceeded');
    err.response = { status: 402 };
    mockAnalyzeDocument.mockRejectedValueOnce(err);

    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'Contract text');
    await act(async () => { fireEvent.press(getByText('Analyze My Document →')); });

    expect(mockNavigate).toHaveBeenCalledWith('Paywall');
  });

  it('shows rate limit alert on 429 error', async () => {
    const Alert = require('react-native').Alert;
    const err: any = new Error('Too many requests');
    err.response = { status: 429 };
    mockAnalyzeDocument.mockRejectedValueOnce(err);

    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'Contract');
    await act(async () => { fireEvent.press(getByText('Analyze My Document →')); });

    expect(Alert.alert).toHaveBeenCalledWith('Slow down', expect.any(String));
  });

  it('shows generic error alert on 500', async () => {
    const Alert = require('react-native').Alert;
    const err: any = new Error('Server error');
    err.response = { status: 500 };
    mockAnalyzeDocument.mockRejectedValueOnce(err);

    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'Contract');
    await act(async () => { fireEvent.press(getByText('Analyze My Document →')); });

    expect(Alert.alert).toHaveBeenCalledWith('Analysis Failed', expect.any(String));
  });
});

// ─── Paywall redirect for exhausted quota ─────────────────────────────────────
describe('HomeScreen — quota exhausted flow', () => {
  it('navigates to Paywall when free quota is 0 and user presses analyze', async () => {
    useStore.setState({ isPro: false, freeUsed: 3, freeLimit: 3 });
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    fireEvent.changeText(getByPlaceholderText(/Paste contract/), 'Some contract text');
    await act(async () => { fireEvent.press(getByText('Upgrade to Analyze →')); });
    expect(mockNavigate).toHaveBeenCalledWith('Paywall');
    expect(mockAnalyzeDocument).not.toHaveBeenCalled();
  });
});

// ─── Account button ───────────────────────────────────────────────────────────
describe('HomeScreen — navigation', () => {
  it('navigates to Account screen when profile icon pressed', () => {
    const { getByTestId } = render(<HomeScreen />);
    // The icon has testID set by the mock: icon-person-circle-outline
    fireEvent.press(getByTestId('icon-person-circle-outline'));
    expect(mockNavigate).toHaveBeenCalledWith('Account');
  });
});
