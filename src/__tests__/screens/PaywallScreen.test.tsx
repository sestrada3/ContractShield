/**
 * Component tests — PaywallScreen
 * Tests subscription UI: plan rendering, selection, CTA text,
 * checkout initiation, and pay-as-you-go tab.
 */

import React from 'react';
import { Linking, Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import PaywallScreen from '../../screens/PaywallScreen';
import { useStore } from '../../services/store';

const mockGoBack              = jest.fn();
const mockNavigate            = jest.fn();
const mockCreateCheckout      = jest.fn();
const mockCreateOneTimeCheckout = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('../../services/api', () => ({
  createCheckoutSession:  (...a: any[]) => mockCreateCheckout(...a),
  createOneTimeCheckout:  (...a: any[]) => mockCreateOneTimeCheckout(...a),
}));

let mockAlert: jest.SpyInstance;
let mockOpenURL: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockAlert  = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  useStore.setState({
    user: { id: 'u1', email: 'test@test.com' } as any,
    isPro: false,
    freeUsed: 3,
    freeLimit: 3,
  } as any);
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('PaywallScreen — rendering', () => {
  it('renders "ContractShield Pro" title', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('ContractShield Pro')).toBeTruthy();
  });

  it('renders hero subtitle', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Know exactly what you're signing/)).toBeTruthy();
  });

  it('renders Subscribe and Pay As You Go tabs', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Subscribe')).toBeTruthy();
    expect(getByText('Pay As You Go')).toBeTruthy();
  });

  it('renders all Pro feature list items', () => {
    const { getByText, getAllByText } = render(<PaywallScreen />);
    expect(getByText(/Unlimited contract analyses/)).toBeTruthy();
    expect(getByText(/Full clause risk breakdowns/)).toBeTruthy();
    expect(getByText(/Market benchmarking/)).toBeTruthy();
    expect(getAllByText(/negotiation scripts/)[0]).toBeTruthy();
    expect(getByText(/Key date/)).toBeTruthy();
    expect(getByText(/Full analysis history/)).toBeTruthy();
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

  it('renders BEST VALUE badge on yearly plan', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('BEST VALUE')).toBeTruthy();
  });

  it('renders yearly billing detail text', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/billed \$71\.88\/yr/)).toBeTruthy();
  });

  it('renders savings anchor text', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Save \$47\.88 vs monthly/)).toBeTruthy();
  });

  it('renders Free Tier comparison section', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Free Tier/)).toBeTruthy();
    expect(getByText(/3 free analyses/)).toBeTruthy();
  });

  it('renders testimonial section', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/What our users say/i)).toBeTruthy();
  });
});

// ─── Plan selection ───────────────────────────────────────────────────────────
describe('PaywallScreen — plan selection', () => {
  it('shows yearly CTA by default (yearly pre-selected)', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Start Pro — $5.99/mo')).toBeTruthy();
  });

  it('switches CTA to monthly price when Monthly is pressed', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Monthly'));
    expect(getByText('Start Pro — $9.99/mo')).toBeTruthy();
  });
});

// ─── Checkout flow ────────────────────────────────────────────────────────────
describe('PaywallScreen — checkout (Subscribe tab)', () => {
  it('calls createCheckoutSession with yearly price ID by default', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro — $5.99/mo')); });
    expect(mockCreateCheckout).toHaveBeenCalledWith('price_1TY8npPwwT0D6amwuwTPZRm4');
  });

  it('calls createCheckoutSession with monthly price ID when Monthly selected', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Monthly'));
    await act(async () => { fireEvent.press(getByText('Start Pro — $9.99/mo')); });
    expect(mockCreateCheckout).toHaveBeenCalledWith('price_1TY8noPwwT0D6amwKPNvzhTO');
  });

  it('opens checkout URL via Linking after session created', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test_session' });
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro — $5.99/mo')); });
    expect(mockOpenURL).toHaveBeenCalledWith('https://checkout.stripe.com/test_session');
  });

  it('shows alert on checkout failure', async () => {
    mockCreateCheckout.mockRejectedValueOnce(new Error('Stripe error'));
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro — $5.99/mo')); });
    expect(mockAlert).toHaveBeenCalledWith(
      'Checkout Error',
      expect.any(String),
    );
  });
});

// ─── Pay As You Go tab ────────────────────────────────────────────────────────
describe('PaywallScreen — Pay As You Go tab', () => {
  it('shows PAYG content after switching tabs', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    expect(getByText('Single Analysis')).toBeTruthy();
    expect(getByText('10-Pack')).toBeTruthy();
    expect(getByText('$2.99')).toBeTruthy();
    expect(getByText('$14.99')).toBeTruthy();
  });

  it('calls createOneTimeCheckout with a price_ ID (not prod_) for single analysis', async () => {
    mockCreateOneTimeCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/single' });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[0]); });
    // Must send a price_ ID, not a prod_ ID
    const calledWith = mockCreateOneTimeCheckout.mock.calls[0][0] as string;
    expect(calledWith).toMatch(/^price_/);
  });

  it('calls createOneTimeCheckout with a price_ ID (not prod_) for 10-pack', async () => {
    mockCreateOneTimeCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/pack' });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[1]); });
    const calledWith = mockCreateOneTimeCheckout.mock.calls[0][0] as string;
    expect(calledWith).toMatch(/^price_/);
  });

  it('renders upgrade nudge nudging back to Subscribe', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    expect(getByText(/Pro saves you money/)).toBeTruthy();
  });
});

// ─── Close button ─────────────────────────────────────────────────────────────
describe('PaywallScreen — close', () => {
  it('navigates back when close button is pressed', () => {
    // Close button renders an Ionicons icon inside TouchableOpacity
    const { UNSAFE_getAllByType } = render(<PaywallScreen />);
    const { TouchableOpacity } = require('react-native');
    // The first TouchableOpacity on the screen is the close button
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
