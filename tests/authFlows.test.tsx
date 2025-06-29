import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/app/screens/Auth/Login';
import SignUpScreen from '@/app/screens/Auth/SignUp';
import VerifyEmailScreen from '@/app/screens/Auth/VerifyEmail';

// Mock Supabase
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } }
}));
const mockGetSession = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      getUser: mockGetUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: jest.fn(),
    },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  Link: ({ children, href, ...props }: any) => children,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Auth Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  describe('LoginScreen', () => {
    it('should render login form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should show error for empty fields', async () => {
      const { getByText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should call signIn and navigate on successful login', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSignIn.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should show error message on failed login', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSignIn.mockResolvedValue({ data: { user: null }, error: mockError });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy();
      });
    });
  });

  describe('SignUpScreen', () => {
    it('should render signup form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <SignUpScreen />
        </TestWrapper>
      );

      expect(getByText('Create Account')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Create a password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('should validate password match', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignUpScreen />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Create a password');
      const confirmPasswordInput = getByPlaceholderText('Confirm your password');
      const signUpButton = getByText('Create Account');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'differentpassword');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('should call signUp and navigate to verify screen on successful signup', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignUpScreen />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Create a password');
      const confirmPasswordInput = getByPlaceholderText('Confirm your password');
      const signUpButton = getByText('Create Account');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(router.push).toHaveBeenCalledWith('/screens/Auth/VerifyEmail');
      });
    });
  });

  describe('VerifyEmailScreen', () => {
    it('should render verify email screen correctly', () => {
      const { getByText } = render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      );

      expect(getByText('Check Your Email')).toBeTruthy();
      expect(getByText('Check Verification Status')).toBeTruthy();
      expect(getByText('Back to Login')).toBeTruthy();
    });

    it('should check verification status when button pressed', async () => {
      const mockUser = { id: '123', email: 'test@example.com', email_confirmed_at: null };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { getByText } = render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      );

      const checkButton = getByText('Check Verification Status');
      fireEvent.press(checkButton);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
        expect(getByText('Email not yet verified')).toBeTruthy();
      });
    });

    it('should navigate to home when email is verified', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com', 
        email_confirmed_at: '2023-01-01T00:00:00Z' 
      };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { getByText } = render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      );

      const checkButton = getByText('Check Verification Status');
      fireEvent.press(checkButton);

      await waitFor(() => {
        expect(getByText('Email verified successfully!')).toBeTruthy();
      });

      // Wait for navigation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1600));
      });

      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('should navigate back to login when back button pressed', () => {
      const { getByText } = render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      );

      const backButton = getByText('Back to Login');
      fireEvent.press(backButton);

      expect(router.push).toHaveBeenCalledWith('/screens/Auth/Login');
    });
  });

  describe('useAuth hook', () => {
    it('should provide auth context correctly', () => {
      let authContext: any;

      const TestComponent = () => {
        authContext = useAuth();
        return null;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(authContext).toBeDefined();
      expect(typeof authContext.signIn).toBe('function');
      expect(typeof authContext.signUp).toBe('function');
      expect(typeof authContext.signOut).toBe('function');
      expect(typeof authContext.refreshUser).toBe('function');
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useAuth();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );
    });
  });
});