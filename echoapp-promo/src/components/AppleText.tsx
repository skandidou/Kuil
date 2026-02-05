import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from './constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

type AppleHeadlineProps = {
  children: React.ReactNode;
  delay?: number;
  size?: 'large' | 'medium' | 'small';
  gradient?: boolean;
  center?: boolean;
};

export const AppleHeadline: React.FC<AppleHeadlineProps> = ({
  children,
  delay = 0,
  size = 'large',
  gradient = false,
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

  const sizes = {
    large: { fontSize: 96, fontWeight: 700, letterSpacing: '-3px', lineHeight: 1.05 },
    medium: { fontSize: 64, fontWeight: 600, letterSpacing: '-2px', lineHeight: 1.1 },
    small: { fontSize: 48, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.15 },
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
          ? `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.blue} 50%, ${COLORS.purple} 100%)`
          : 'none',
        WebkitBackgroundClip: gradient ? 'text' : 'unset',
        backgroundClip: gradient ? 'text' : 'unset',
        margin: 0,
        transform: `translateY(${y}px)`,
        opacity,
        textAlign: center ? 'center' : 'left',
        maxWidth: 1200,
      }}
    >
      {children}
    </h1>
  );
};

type AppleSubheadProps = {
  children: React.ReactNode;
  delay?: number;
  maxWidth?: number;
  center?: boolean;
};

export const AppleSubhead: React.FC<AppleSubheadProps> = ({
  children,
  delay = 0,
  maxWidth = 700,
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
        fontSize: 28,
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

type AppleLabelProps = {
  children: React.ReactNode;
  delay?: number;
  color?: string;
};

export const AppleLabel: React.FC<AppleLabelProps> = ({
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
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: '1.5px',
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

type WordByWordProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  staggerDelay?: number;
};

export const WordByWord: React.FC<WordByWordProps> = ({
  text,
  delay = 0,
  fontSize = 72,
  fontWeight = 700,
  color = COLORS.white,
  staggerDelay = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 20px',
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
        const blur = interpolate(progress, [0, 1], [8, 0]);

        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontSize,
              fontWeight,
              color,
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
