import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { COLORS } from '../constants';

// =============================================================================
// ANIMATED ICONS
// Micro-animated icons for visual interest
// =============================================================================

type IconProps = {
  delay?: number;
  size?: number;
  color?: string;
};

// Animated checkmark that draws itself
export const AnimatedCheck: React.FC<IconProps> = ({
  delay = 0,
  size = 24,
  color = COLORS.green,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.8 },
  });

  const pathLength = 30;
  const dashOffset = pathLength * (1 - drawProgress);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        opacity={0.2}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={63}
        strokeDashoffset={63 * (1 - drawProgress)}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
      <path
        d="M8 12l3 3 5-6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        opacity={drawProgress > 0.5 ? 1 : 0}
      />
    </svg>
  );
};

// Animated sparkle/star
export const AnimatedSparkle: React.FC<IconProps> = ({
  delay = 0,
  size = 20,
  color = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.6 },
  });

  const rotation = (frame - delay) * 2;
  const pulse = 1 + Math.sin((frame - delay) * 0.1) * 0.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{
        transform: `scale(${scale * pulse}) rotate(${rotation}deg)`,
        filter: `drop-shadow(0 0 4px ${color}80)`,
      }}
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
};

// Animated loading/processing dots
export const AnimatedDots: React.FC<{ delay?: number; color?: string }> = ({
  delay = 0,
  color = COLORS.blue,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => {
        const dotPhase = ((frame - delay) * 0.15 + i * 0.8) % (Math.PI * 2);
        const scale = 0.6 + Math.sin(dotPhase) * 0.4;
        const opacity = 0.4 + Math.sin(dotPhase) * 0.6;

        return (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: color,
              transform: `scale(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

// Animated arrow pointing up (for growth)
export const AnimatedArrowUp: React.FC<IconProps> = ({
  delay = 0,
  size = 24,
  color = COLORS.green,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 120, mass: 0.7 },
  });

  const bounce = Math.sin((frame - delay) * 0.1) * 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: `translateY(${-bounce * reveal}px) scale(${reveal})`,
        opacity: reveal,
      }}
    >
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Animated bell/notification
export const AnimatedBell: React.FC<IconProps> = ({
  delay = 0,
  size = 24,
  color = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  // Ring animation
  const ringPhase = (frame - delay) * 0.15;
  const ringRotation = Math.sin(ringPhase) * 15 * Math.max(0, 1 - (frame - delay - 30) / 60);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: `rotate(${ringRotation}deg) scale(${reveal})`,
        transformOrigin: 'top center',
        opacity: reveal,
      }}
    >
      <path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`${color}20`}
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Notification dot */}
      <circle cx="18" cy="6" r="4" fill={COLORS.pink} />
    </svg>
  );
};

// Animated lightning bolt
export const AnimatedLightning: React.FC<IconProps> = ({
  delay = 0,
  size = 24,
  color = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  const flash = Math.sin((frame - delay) * 0.2) > 0.7 ? 1.3 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{
        transform: `scale(${reveal * flash})`,
        filter: `drop-shadow(0 0 ${6 * flash}px ${color})`,
        opacity: reveal,
      }}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
};

// Animated percentage badge
export const AnimatedBadge: React.FC<{
  delay?: number;
  value: string;
  color?: string;
}> = ({ delay = 0, value, color = COLORS.green }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.7 },
  });

  const pulse = 1 + Math.sin((frame - delay) * 0.08) * 0.05;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        background: `${color}20`,
        borderRadius: 20,
        transform: `scale(${scale * pulse})`,
        opacity: scale,
      }}
    >
      <AnimatedArrowUp delay={delay + 10} size={14} color={color} />
      <span
        style={{
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
};
