/**
 * Component tests — PaywallScreen
 * Tests subscription UI: plan rendering, selection, CTA text,
 * purchase initiation via RevenueCat, and pay-as-you-go tab.
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import PaywallScreen from '../../screens/PaywallScreen';
import { useStore } from '../../services/store';

const mockGoBack  = jest.fn();
const mockNavigate = jest.fn();

const mockPurchasePackage      = jest.fn();
const mockPurchaseStoreProduct = jest.fn();
const mockGetOfferings         = jest.fn();
const mockGetProducts          = jest.fn();
const mockSyncPurchase         = jest.fn();
const mockGetUsage             = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    getOfferings:         (...a: any[]) => mockGetOfferings(...a),
    purchasePackage:      (...a: any[]) => mockPurchasePackage(...a),
    getProducts:          (...a: any[]) => mockGetProducts(...a),
    purchaseStoreProduct: (...a: any[]) => mockPurchaseStoreProduct(...a),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
  },
}));

jest.mock('../../services/api', () => ({
  syncPurchase: (...a: any[]) => mockSyncPurchase(...a),
  getUsage:     (...a: any[]) => mockGetUsage(...a),
}));

const mockOfferings = {
  current: {
    monthly: { storeProduct: { priceString: '$9.99', introductoryDiscount: null } },
    annual:  { storeProduct: { priceString: '$71.88', introductoryDiscount: { price: 0 } } },
  },
};

const mockConsumables = [
  { productIdentifier: 'com.contractshield.credits.1',  priceString: '$2.99' },
  { productIdentifier: 'com.contractshield.credits.10', priceString: '$14.99' },
];

let mockAlert: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockGetOfferings.mockResolvedValue(mockOfferings);
  mockGetProducts.mockResolvedValue(mockConsumables);
  mockSyncPurchase.mockResolvedValue(undefined);
  mockGetUsage.mockResolvedValue({ isPro: true, used: 0, limit: 3, credits: 0 });
  useStore.setState({
    user: { id: 'u1', email: 'test@test.com' } as any,
    isPro: false,
    freeUsed: 3,
    freeLimit: 3,
    credits: 0,
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

  it('renders Monthly and Yearly plan options', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('Yearly')).toBeTruthy();
  });

  it('renders BEST VALUE badge on yearly plan', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText('BEST VALUE')).toBeTruthy();
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

  it('renders Apple payment legal text', () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText(/Processed by Apple/i)).toBeTruthy();
  });
});

// ─── Plan selection ───────────────────────────────────────────────────────────
describe('PaywallScreen — plan selection', () => {
  it('shows yearly CTA by default', async () => {
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
  });

  it('switches CTA to monthly when Monthly is pressed', async () => {
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(mockGetOfferings).toHaveBeenCalled());
    fireEvent.press(getByText('Monthly'));
    expect(getByText(/Start Pro — \$9\.99\/mo/)).toBeTruthy();
  });

  it('shows free trial text on yearly plan', async () => {
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/7-day free trial/)).toBeTruthy());
  });
});

// ─── Purchase flow ────────────────────────────────────────────────────────────
describe('PaywallScreen — purchase (Subscribe tab)', () => {
  it('calls Purchases.purchasePackage with the annual package by default', async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: { entitlements: { active: { pro: {} } } },
    });
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
    await act(async () => { fireEvent.press(getByText(/Start Pro — \$71\.88\/yr/)); });
    expect(mockPurchasePackage).toHaveBeenCalledWith(mockOfferings.current.annual);
  });

  it('calls syncPurchase and getUsage after successful purchase', async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: { entitlements: { active: { pro: {} } } },
    });
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
    await act(async () => { fireEvent.press(getByText(/Start Pro — \$71\.88\/yr/)); });
    expect(mockSyncPurchase).toHaveBeenCalled();
    expect(mockGetUsage).toHaveBeenCalled();
  });

  it('navigates back after successful purchase', async () => {
    mockPurchasePackage.mockResolvedValueOnce({
      customerInfo: { entitlements: { active: { pro: {} } } },
    });
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
    await act(async () => { fireEvent.press(getByText(/Start Pro — \$71\.88\/yr/)); });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows alert on purchase failure (non-cancellation)', async () => {
    const err: any = new Error('Something went wrong');
    err.code = 'OTHER_ERROR';
    mockPurchasePackage.mockRejectedValueOnce(err);
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
    await act(async () => { fireEvent.press(getByText(/Start Pro — \$71\.88\/yr/)); });
    expect(mockAlert).toHaveBeenCalledWith('Purchase Error', expect.any(String));
  });

  it('does not show alert when user cancels (PURCHASE_CANCELLED_ERROR)', async () => {
    const err: any = new Error('Cancelled');
    err.code = 'PURCHASE_CANCELLED_ERROR';
    mockPurchasePackage.mockRejectedValueOnce(err);
    const { getByText } = render(<PaywallScreen />);
    await waitFor(() => expect(getByText(/Start Pro — \$71\.88\/yr/)).toBeTruthy());
    await act(async () => { fireEvent.press(getByText(/Start Pro — \$71\.88\/yr/)); });
    expect(mockAlert).not.toHaveBeenCalledWith('Purchase Error', expect.any(String));
  });
});

// ─── Pay As You Go tab ────────────────────────────────────────────────────────
describe('PaywallScreen — Pay As You Go tab', () => {
  it('shows PAYG content after switching tabs', async () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => {
      expect(getByText('Single Analysis')).toBeTruthy();
      expect(getByText('10-Pack')).toBeTruthy();
    });
  });

  it('calls purchaseStoreProduct with credits.1 product for single analysis', async () => {
    mockPurchaseStoreProduct.mockResolvedValueOnce({ customerInfo: { entitlements: { active: {} } } });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(0));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[0]); });
    expect(mockPurchaseStoreProduct).toHaveBeenCalledWith(
      expect.objectContaining({ productIdentifier: 'com.contractshield.credits.1' })
    );
  });

  it('calls purchaseStoreProduct with credits.10 product for 10-pack', async () => {
    mockPurchaseStoreProduct.mockResolvedValueOnce({ customerInfo: { entitlements: { active: {} } } });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(1));
    const buyButtons = getAllByText('Buy');
    await act(async () => { fireEvent.press(buyButtons[1]); });
    expect(mockPurchaseStoreProduct).toHaveBeenCalledWith(
      expect.objectContaining({ productIdentifier: 'com.contractshield.credits.10' })
    );
  });

  it('renders upgrade nudge nudging back to Subscribe', () => {
    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    expect(getByText(/Pro saves you money/)).toBeTruthy();
  });

  it('adds 1 credit optimistically after buying Single Analysis', async () => {
    mockPurchaseStoreProduct.mockResolvedValueOnce({ customerInfo: { entitlements: { active: {} } } });
    mockGetUsage.mockResolvedValueOnce({ isPro: false, used: 3, limit: 3, credits: 0 });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(getAllByText('Buy')[0]); });
    expect(mockGetUsage).toHaveBeenCalled();
    expect(useStore.getState().credits).toBe(1);
  });

  it('adds 10 credits optimistically after buying the 10-Pack', async () => {
    mockPurchaseStoreProduct.mockResolvedValueOnce({ customerInfo: { entitlements: { active: {} } } });
    mockGetUsage.mockResolvedValueOnce({ isPro: false, used: 3, limit: 3, credits: 0 });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(1));
    await act(async () => { fireEvent.press(getAllByText('Buy')[1]); });
    expect(mockGetUsage).toHaveBeenCalled();
    expect(useStore.getState().credits).toBe(10);
  });

  it('navigates back after successful consumable purchase', async () => {
    mockPurchaseStoreProduct.mockResolvedValueOnce({ customerInfo: { entitlements: { active: {} } } });
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(getAllByText('Buy')[0]); });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows alert on consumable purchase failure (non-cancellation)', async () => {
    const err: any = new Error('Billing error');
    err.code = 'BILLING_ERROR';
    mockPurchaseStoreProduct.mockRejectedValueOnce(err);
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(getAllByText('Buy')[0]); });
    expect(mockAlert).toHaveBeenCalledWith('Purchase Error', expect.any(String));
  });

  it('does not show alert when consumable purchase is cancelled', async () => {
    const err: any = new Error('Cancelled');
    err.code = 'PURCHASE_CANCELLED_ERROR';
    mockPurchaseStoreProduct.mockRejectedValueOnce(err);
    const { getByText, getAllByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Pay As You Go'));
    await waitFor(() => expect(getAllByText('Buy').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(getAllByText('Buy')[0]); });
    expect(mockAlert).not.toHaveBeenCalledWith('Purchase Error', expect.any(String));
  });
});

// ─── Close button ─────────────────────────────────────────────────────────────
describe('PaywallScreen — close', () => {
  it('navigates back when close button is pressed', () => {
    const { UNSAFE_getAllByType } = render(<PaywallScreen />);
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
