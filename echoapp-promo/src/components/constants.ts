// Video Configuration - Premium Apple-style
export const FPS = 60; // Higher FPS for smoother animations
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Colors - Refined Apple-inspired palette
export const COLORS = {
  // Pure backgrounds
  black: '#000000',
  darkGray: '#0a0a0a',
  dark: '#000000',

  // Premium gradients
  blue: '#0071E3',
  purple: '#BF5AF2',
  pink: '#FF375F',
  orange: '#FF9F0A',
  green: '#30D158',
  teal: '#64D2FF',

  // Text colors
  white: '#FFFFFF',
  gray100: '#F5F5F7',
  gray200: '#D2D2D7',
  gray300: '#86868B',
  gray400: '#6E6E73',
  gray500: '#424245',
  gray: '#86868B',

  // Accent
  accent: '#0A84FF',

  // Legacy (for compatibility)
  primaryStart: '#0071E3',
  primaryEnd: '#BF5AF2',
  accentAlt: '#FF375F',
  darkAlt: '#0a0a0a',
  voiceFormal: '#0071E3',
  voiceBold: '#FF375F',
  voiceEmpathetic: '#64D2FF',
  voiceComplex: '#BF5AF2',
  voiceBrevity: '#FF9F0A',
  linkedin: '#0A66C2',
};

// Typography - SF Pro style
export const FONTS = {
  display: 'Inter',
  text: 'Inter',
  heading: 'Inter',
  body: 'Inter',
};

// Premium spring configs for Apple-style motion
export const SPRING = {
  smooth: { damping: 28, stiffness: 120, mass: 1 },
  gentle: { damping: 35, stiffness: 100, mass: 1.2 },
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  bouncy: { damping: 12, stiffness: 180, mass: 1 },
};

// Legacy spring configs
export const SPRING_SMOOTH = { damping: 28, stiffness: 120 };
export const SPRING_SNAPPY = { damping: 20, stiffness: 300 };
export const SPRING_BOUNCY = { damping: 12, stiffness: 180 };
