/**
 * Component tests — PaywallScreen
 * Tests subscription UI: plan rendering, selection, CTA text,
 * checkout initiation, and AppState return flow.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PaywallScreen from '../../screens/PaywallScreen';
import { useStore } from '../../services/store';

const mockGoBack  = jest.fn();
const mockNavigate = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockGetUsage = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('../../services/api', () => ({
  createCheckoutSession: (...a: any[]) => mockCreateCheckoutSession(...a),
  getUsage:              (...a: any[]) => mockGetUsage(...a),
}));

jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  useStore.setState({
    user: { id: 'u1', email: 'test@test.com' } as any,
    isPro: false,
    freeUsed: 3,
    freeLimit: 3,
    setIsPro: jest.fn(),
    setUsage: jest.fn(),
  } as any);
  mockGetUsage.mockResolvedValue({ isPro: false, used: 3, limit: 3 });
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('PaywallScreen — rendering', () => {
  it('renders "ContractShield Pro" title', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('ContractShield Pro')).toBeTruthy();
  });

  it('renders social proof stat', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/12,000\+ users/)).toBeTruthy();
  });

  it('renders all 7 features', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Unlimited contract analyses/)).toBeTruthy();
    expect(getByText(/Full clause breakdowns/)).toBeTruthy();
    expect(getByText(/Market benchmarking/)).toBeTruthy();
    expect(getByText(/negotiation scripts/)).toBeTruthy();
    expect(getByText(/Key date/)).toBeTruthy();
    expect(getByText(/Analysis history/)).toBeTruthy();
    expect(getByText(/Priority support/)).toBeTruthy();
  });

  it('renders Monthly plan option', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('$9.99/mo')).toBeTruthy();
  });

  it('renders Yearly plan option', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Yearly')).toBeTruthy();
    expect(getByText('$5.99/mo')).toBeTruthy();
  });

  it('renders SAVE 40% badge on yearly plan', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('SAVE 40%')).toBeTruthy();
  });

  it('renders the CTA button with trial text', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Start Free 7-Day Trial →')).toBeTruthy();
  });

  it('shows "No charge today" note', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/No charge today/)).toBeTruthy();
  });

  it('shows billing disclaimer', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Billed via Stripe/)).toBeTruthy();
  });
});

// ─── Plan selection ───────────────────────────────────────────────────────────
describe('PaywallScreen — plan selection', () => {
  it('starts with yearly plan selected by default', () => {
    const { getByText } = render(<PaywallScreen />);
    // Billed yearly text is only visible when yearly is selected
    expect(getByText('Billed $71.88/yr')).toBeTruthy();
  });

  it('switches to monthly plan when Monthly is pressed', async () => {
    mockCreateCheckoutSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Monthly'));
    await act(async () => { fireEvent.press(getByText('Start Free 7-Day Trial →')); });
    // Monthly price ID should be used
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith('price_1TY8noPwwT0D6amwKPNvzhTO');
  });

  it('uses yearly price ID when Yearly is selected (default)', async () => {
    mockCreateCheckoutSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Free 7-Day Trial →')); });
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith('price_1TY8npPwwT0D6amwuwTPZRm4');
  });
});

// ─── Checkout flow ────────────────────────────────────────────────────────────
describe('PaywallScreen — checkout', () => {
  it('opens WebBrowser with checkout URL', async () => {
    const WebBrowser = require('expo-web-browser');
    mockCreateCheckoutSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test_session' });

    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Free 7-Day Trial →')); });

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/test_session',
      expect.any(Object),
    );
  });

  it('shows checkout error alert on failure', async () => {
    const Alert = require('react-native').Alert;
    mockCreateCheckoutSession.mockRejectedValueOnce(new Error('Stripe error'));

    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Free 7-Day Trial →')); });

    expect(Alert.alert).toHaveBeenCalledWith('Checkout error', 'Stripe error');
  });
});

// ─── Close button ─────────────────────────────────────────────────────────────
describe('PaywallScreen — close', () => {
  it('navigates back when close button is pressed', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('✕'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

// ─── Rotating reviews ─────────────────────────────────────────────────────────
describe('PaywallScreen — social proof', () => {
  it('renders a testimonial quote', () => {
    const { getByText } = render(<PaywallScreen />);
    // At least one of the three reviews should be visible
    expect(
      getByText(/non-compete|HOA fees|lawyer friend/),
    ).toBeTruthy();
  });

  it('renders review author attribution', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(
      getByText(/Software Engineer|Homebuyer|Consultant/),
    ).toBeTruthy();
  });
});
