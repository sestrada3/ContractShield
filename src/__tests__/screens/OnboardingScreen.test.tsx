/**
 * Component tests — OnboardingScreen
 * Tests the 3-slide onboarding carousel: rendering, navigation, and completion.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import OnboardingScreen from '../../screens/OnboardingScreen';

const mockOnDone = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('OnboardingScreen — rendering', () => {
  it('renders the Skip button', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText('Skip')).toBeTruthy();
  });

  it('renders the first slide title (WHY IT MATTERS)', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText(/Know What You're/)).toBeTruthy();
  });

  it('renders the first slide tag', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText('WHY IT MATTERS')).toBeTruthy();
  });

  it('renders "Next →" button on first slide', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText('Next →')).toBeTruthy();
  });

  it('renders all three slide content in the scrollview', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    // All slide titles are rendered in the horizontal scroll
    expect(getByText('WHY IT MATTERS')).toBeTruthy();
    expect(getByText('HOW IT WORKS')).toBeTruthy();
    expect(getByText('YOUR PRIVACY')).toBeTruthy();
  });
});

// ─── Skip behaviour ───────────────────────────────────────────────────────────
describe('OnboardingScreen — skip', () => {
  it('calls onDone when Skip is pressed', async () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    await act(async () => { fireEvent.press(getByText('Skip')); });
    expect(mockOnDone).toHaveBeenCalledTimes(1);
  });

  it('saves onboarding_done to SecureStore when Skip is pressed', async () => {
    const SecureStore = require('expo-secure-store');
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    await act(async () => { fireEvent.press(getByText('Skip')); });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('onboarding_done', '1');
  });
});

// ─── Next button behaviour ────────────────────────────────────────────────────
describe('OnboardingScreen — Next button', () => {
  it('does not call onDone when Next is pressed on first slide', async () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    await act(async () => { fireEvent.press(getByText('Next →')); });
    expect(mockOnDone).not.toHaveBeenCalled();
  });

  it('triggers haptic feedback on Next press', async () => {
    const Haptics = require('expo-haptics');
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    await act(async () => { fireEvent.press(getByText('Next →')); });
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
});

// ─── Detail bullets ───────────────────────────────────────────────────────────
describe('OnboardingScreen — slide content', () => {
  it('shows privacy slide detail text', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText('Encrypted in transit')).toBeTruthy();
  });

  it('shows how-it-works bullet about AI scoring', () => {
    const { getByText } = render(<OnboardingScreen onDone={mockOnDone} />);
    expect(getByText('AI scores every clause in seconds')).toBeTruthy();
  });
});
