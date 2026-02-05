import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { COLORS } from './constants';

type BackgroundProps = {
  variant?: 'gradient' | 'dark' | 'light';
};

export const Background: React.FC<BackgroundProps> = ({ variant = 'gradient' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle gradient animation
  const gradientAngle = interpolate(
    frame,
    [0, durationInFrames],
    [135, 180],
    { extrapolateRight: 'clamp' }
  );

  const backgrounds: Record<string, React.CSSProperties> = {
    gradient: {
      background: `linear-gradient(${gradientAngle}deg, ${COLORS.dark} 0%, ${COLORS.darkAlt} 50%, ${COLORS.dark} 100%)`,
    },
    dark: {
      backgroundColor: COLORS.dark,
    },
    light: {
      backgroundColor: COLORS.white,
    },
  };

  return (
    <AbsoluteFill style={backgrounds[variant]}>
      {/* Animated gradient orbs */}
      <AnimatedOrb
        color={COLORS.primaryStart}
        size={600}
        initialX={-100}
        initialY={-100}
        delay={0}
      />
      <AnimatedOrb
        color={COLORS.primaryEnd}
        size={500}
        initialX={1500}
        initialY={700}
        delay={30}
      />
      <AnimatedOrb
        color={COLORS.accent}
        size={400}
        initialX={1000}
        initialY={-200}
        delay={60}
      />
    </AbsoluteFill>
  );
};

type AnimatedOrbProps = {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
};

const AnimatedOrb: React.FC<AnimatedOrbProps> = ({
  color,
  size,
  initialX,
  initialY,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);

  const x = interpolate(
    adjustedFrame,
    [0, durationInFrames],
    [initialX, initialX + 100],
    { extrapolateRight: 'clamp' }
  );

  const y = interpolate(
    adjustedFrame,
    [0, durationInFrames],
    [initialY, initialY + 50],
    { extrapolateRight: 'clamp' }
  );

  const opacity = interpolate(
    adjustedFrame,
    [0, 30],
    [0, 0.15],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        filter: 'blur(80px)',
      }}
    />
  );
};
