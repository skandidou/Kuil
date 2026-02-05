// =============================================================================
// ECHOAPP PROMO - PREMIUM VIDEO CONSTANTS
// =============================================================================

// -----------------------------------------------------------------------------
// VIDEO CONFIGURATION
// -----------------------------------------------------------------------------

export const FPS = 60;

// Primary format: 9:16 vertical (Instagram Reels, TikTok, YouTube Shorts)
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Alternative format: 16:9 horizontal
export const WIDTH_HORIZONTAL = 1920;
export const HEIGHT_HORIZONTAL = 1080;

// -----------------------------------------------------------------------------
// SCENE DURATIONS (seconds) - Optimized for TikTok (max 60s, ideal 30-45s)
// Total: ~27 seconds (with transitions)
// -----------------------------------------------------------------------------

export const SCENE_DURATIONS = {
  intro: 2.8,      // Quick impactful intro
  problem: 3,      // State the problem fast
  voice: 4.5,      // Feature showcase
  editor: 4,       // Feature showcase
  calendar: 3.5,   // Feature showcase
  analytics: 3.5,  // Feature showcase
  cta: 4,          // Strong CTA ending
} as const;

export const TRANSITION_DURATION = 0.5;  // Snappier transitions

// Calculate total duration
const scenes = Object.values(SCENE_DURATIONS);
const totalScenes = scenes.reduce((a, b) => a + b, 0);
const transitionOverlap = (scenes.length - 1) * TRANSITION_DURATION;
export const TOTAL_DURATION_SECONDS = totalScenes - transitionOverlap;
export const TOTAL_DURATION_FRAMES = Math.round(TOTAL_DURATION_SECONDS * FPS);

// -----------------------------------------------------------------------------
// COLORS - Apple-inspired Premium Palette
// -----------------------------------------------------------------------------

export const COLORS = {
  // Backgrounds
  black: '#000000',
  dark: '#0A0A0A',

  // Primary brand
  blue: '#0071E3',
  blueLight: '#2997FF',
  purple: '#BF5AF2',
  pink: '#FF375F',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  green: '#30D158',
  teal: '#64D2FF',

  // Text hierarchy
  white: '#FFFFFF',
  gray100: '#F5F5F7',
  gray200: '#D2D2D7',
  gray300: '#86868B',
  gray400: '#6E6E73',
  gray500: '#424245',
  gray600: '#2C2C2E',

  // Voice signature colors
  voiceAnalytical: '#0071E3',
  voiceFormal: '#BF5AF2',
  voiceEmpathetic: '#64D2FF',
  voiceBold: '#FF375F',
  voiceBrevity: '#FF9F0A',

  // Brand
  linkedin: '#0A66C2',
} as const;

// -----------------------------------------------------------------------------
// SPRING CONFIGURATIONS - Premium Motion Language
// -----------------------------------------------------------------------------

export const SPRING = {
  smooth: { damping: 28, stiffness: 120, mass: 1 },
  gentle: { damping: 35, stiffness: 100, mass: 1.2 },
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  bouncy: { damping: 12, stiffness: 180, mass: 1 },
  silk: { damping: 40, stiffness: 80, mass: 1.5 },
  heavy: { damping: 25, stiffness: 60, mass: 2 },
} as const;

// -----------------------------------------------------------------------------
// PHONE MOCKUP DIMENSIONS
// -----------------------------------------------------------------------------

export const PHONE = {
  width: 340,
  height: 720,
  borderRadius: 55,
  bezelWidth: 6,
  dynamicIsland: {
    width: 126,
    height: 36,
    top: 14,
  },
} as const;

// -----------------------------------------------------------------------------
// SPACING SYSTEM (8pt grid)
// -----------------------------------------------------------------------------

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
} as const;

// -----------------------------------------------------------------------------
// SAFE AREAS (for mobile video formats)
// -----------------------------------------------------------------------------

export const SAFE_AREA = {
  top: 80,
  bottom: 140,
  horizontal: 48,
} as const;

// -----------------------------------------------------------------------------
// TIMING HELPERS
// -----------------------------------------------------------------------------

export const toFrames = (seconds: number): number => Math.round(seconds * FPS);

export const STAGGER = {
  tight: 3,
  normal: 5,
  relaxed: 8,
  loose: 12,
} as const;
