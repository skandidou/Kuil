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
// SHINE EFFECT
// Light sweep effect across elements (like Apple logo shine)
// =============================================================================

type ShineProps = {
  delay?: number;
  duration?: number;
  color?: string;
  angle?: number;
  width?: number;
};

export const Shine: React.FC<ShineProps> = ({
  delay = 0,
  duration = 40,
  color = 'rgba(255,255,255,0.4)',
  angle = 25,
  width = 100,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [delay, delay + duration],
    [-50, 150],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-100%',
          left: `${progress}%`,
          width: width,
          height: '300%',
          background: `linear-gradient(
            ${angle}deg,
            transparent 0%,
            ${color} 45%,
            ${color} 55%,
            transparent 100%
          )`,
          transform: `translateX(-50%)`,
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
};

// =============================================================================
// SCAN LINE EFFECT
// Horizontal light sweep across phone screen
// =============================================================================

type ScanLineProps = {
  delay?: number;
  duration?: number;
  color?: string;
  repeat?: boolean;
  repeatInterval?: number;
};

export const ScanLine: React.FC<ScanLineProps> = ({
  delay = 0,
  duration = 60,
  color = COLORS.blue,
  repeat = true,
  repeatInterval = 180,
}) => {
  const frame = useCurrentFrame();

  const effectiveFrame = repeat
    ? Math.max(0, (frame - delay) % repeatInterval)
    : Math.max(0, frame - delay);

  const isActive = repeat
    ? effectiveFrame < duration && frame >= delay
    : frame >= delay && frame < delay + duration;

  const progress = interpolate(
    effectiveFrame,
    [0, duration],
    [-10, 110],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${progress}%`,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${color}80 30%, ${color} 50%, ${color}80 70%, transparent 100%)`,
          boxShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
          filter: 'blur(1px)',
        }}
      />
    </div>
  );
};

// =============================================================================
// CONFETTI EXPLOSION
// Celebration particles that explode from center
// =============================================================================

type ConfettiProps = {
  delay?: number;
  count?: number;
  colors?: string[];
  spread?: number;
  duration?: number;
};

export const Confetti: React.FC<ConfettiProps> = ({
  delay = 0,
  count = 50,
  colors = [COLORS.blue, COLORS.purple, COLORS.pink, COLORS.orange, COLORS.green, COLORS.teal],
  spread = 400,
  duration = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360 + Math.random() * 30,
      distance: spread * (0.4 + Math.random() * 0.6),
      rotationSpeed: (Math.random() - 0.5) * 15,
      size: 8 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      delay: Math.random() * 10,
    }));
  }, [count, spread, colors]);

  const explosionProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 40, mass: 1 },
  });

  const fadeOut = interpolate(
    frame,
    [delay + duration * 0.6, delay + duration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => {
        const particleProgress = Math.max(0, explosionProgress - p.delay / 30);
        const angleRad = (p.angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * p.distance * particleProgress;
        const y = Math.sin(angleRad) * p.distance * particleProgress - 50 + particleProgress * 100;
        const rotation = (frame - delay) * p.rotationSpeed;
        const scale = interpolate(particleProgress, [0, 0.3, 1], [0, 1.2, 0.8]);

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '35%',
              width: p.shape === 'rect' ? p.size : p.size * 0.8,
              height: p.shape === 'rect' ? p.size * 0.6 : p.size * 0.8,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
              opacity: fadeOut * (0.8 + Math.random() * 0.2),
              boxShadow: `0 0 10px ${p.color}60`,
            }}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// NOTIFICATION POPUP
// iOS-style notification that slides in
// =============================================================================

type NotificationProps = {
  delay?: number;
  icon?: string;
  title: string;
  subtitle?: string;
  color?: string;
  position?: 'top' | 'bottom';
  duration?: number;
};

export const NotificationPopup: React.FC<NotificationProps> = ({
  delay = 0,
  icon = '✨',
  title,
  subtitle,
  color = COLORS.blue,
  position = 'top',
  duration = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 120, mass: 0.8 },
  });

  const exitProgress = spring({
    frame: frame - delay - duration + 30,
    fps,
    config: { damping: 30, stiffness: 150, mass: 0.7 },
  });

  const slideY = interpolate(
    enterProgress - exitProgress,
    [0, 1],
    [position === 'top' ? -100 : 100, 0]
  );

  const opacity = interpolate(
    enterProgress - exitProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 1]
  );

  if (frame < delay || frame > delay + duration) return null;

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 80,
        left: '50%',
        transform: `translateX(-50%) translateY(${slideY}px)`,
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          background: 'rgba(30, 30, 35, 0.95)',
          borderRadius: 16,
          border: `1px solid ${color}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}20`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: 'SF Pro Display, -apple-system, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.white,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: 'SF Pro Display, -apple-system, sans-serif',
                fontSize: 12,
                color: COLORS.gray300,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// POP NUMBER EFFECT
// Number that pops/bounces when reaching final value
// =============================================================================

type PopNumberProps = {
  value: number;
  startFrame: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

export const PopNumber: React.FC<PopNumberProps> = ({
  value,
  startFrame,
  duration = 45,
  prefix = '',
  suffix = '',
  decimals = 0,
  color = COLORS.white,
  fontSize = 24,
  fontWeight = 700,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countProgress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Pop effect when counter finishes
  const popProgress = spring({
    frame: frame - startFrame - duration + 5,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.5 },
  });

  const scale = 1 + popProgress * 0.15 * (1 - Math.min(1, (frame - startFrame - duration) / 15));

  const currentValue = value * countProgress;
  const displayValue = decimals > 0
    ? currentValue.toFixed(decimals)
    : Math.round(currentValue).toLocaleString();

  const glowIntensity = popProgress * 0.5;

  return (
    <span
      style={{
        fontFamily: 'SF Pro Display, -apple-system, sans-serif',
        fontSize,
        fontWeight,
        color,
        display: 'inline-block',
        transform: `scale(${scale})`,
        textShadow: glowIntensity > 0 ? `0 0 ${20 * glowIntensity}px ${color}60` : 'none',
      }}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// =============================================================================
// TEXT HIGHLIGHT EFFECT
// Animated highlight/underline on text
// =============================================================================

type TextHighlightProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  style?: 'underline' | 'background' | 'glow';
  thickness?: number;
};

export const TextHighlight: React.FC<TextHighlightProps> = ({
  children,
  delay = 0,
  duration = 30,
  color = COLORS.blue,
  style = 'underline',
  thickness = 4,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [delay, delay + duration],
    [0, 100],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  const pulseOpacity = 0.8 + Math.sin(frame * 0.1) * 0.2;

  const getHighlightStyle = (): React.CSSProperties => {
    switch (style) {
      case 'underline':
        return {
          position: 'relative' as const,
          display: 'inline-block',
        };
      case 'background':
        return {
          background: `linear-gradient(90deg, ${color}40 ${progress}%, transparent ${progress}%)`,
          padding: '2px 6px',
          borderRadius: 4,
        };
      case 'glow':
        return {
          textShadow: progress > 50
            ? `0 0 ${10 * pulseOpacity}px ${color}, 0 0 ${20 * pulseOpacity}px ${color}60`
            : 'none',
        };
      default:
        return {};
    }
  };

  return (
    <span style={getHighlightStyle()}>
      {children}
      {style === 'underline' && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${progress}%`,
            height: thickness,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            borderRadius: thickness / 2,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      )}
    </span>
  );
};

// =============================================================================
// LIGHT SWEEP ON PHONE
// Diagonal light sweep effect for phone screen
// =============================================================================

type LightSweepProps = {
  delay?: number;
  duration?: number;
  repeat?: boolean;
  repeatInterval?: number;
};

export const LightSweep: React.FC<LightSweepProps> = ({
  delay = 0,
  duration = 50,
  repeat = false,
  repeatInterval = 200,
}) => {
  const frame = useCurrentFrame();

  const effectiveFrame = repeat && frame > delay
    ? (frame - delay) % repeatInterval
    : frame - delay;

  const isActive = repeat
    ? effectiveFrame < duration && frame >= delay
    : frame >= delay && frame < delay + duration;

  const progress = interpolate(
    effectiveFrame,
    [0, duration],
    [-30, 130],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: `${progress}%`,
          width: 150,
          height: '200%',
          background: `linear-gradient(
            105deg,
            transparent 0%,
            rgba(255,255,255,0.03) 40%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.03) 60%,
            transparent 100%
          )`,
          transform: 'translateX(-50%) rotate(-15deg)',
        }}
      />
    </div>
  );
};

// =============================================================================
// PULSE RING EFFECT
// Expanding ring animation (for emphasis)
// =============================================================================

type PulseRingProps = {
  delay?: number;
  color?: string;
  size?: number;
  repeat?: boolean;
  repeatInterval?: number;
};

export const PulseRing: React.FC<PulseRingProps> = ({
  delay = 0,
  color = COLORS.blue,
  size = 100,
  repeat = true,
  repeatInterval = 90,
}) => {
  const frame = useCurrentFrame();

  const effectiveFrame = repeat && frame > delay
    ? (frame - delay) % repeatInterval
    : frame - delay;

  const progress = interpolate(
    effectiveFrame,
    [0, repeatInterval * 0.8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const scale = 0.5 + progress * 1.5;
  const opacity = 1 - progress;

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity * 0.6,
        boxShadow: `0 0 20px ${color}40`,
        pointerEvents: 'none',
      }}
    />
  );
};
