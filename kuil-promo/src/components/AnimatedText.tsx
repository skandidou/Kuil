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
  weights: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

// Glitch text effect
type GlitchTextProps = {
  text: string;
  fontSize?: number;
  delay?: number;
  color?: string;
  glitchIntensity?: number;
};

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  fontSize = 80,
  delay = 0,
  color = COLORS.white,
  glitchIntensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  // Entry animation
  const entryProgress = spring({
    frame: localFrame,
    fps,
    config: SPRING.snappy,
  });

  // Glitch effect - random offsets
  const glitchActive = localFrame > 5 && localFrame < 25;
  const glitchPhase = Math.sin(localFrame * 2);

  const redOffset = glitchActive ? Math.sin(localFrame * 3) * 4 * glitchIntensity : 0;
  const blueOffset = glitchActive ? Math.cos(localFrame * 2.5) * 4 * glitchIntensity : 0;
  const glitchOpacity = glitchActive ? 0.6 + Math.random() * 0.4 : 0;

  const scale = interpolate(entryProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);
  const y = interpolate(entryProgress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: 'relative',
        fontFamily,
        fontSize,
        fontWeight: 800,
        letterSpacing: '-2px',
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
      }}
    >
      {/* Red channel offset */}
      <span
        style={{
          position: 'absolute',
          left: redOffset,
          top: 0,
          color: '#FF0050',
          opacity: glitchOpacity,
          mixBlendMode: 'screen',
        }}
      >
        {text}
      </span>
      {/* Blue channel offset */}
      <span
        style={{
          position: 'absolute',
          left: blueOffset,
          top: 0,
          color: '#00D4FF',
          opacity: glitchOpacity,
          mixBlendMode: 'screen',
        }}
      >
        {text}
      </span>
      {/* Main text */}
      <span style={{ color, position: 'relative' }}>
        {text}
      </span>
    </div>
  );
};

// Split reveal text - letters animate in one by one
type SplitRevealTextProps = {
  text: string;
  fontSize?: number;
  delay?: number;
  stagger?: number;
  color?: string;
  gradient?: boolean;
};

export const SplitRevealText: React.FC<SplitRevealTextProps> = ({
  text,
  fontSize = 72,
  delay = 0,
  stagger = 2,
  color = COLORS.white,
  gradient = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const letters = text.split('');

  return (
    <div
      style={{
        display: 'flex',
        fontFamily,
        fontSize,
        fontWeight: 700,
        letterSpacing: '-1px',
      }}
    >
      {letters.map((letter, i) => {
        const letterDelay = delay + i * stagger;
        const progress = spring({
          frame: frame - letterDelay,
          fps,
          config: SPRING.pop,
        });

        const y = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const rotate = interpolate(progress, [0, 1], [15, 0]);

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${y}px) rotate(${rotate}deg)`,
              opacity,
              color: gradient ? 'transparent' : color,
              background: gradient
                ? `linear-gradient(135deg, ${COLORS.neonBlue}, ${COLORS.neonPurple}, ${COLORS.neonPink})`
                : 'none',
              WebkitBackgroundClip: gradient ? 'text' : 'none',
              backgroundClip: gradient ? 'text' : 'none',
              minWidth: letter === ' ' ? '0.3em' : 'auto',
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

// Typewriter with cursor
type TypewriterTextProps = {
  text: string;
  fontSize?: number;
  delay?: number;
  speed?: number;
  color?: string;
  cursorColor?: string;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  fontSize = 24,
  delay = 0,
  speed = 3,
  color = COLORS.gray300,
  cursorColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const charIndex = Math.min(Math.floor(localFrame / speed), text.length);
  const displayText = text.slice(0, charIndex);
  const isTyping = charIndex < text.length;

  // Cursor blink
  const cursorVisible = isTyping || Math.floor(frame / 20) % 2 === 0;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight: 400,
        color,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span>{displayText}</span>
      <span
        style={{
          width: 2,
          height: fontSize * 0.8,
          backgroundColor: cursorColor,
          marginLeft: 2,
          opacity: cursorVisible ? 1 : 0,
        }}
      />
    </div>
  );
};

// Counter animation
type AnimatedCounterProps = {
  from: number;
  to: number;
  delay?: number;
  duration?: number;
  fontSize?: number;
  suffix?: string;
  color?: string;
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  delay = 0,
  duration = 60,
  fontSize = 64,
  suffix = '',
  color = COLORS.white,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 40, stiffness: 100, mass: 1 },
    durationInFrames: duration,
  });

  const value = Math.round(interpolate(progress, [0, 1], [from, to]));

  return (
    <span
      style={{
        fontFamily,
        fontSize,
        fontWeight: 800,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value.toLocaleString()}{suffix}
    </span>
  );
};

// Gradient headline
type GradientHeadlineProps = {
  children: React.ReactNode;
  fontSize?: number;
  delay?: number;
  gradient?: string;
};

export const GradientHeadline: React.FC<GradientHeadlineProps> = ({
  children,
  fontSize = 80,
  delay = 0,
  gradient = `linear-gradient(135deg, ${COLORS.neonBlue} 0%, ${COLORS.neonPurple} 50%, ${COLORS.neonPink} 100%)`,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.smooth,
  });

  const y = interpolate(progress, [0, 1], [50, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.95, 1]);

  return (
    <h1
      style={{
        fontFamily,
        fontSize,
        fontWeight: 800,
        letterSpacing: '-3px',
        lineHeight: 1.1,
        background: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        margin: 0,
        textAlign: 'center',
      }}
    >
      {children}
    </h1>
  );
};

// Animated label badge
type AnimatedBadgeProps = {
  text: string;
  delay?: number;
  color?: string;
};

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  text,
  delay = 0,
  color = COLORS.primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.bouncy,
  });

  const scale = interpolate(progress, [0, 1], [0, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 100,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}
      >
        {text}
      </span>
    </div>
  );
};
