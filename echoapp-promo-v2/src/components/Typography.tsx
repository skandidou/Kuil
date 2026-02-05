import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SPRING, COLORS, STAGGER } from '../constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// =============================================================================
// APPLE-STYLE HEADLINE
// =============================================================================

type HeadlineProps = {
  children: React.ReactNode;
  delay?: number;
  size?: 'hero' | 'large' | 'medium' | 'small';
  gradient?: boolean;
  gradientColors?: string[];
  center?: boolean;
};

export const Headline: React.FC<HeadlineProps> = ({
  children,
  delay = 0,
  size = 'large',
  gradient = false,
  gradientColors = [COLORS.white, COLORS.blue, COLORS.purple],
  center = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.smooth,
  });

  const y = interpolate(progress, [0, 1], [60, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const blur = interpolate(progress, [0, 1], [8, 0]);

  const sizes = {
    hero: { fontSize: 72, fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.0 },
    large: { fontSize: 56, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.05 },
    medium: { fontSize: 44, fontWeight: 600, letterSpacing: '-1.5px', lineHeight: 1.1 },
    small: { fontSize: 36, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.15 },
  };

  const style = sizes[size];

  return (
    <h1
      style={{
        fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        color: gradient ? 'transparent' : COLORS.white,
        background: gradient
          ? `linear-gradient(135deg, ${gradientColors.join(', ')})`
          : 'none',
        WebkitBackgroundClip: gradient ? 'text' : 'unset',
        backgroundClip: gradient ? 'text' : 'unset',
        margin: 0,
        transform: `translateY(${y}px)`,
        opacity,
        filter: `blur(${blur}px)`,
        textAlign: center ? 'center' : 'left',
      }}
    >
      {children}
    </h1>
  );
};

// =============================================================================
// SUBHEAD TEXT
// =============================================================================

type SubheadProps = {
  children: React.ReactNode;
  delay?: number;
  maxWidth?: number;
  center?: boolean;
};

export const Subhead: React.FC<SubheadProps> = ({
  children,
  delay = 0,
  maxWidth = 600,
  center = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.smooth,
  });

  const y = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <p
      style={{
        fontFamily,
        fontSize: 24,
        fontWeight: 400,
        letterSpacing: '0',
        lineHeight: 1.5,
        color: COLORS.gray300,
        margin: 0,
        transform: `translateY(${y}px)`,
        opacity,
        textAlign: center ? 'center' : 'left',
        maxWidth,
      }}
    >
      {children}
    </p>
  );
};

// =============================================================================
// LABEL (CATEGORY TAG)
// =============================================================================

type LabelProps = {
  children: React.ReactNode;
  delay?: number;
  color?: string;
};

export const Label: React.FC<LabelProps> = ({
  children,
  delay = 0,
  color = COLORS.blue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.snappy,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <span
      style={{
        fontFamily,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color,
        transform: `scale(${scale})`,
        opacity,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
};

// =============================================================================
// WORD BY WORD REVEAL
// =============================================================================

type WordByWordProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  gradient?: boolean;
  gradientColors?: string[];
  staggerDelay?: number;
  center?: boolean;
};

export const WordByWord: React.FC<WordByWordProps> = ({
  text,
  delay = 0,
  fontSize = 56,
  fontWeight = 700,
  color = COLORS.white,
  gradient = false,
  gradientColors = [COLORS.white, COLORS.blue],
  staggerDelay = STAGGER.normal,
  center = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: center ? 'center' : 'flex-start',
        gap: '0 18px',
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delay + i * staggerDelay;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: SPRING.smooth,
        });

        const y = interpolate(progress, [0, 1], [50, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const blur = interpolate(progress, [0, 1], [6, 0]);

        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontSize,
              fontWeight,
              color: gradient ? 'transparent' : color,
              background: gradient
                ? `linear-gradient(135deg, ${gradientColors.join(', ')})`
                : 'none',
              WebkitBackgroundClip: gradient ? 'text' : 'unset',
              backgroundClip: gradient ? 'text' : 'unset',
              letterSpacing: '-2px',
              transform: `translateY(${y}px)`,
              opacity,
              filter: `blur(${blur}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// =============================================================================
// GRADIENT TEXT WRAPPER
// =============================================================================

type GradientTextProps = {
  children: React.ReactNode;
  colors?: string[];
};

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  colors = [COLORS.blue, COLORS.purple, COLORS.pink],
}) => {
  return (
    <span
      style={{
        background: `linear-gradient(135deg, ${colors.join(', ')})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
};

// Re-export fontFamily for use in scenes
export { fontFamily };
