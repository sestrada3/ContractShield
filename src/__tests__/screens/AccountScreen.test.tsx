/**
 * Component tests — AccountScreen
 * Tests profile display, subscription badge, history rendering,
 * sign-out, and delete account flows.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AccountScreen from '../../screens/AccountScreen';
import { useStore } from '../../services/store';

const mockGoBack   = jest.fn();
const mockNavigate = jest.fn();
const mockGetPortalUrl  = jest.fn();
const mockGetHistory    = jest.fn();
const mockDeleteAccount = jest.fn();
const mockGetUsage      = jest.fn();
const mockSetAuthToken  = jest.fn();
const mockSignOut       = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation:   () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  // Call the callback in useEffect so state updates happen after mount (not during render)
  useFocusEffect:  (cb: () => void) => { require('react').useEffect(() => { cb(); }, []); },
}));

jest.mock('../../services/api', () => ({
  getPortalUrl:  (...a: any[]) => mockGetPortalUrl(...a),
  getHistory:    (...a: any[]) => mockGetHistory(...a),
  deleteAccount: (...a: any[]) => mockDeleteAccount(...a),
  getUsage:      (...a: any[]) => mockGetUsage(...a),
  setAuthToken:  (...a: any[]) => mockSetAuthToken(...a),
}));

jest.mock('../../services/auth', () => ({
  signOut: (...a: any[]) => mockSignOut(...a),
}));

jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

const MOCK_USER = {
  id: 'user-1',
  email: 'alex@example.com',
  created_at: '2025-01-15T10:00:00Z',
} as any;

const MOCK_HISTORY = [
  { id: 'h1', result: { type: 'Employment Contract', score: 7 }, created_at: '2025-04-01T10:00:00Z' },
  { id: 'h2', result: { type: 'NDA',                 score: 4 }, created_at: '2025-03-15T10:00:00Z' },
];

beforeEach(() => {
  jest.clearAllMocks();
  useStore.setState({
    user: MOCK_USER,
    isPro: false,
    freeUsed: 1,
    freeLimit: 3,
    setUser:  jest.fn(),
    setIsPro: jest.fn(),
    setUsage: jest.fn(),
    setResult: jest.fn(),
  } as any);
  mockGetHistory.mockResolvedValue(MOCK_HISTORY);
  mockGetUsage.mockResolvedValue({ isPro: false, used: 1, limit: 3 });
});

// ─── Profile card ─────────────────────────────────────────────────────────────
describe('AccountScreen — profile card', () => {
  it('shows user email', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('alex@example.com')).toBeTruthy();
  });

  it('shows user initials as avatar', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('AL')).toBeTruthy();
  });

  it('shows member since date', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText(/Member since January 2025/)).toBeTruthy();
  });
});

// ─── Subscription section ─────────────────────────────────────────────────────
describe('AccountScreen — subscription', () => {
  it('shows FREE badge for free users', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('FREE')).toBeTruthy();
  });

  it('shows PRO badge for pro users', async () => {
    useStore.setState({ user: MOCK_USER, isPro: true } as any);
    const { findByText } = render(<AccountScreen />);
    expect(await findByText(/PRO/)).toBeTruthy();
  });

  it('shows analyses remaining count for free users', async () => {
    const { findByText } = render(<AccountScreen />);
    // freeUsed=1, freeLimit=3 → 2 of 3
    expect(await findByText(/2 of 3/)).toBeTruthy();
  });

  it('shows Upgrade to Pro button for free users', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('Upgrade to Pro →')).toBeTruthy();
  });

  it('navigates to Paywall when Upgrade to Pro pressed', async () => {
    const { findByText } = render(<AccountScreen />);
    const btn = await findByText('Upgrade to Pro →');
    await act(async () => { fireEvent.press(btn); });
    expect(mockNavigate).toHaveBeenCalledWith('Paywall');
  });

  it('shows Manage Subscription button for pro users', async () => {
    useStore.setState({ user: MOCK_USER, isPro: true } as any);
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('Manage Subscription →')).toBeTruthy();
  });
});

// ─── History section ──────────────────────────────────────────────────────────
describe('AccountScreen — recent analyses', () => {
  it('fetches history on focus', async () => {
    render(<AccountScreen />);
    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalled();
    });
  });

  it('renders history items with document type', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('Employment Contract')).toBeTruthy();
    expect(await findByText('NDA')).toBeTruthy();
  });

  it('renders score chip for each history item', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('7')).toBeTruthy();
    expect(await findByText('4')).toBeTruthy();
  });

  it('shows empty state message when no history', async () => {
    mockGetHistory.mockResolvedValueOnce([]);
    const { findByText } = render(<AccountScreen />);
    expect(await findByText(/No analyses yet/)).toBeTruthy();
  });
});

// ─── Sign out ─────────────────────────────────────────────────────────────────
describe('AccountScreen — sign out', () => {
  it('calls signOut when Sign Out is pressed', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);
    const { findByText } = render(<AccountScreen />);
    const btn = await findByText('Sign Out');
    await act(async () => { fireEvent.press(btn); });
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSetAuthToken).toHaveBeenCalledWith(null);
  });
});

// ─── Delete account ───────────────────────────────────────────────────────────
describe('AccountScreen — delete account', () => {
  it('shows Delete Account & Data button', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('Delete Account & Data')).toBeTruthy();
  });

  it('triggers Alert confirmation when Delete Account pressed', async () => {
    const Alert = require('react-native').Alert;
    const { findByText } = render(<AccountScreen />);
    const btn = await findByText('Delete Account & Data');
    await act(async () => { fireEvent.press(btn); });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      expect.stringContaining('permanently'),
      expect.any(Array),
    );
  });
});

// ─── Back navigation ──────────────────────────────────────────────────────────
describe('AccountScreen — navigation', () => {
  it('goes back when Back button pressed', async () => {
    const { findByText } = render(<AccountScreen />);
    const btn = await findByText('Back');
    await act(async () => { fireEvent.press(btn); });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders "Account" screen title', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText('Account')).toBeTruthy();
  });
});

// ─── Legal footer ─────────────────────────────────────────────────────────────
describe('AccountScreen — footer', () => {
  it('shows "Not legal advice" disclaimer', async () => {
    const { findByText } = render(<AccountScreen />);
    expect(await findByText(/Not legal advice/)).toBeTruthy();
  });
});
