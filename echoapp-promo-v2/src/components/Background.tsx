import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { COLORS } from '../constants';

// =============================================================================
// PREMIUM ANIMATED BACKGROUND
// Dynamic gradient orbs, animated noise, spotlight effects
// =============================================================================

type BackgroundProps = {
  spotlight?: boolean;
  spotlightIntensity?: number;
};

export const Background: React.FC<BackgroundProps> = ({
  spotlight = true,
  spotlightIntensity = 0.25,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Slow-moving hue shift for orbs
  const hue1 = interpolate(frame, [0, durationInFrames], [220, 280], {
    extrapolateRight: 'clamp',
  });
  const hue2 = interpolate(frame, [0, durationInFrames], [280, 320], {
    extrapolateRight: 'clamp',
  });

  // Gentle floating motion for orbs
  const orbit1X = Math.sin(frame * 0.008) * 50;
  const orbit1Y = Math.cos(frame * 0.006) * 40;
  const orbit2X = Math.cos(frame * 0.007) * 45;
  const orbit2Y = Math.sin(frame * 0.009) * 35;
  const orbit3X = Math.sin(frame * 0.005) * 30;
  const orbit3Y = Math.cos(frame * 0.008) * 25;

  // Pulsing intensity
  const pulse1 = 0.12 + Math.sin(frame * 0.02) * 0.03;
  const pulse2 = 0.10 + Math.cos(frame * 0.018) * 0.025;

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      {/* Deep base gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(
              ellipse 150% 100% at 50% 100%,
              #0a0a15 0%,
              #050508 40%,
              #000000 100%
            )
          `,
        }}
      />

      {/* Primary gradient orb - top area */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue1}, 85%, 55%, ${pulse1}) 0%, transparent 60%)`,
          filter: 'blur(120px)',
          transform: `translate(-50%, -50%) translate(${orbit1X}px, ${orbit1Y}px)`,
        }}
      />

      {/* Secondary gradient orb - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue2}, 75%, 50%, ${pulse2}) 0%, transparent 60%)`,
          filter: 'blur(100px)',
          transform: `translate(${orbit2X}px, ${orbit2Y}px)`,
        }}
      />

      {/* Third orb - accent */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.teal}15 0%, transparent 60%)`,
          filter: 'blur(80px)',
          transform: `translate(${orbit3X}px, ${orbit3Y}px)`,
        }}
      />

      {/* Spotlight behind phone (center) */}
      {spotlight && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              width: 700,
              height: 700,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.blue}${Math.round(spotlightIntensity * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
              filter: 'blur(80px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.purple}${Math.round(spotlightIntensity * 180).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
              filter: 'blur(60px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </>
      )}

      {/* Animated noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: -50,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          transform: `translate(${(frame * 0.15) % 200}px, ${(frame * 0.1) % 200}px)`,
          pointerEvents: 'none',
        }}
      />

      {/* Vignette effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top safe area fade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom safe area fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
