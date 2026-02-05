import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

export const AppleBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle gradient animation
  const hue1 = interpolate(
    frame,
    [0, durationInFrames],
    [220, 280],
    { extrapolateRight: 'clamp' }
  );

  const hue2 = interpolate(
    frame,
    [0, durationInFrames],
    [280, 320],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: '#000000',
      }}
    >
      {/* Animated gradient orbs - very subtle */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue1}, 80%, 50%, 0.15) 0%, transparent 60%)`,
          filter: 'blur(120px)',
          transform: `translate(${Math.sin(frame * 0.008) * 30}px, ${Math.cos(frame * 0.006) * 20}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue2}, 70%, 45%, 0.12) 0%, transparent 60%)`,
          filter: 'blur(100px)',
          transform: `translate(${Math.cos(frame * 0.007) * 25}px, ${Math.sin(frame * 0.009) * 15}px)`,
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </AbsoluteFill>
  );
};
