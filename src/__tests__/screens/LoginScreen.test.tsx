/**
 * Component tests — LoginScreen
 * Tests rendering and user interactions for all three modes:
 * sign-in, sign-up, and password reset.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';

// ─── Service mocks ────────────────────────────────────────────────────────────
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockResetPassword = jest.fn();
const mockSetAuthToken = jest.fn();
const mockSetUser = jest.fn();

jest.mock('../../services/auth', () => ({
  signInWithEmail: (...args: any[]) => mockSignIn(...args),
  signUpWithEmail: (...args: any[]) => mockSignUp(...args),
  resetPassword:   (...args: any[]) => mockResetPassword(...args),
}));

jest.mock('../../services/api', () => ({
  setAuthToken: (...args: any[]) => mockSetAuthToken(...args),
}));

jest.mock('../../services/store', () => ({
  useStore: () => ({ setUser: mockSetUser }),
}));

// Suppress Alert calls in tests
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('LoginScreen — rendering', () => {
  it('renders the ContractShield app title', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('ContractShield')).toBeTruthy();
  });

  it('renders "Sign In" card title by default', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders email input with correct placeholder', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
  });

  it('renders password input in sign-in mode', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders "Sign In →" submit button text', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign In →')).toBeTruthy();
  });

  it('renders "Forgot password?" link in sign-in mode', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Forgot password?')).toBeTruthy();
  });

  it('renders "Don\'t have an account? Sign up" toggle', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/Don't have an account/)).toBeTruthy();
  });
});

// ─── Mode toggle ──────────────────────────────────────────────────────────────
describe('LoginScreen — mode toggling', () => {
  it('switches to sign-up mode when toggle is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText(/Don't have an account/));
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Create Account →')).toBeTruthy();
  });

  it('shows minimum 6 characters hint in sign-up mode', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText(/Don't have an account/));
    expect(getByText('Minimum 6 characters')).toBeTruthy();
  });

  it('switches to reset mode when Forgot password? is pressed', () => {
    const { getByText, queryByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot password?'));
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByText('Send Reset Link →')).toBeTruthy();
    // Password input should not be present in reset mode
    expect(queryByPlaceholderText('Password')).toBeNull();
  });

  it('shows back-to-sign-in link in reset mode', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot password?'));
    expect(getByText('← Back to sign in')).toBeTruthy();
  });

  it('returns to sign-in mode from reset mode', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot password?'));
    fireEvent.press(getByText('← Back to sign in'));
    expect(getByText('Sign In')).toBeTruthy();
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────
describe('LoginScreen — validation', () => {
  it('shows alert when submitting with empty email', async () => {
    const Alert = require('react-native').Alert;
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In →'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Enter your email');
    });
  });

  it('shows alert when submitting sign-in with empty password', async () => {
    const Alert = require('react-native').Alert;
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.press(getByText('Sign In →'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Enter your password');
    });
  });

  it('shows alert for password too short during sign-up', async () => {
    const Alert = require('react-native').Alert;
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText(/Don't have an account/));
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.press(getByText('Create Account →'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Password too short', expect.any(String));
    });
  });
});

// ─── Sign-in submission ───────────────────────────────────────────────────────
describe('LoginScreen — sign-in submission', () => {
  it('calls signInWithEmail with trimmed credentials', async () => {
    const session = { user: { id: 'u1', email: 'user@test.com' }, access_token: 'tok123' };
    mockSignIn.mockResolvedValueOnce({ session });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), '  user@test.com  ');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    await act(async () => { fireEvent.press(getByText('Sign In →')); });

    expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
    expect(mockSetUser).toHaveBeenCalledWith(session.user);
    expect(mockSetAuthToken).toHaveBeenCalledWith('tok123');
  });

  it('shows confirmation alert when session is null (email not confirmed)', async () => {
    const Alert = require('react-native').Alert;
    mockSignIn.mockResolvedValueOnce({ session: null });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    await act(async () => { fireEvent.press(getByText('Sign In →')); });

    expect(Alert.alert).toHaveBeenCalledWith('Check your email', expect.any(String), expect.any(Array));
  });

  it('shows error alert on sign-in failure', async () => {
    const Alert = require('react-native').Alert;
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    await act(async () => { fireEvent.press(getByText('Sign In →')); });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
  });
});

// ─── Password reset submission ────────────────────────────────────────────────
describe('LoginScreen — password reset', () => {
  it('calls resetPassword with email and shows success alert', async () => {
    const Alert = require('react-native').Alert;
    mockResetPassword.mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot password?'));
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@test.com');
    await act(async () => { fireEvent.press(getByText('Send Reset Link →')); });

    expect(mockResetPassword).toHaveBeenCalledWith('user@test.com');
    expect(Alert.alert).toHaveBeenCalledWith('Check your email', expect.any(String));
  });
});
