// Design System Tokens
// Import these tokens in all components to maintain consistency

export const colors = {
  // Primary palette
  primary: '#4A7C59',
  accent: '#F5C344',
  surface: '#FFFFFF',
  textDefault: '#2C2C2C',
  error: '#D94F4F',
  
  // Extended palette for UI states
  primaryLight: '#6B9B7A',
  primaryDark: '#3A5F46',
  accentLight: '#F7D066',
  accentDark: '#E6B022',
  
  // Neutral colors
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Background variants
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  
  // Border colors
  border: '#E5E7EB',
  borderFocus: '#4A7C59',
  
  // Text variants
  textPrimary: '#2C2C2C',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
} as const;

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Predefined text styles
  heading1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 1.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.5,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Common component dimensions
export const dimensions = {
  touchTarget: 44, // Minimum touch target size for accessibility
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  inputHeight: 48,
  navBarHeight: 80,
} as const;