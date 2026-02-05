import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { COLORS } from '../constants';

// =============================================================================
// ULTRA PREMIUM iPHONE 15 PRO MOCKUP
// Hyper-realistic with dynamic screen content, glows, and smooth animations
// =============================================================================

type PhoneMockupProps = {
  delay?: number;
  scale?: number;
  rotateY?: number;
  rotateX?: number;
  children?: React.ReactNode;
};

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  delay = 0,
  scale = 1,
  rotateY = 0,
  rotateX = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cinematic entrance
  const entranceProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 28, stiffness: 45, mass: 1.2 },
  });

  // Floating animation
  const floatPhase = (frame - delay) * 0.018;
  const floatY = Math.sin(floatPhase) * 12 * Math.min(entranceProgress, 1);
  const floatRotateY = Math.sin(floatPhase * 0.7) * 2 * Math.min(entranceProgress, 1);
  const floatRotateX = Math.cos(floatPhase * 0.5) * 1 * Math.min(entranceProgress, 1);

  // Entrance transforms
  const translateY = interpolate(entranceProgress, [0, 1], [300, 0]);
  const scaleValue = interpolate(entranceProgress, [0, 1], [0.4, scale]);
  const rotateYValue = interpolate(entranceProgress, [0, 1], [rotateY - 35, rotateY]);
  const rotateXValue = interpolate(entranceProgress, [0, 1], [rotateX + 25, rotateX]);
  const opacityValue = interpolate(entranceProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Phone dimensions
  const phoneWidth = 320;
  const phoneHeight = 660;
  const borderRadius = 52;
  const bezelWidth = 4;
  const screenBorderRadius = borderRadius - bezelWidth;

  // Dynamic Island
  const diWidth = 120;
  const diHeight = 36;
  const diTop = 14;

  // Glow pulse
  const glowPulse = 0.6 + Math.sin(frame * 0.03) * 0.15;

  return (
    <div
      style={{
        position: 'relative',
        transform: `
          perspective(1800px)
          translate3d(0, ${translateY + floatY}px, 0)
          rotateY(${rotateYValue + floatRotateY}deg)
          rotateX(${rotateXValue + floatRotateX}deg)
          scale(${scaleValue})
        `,
        opacity: opacityValue,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Ambient glow behind phone */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: phoneWidth * 2,
          height: phoneHeight * 1.2,
          background: `radial-gradient(ellipse, ${COLORS.blue}35 0%, ${COLORS.purple}20 40%, transparent 70%)`,
          filter: 'blur(60px)',
          transform: 'translate(-50%, -50%) translateZ(-150px)',
          opacity: glowPulse * entranceProgress,
        }}
      />

      {/* Floor reflection/shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: '50%',
          width: phoneWidth * 0.8,
          height: 150,
          background: `radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)`,
          filter: 'blur(30px)',
          transform: `translateX(-50%) translateZ(-80px) scaleX(${0.6 + entranceProgress * 0.4})`,
          opacity: entranceProgress * 0.8,
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          width: phoneWidth,
          height: phoneHeight,
          borderRadius,
          background: `
            linear-gradient(
              145deg,
              #5a5a5c 0%,
              #4a4a4c 8%,
              #3a3a3c 20%,
              #2c2c2e 35%,
              #1c1c1e 50%,
              #2c2c2e 65%,
              #3a3a3c 80%,
              #4a4a4c 92%,
              #5a5a5c 100%
            )
          `,
          boxShadow: `
            0 0 0 0.5px rgba(255,255,255,0.2),
            inset 0 0 0 0.5px rgba(255,255,255,0.1),
            0 80px 150px rgba(0,0,0,0.5),
            0 35px 70px rgba(0,0,0,0.4),
            0 15px 30px rgba(0,0,0,0.3),
            0 0 100px ${COLORS.blue}15
          `,
          padding: bezelWidth,
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top edge highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: borderRadius,
            right: borderRadius,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          }}
        />

        {/* Left edge highlight */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: borderRadius,
            bottom: borderRadius,
            width: 1.5,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
          }}
        />

        {/* Screen container */}
        <div
          style={{
            width: phoneWidth - bezelWidth * 2,
            height: phoneHeight - bezelWidth * 2,
            borderRadius: screenBorderRadius,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#000',
          }}
        >
          {/* Screen content - children go here */}
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a12 100%)',
            }}
          >
            {children}
          </div>

          {/* Screen reflection overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                linear-gradient(
                  155deg,
                  rgba(255,255,255,0.12) 0%,
                  rgba(255,255,255,0.05) 15%,
                  rgba(255,255,255,0.02) 30%,
                  transparent 50%
                )
              `,
              pointerEvents: 'none',
            }}
          />

          {/* Subtle vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: bezelWidth + diTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: diWidth,
            height: diHeight,
            backgroundColor: '#000',
            borderRadius: diHeight / 2,
            boxShadow: `
              inset 0 0 0 1px rgba(255,255,255,0.12),
              0 2px 8px rgba(0,0,0,0.5)
            `,
          }}
        >
          {/* Camera lens */}
          <div
            style={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #3a3a4e 0%, #0a0a15 100%)',
              boxShadow: 'inset 0 0 3px rgba(255,255,255,0.2), 0 0 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>

        {/* Side buttons */}
        <div style={{ position: 'absolute', left: -3, top: 110, width: 4, height: 28, backgroundColor: '#3a3a3c', borderRadius: '3px 0 0 3px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', left: -3, top: 155, width: 4, height: 52, backgroundColor: '#3a3a3c', borderRadius: '3px 0 0 3px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', left: -3, top: 220, width: 4, height: 52, backgroundColor: '#3a3a3c', borderRadius: '3px 0 0 3px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', right: -3, top: 175, width: 4, height: 85, backgroundColor: '#3a3a3c', borderRadius: '0 3px 3px 0', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.15)' }} />
      </div>
    </div>
  );
};

// =============================================================================
// TYPING TEXT ANIMATION
// Text that types character by character like on a computer
// =============================================================================

type TypingTextProps = {
  text: string;
  startFrame: number;
  speed?: number; // characters per second
  style?: React.CSSProperties;
  cursorColor?: string;
  showCursor?: boolean;
};

export const TypingText: React.FC<TypingTextProps> = ({
  text,
  startFrame,
  speed = 30,
  style = {},
  cursorColor = COLORS.blue,
  showCursor = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerChar = fps / speed;
  const elapsedFrames = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(Math.floor(elapsedFrames / framesPerChar), text.length);
  const displayText = text.slice(0, charsToShow);
  const isTyping = charsToShow < text.length && frame >= startFrame;
  const cursorBlink = Math.sin(frame * 0.15) > 0;

  return (
    <span style={{ ...style, display: 'inline' }}>
      {displayText}
      {showCursor && (frame >= startFrame) && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            backgroundColor: cursorColor,
            marginLeft: 2,
            opacity: isTyping ? 1 : (cursorBlink ? 1 : 0),
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  );
};

// =============================================================================
// ANIMATED COUNTER
// Number that counts up with easing
// =============================================================================

type AnimatedCounterProps = {
  value: number;
  startFrame: number;
  duration?: number; // in frames
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  startFrame,
  duration = 45,
  prefix = '',
  suffix = '',
  decimals = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  const currentValue = value * progress;
  const displayValue = decimals > 0
    ? currentValue.toFixed(decimals)
    : Math.round(currentValue);

  return (
    <span style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// =============================================================================
// FLOATING PARTICLES
// Ambient particles that float around
// =============================================================================

type ParticlesProps = {
  count?: number;
  color?: string;
  opacity?: number;
};

export const FloatingParticles: React.FC<ParticlesProps> = ({
  count = 20,
  color = COLORS.blue,
  opacity = 0.6,
}) => {
  const frame = useCurrentFrame();

  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p) => {
        const x = (p.x + Math.sin(frame * 0.01 + p.phase) * 5 + frame * p.speedX) % 100;
        const y = (p.y + Math.cos(frame * 0.01 + p.phase) * 5 + frame * p.speedY) % 100;
        const particleOpacity = opacity * (0.3 + Math.sin(frame * 0.05 + p.phase) * 0.3);

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: particleOpacity,
              filter: 'blur(1px)',
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// GLOW ORB
// Animated glowing orb effect
// =============================================================================

type GlowOrbProps = {
  color?: string;
  size?: number;
  x?: string;
  y?: string;
  pulseSpeed?: number;
};

export const GlowOrb: React.FC<GlowOrbProps> = ({
  color = COLORS.blue,
  size = 300,
  x = '50%',
  y = '50%',
  pulseSpeed = 0.02,
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.7 + Math.sin(frame * pulseSpeed) * 0.3;
  const scale = 0.9 + Math.sin(frame * pulseSpeed * 0.7) * 0.1;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40 0%, ${color}20 30%, transparent 70%)`,
        filter: 'blur(40px)',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: pulse,
        pointerEvents: 'none',
      }}
    />
  );
};

// =============================================================================
// PROGRESS BAR ANIMATED
// Smooth animated progress bar
// =============================================================================

type ProgressBarProps = {
  progress: number; // 0-100
  startFrame: number;
  duration?: number;
  color?: string;
  height?: number;
  width?: number | string;
  showGlow?: boolean;
};

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  startFrame,
  duration = 60,
  color = COLORS.green,
  height = 6,
  width = '100%',
  showGlow = true,
}) => {
  const frame = useCurrentFrame();

  const animatedProgress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, progress],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: height / 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${animatedProgress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: height / 2,
          boxShadow: showGlow ? `0 0 20px ${color}60, 0 0 40px ${color}30` : 'none',
          transition: 'none',
        }}
      />
    </div>
  );
};
