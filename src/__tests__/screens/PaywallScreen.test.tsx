/**
 * Component tests — PaywallScreen
 * Tests subscription UI: plan rendering, selection, CTA text,
 * checkout initiation, and pay-as-you-go tab.
 */

import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import PaywallScreen from '../../screens/PaywallScreen';
import { useStore } from '../../services/store';

const mockGoBack              = jest.fn();
const mockCreateCheckout      = jest.fn();
const mockCreateOneTimeCheckout = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

jest.mock('../../services/api', () => ({
  createCheckoutSession:  (...a: any[]) => mockCreateCheckout(...a),
  createOneTimeCheckout:  (...a: any[]) => mockCreateOneTimeCheckout(...a),
}));

// Capture native alert() calls
const mockAlert = jest.fn();
global.alert = mockAlert;

let mockOpenURL: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(getByText(/Stop signing contracts/)).toBeTruthy();
  });

  it('renders Subscribe and Pay As You Go tabs', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Subscribe')).toBeTruthy();
    expect(getByText('Pay As You Go')).toBeTruthy();
  });

  it('renders all Pro feature list items', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Unlimited contract analyses/)).toBeTruthy();
    expect(getByText(/Full clause risk breakdowns/)).toBeTruthy();
    expect(getByText(/Market benchmarking/)).toBeTruthy();
    expect(getByText(/negotiation scripts/)).toBeTruthy();
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

  it('renders billing disclaimer', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Billed via Stripe/)).toBeTruthy();
  });

  it('renders Free Tier comparison section', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Free Tier/)).toBeTruthy();
    expect(getByText(/3 free analyses/)).toBeTruthy();
  });

  it('renders close button', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('✕')).toBeTruthy();
  });
});

// ─── Plan selection ───────────────────────────────────────────────────────────
describe('PaywallScreen — plan selection', () => {
  it('shows "Start Pro Yearly" CTA by default (yearly pre-selected)', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Start Pro Yearly')).toBeTruthy();
  });

  it('shows yearly billing detail text', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/billed \$71\.88\/yr/)).toBeTruthy();
  });

  it('switches CTA to "Start Pro Monthly" when Monthly is pressed', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Monthly'));
    expect(getByText('Start Pro Monthly')).toBeTruthy();
  });
});

// ─── Checkout flow ────────────────────────────────────────────────────────────
describe('PaywallScreen — checkout (Subscribe tab)', () => {
  it('calls createCheckoutSession with yearly price ID by default', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro Yearly')); });
    expect(mockCreateCheckout).toHaveBeenCalledWith('price_1TY8npPwwT0D6amwuwTPZRm4');
  });

  it('calls createCheckoutSession with monthly price ID when Monthly selected', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Monthly'));
    await act(async () => { fireEvent.press(getByText('Start Pro Monthly')); });
    expect(mockCreateCheckout).toHaveBeenCalledWith('price_1TY8noPwwT0D6amwKPNvzhTO');
  });

  it('opens checkout URL via Linking after session created', async () => {
    mockCreateCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test_session' });
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro Yearly')); });
    expect(mockOpenURL).toHaveBeenCalledWith('https://checkout.stripe.com/test_session');
  });

  it('shows alert on checkout failure', async () => {
    mockCreateCheckout.mockRejectedValueOnce(new Error('Stripe error'));
    const { getByText } = render(<PaywallScreen />);
    await act(async () => { fireEvent.press(getByText('Start Pro Yearly')); });
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('Could not open checkout'),
    );
  });
});

// ─── Pay As You Go tab ────────────────────────────────────────────────────────
describe('PaywallScreen — Pay As You Go tab', () => {
  it('shows PAYG content after switching tabs', () => {
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    expect(getByText('Single Analysis')).toBeTruthy();
    expect(getByText('10-Pack')).toBeTruthy();
    expect(getByText('$2.99')).toBeTruthy();
    expect(getByText('$14.99')).toBeTruthy();
  });

  it('calls createOneTimeCheckout with single-analysis price on Buy', async () => {
    mockCreateOneTimeCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/single' });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[0]); });
    expect(mockCreateOneTimeCheckout).toHaveBeenCalledWith('prod_UY0wLBuE0jEPPa');
  });

  it('calls createOneTimeCheckout with 10-pack price on second Buy', async () => {
    mockCreateOneTimeCheckout.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/pack' });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[1]); });
    expect(mockCreateOneTimeCheckout).toHaveBeenCalledWith('prod_UY0xUfXcea1cti');
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
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('✕'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
