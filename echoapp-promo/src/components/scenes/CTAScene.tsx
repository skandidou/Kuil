import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING_SMOOTH, SPRING_BOUNCY } from '../constants';
import { Background } from '../Background';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: SPRING_BOUNCY,
  });

  const logoScale = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // Title animation
  const titleProgress = spring({
    frame: frame - 10,
    fps,
    config: SPRING_SMOOTH,
  });

  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // CTA button animation
  const ctaProgress = spring({
    frame: frame - 25,
    fps,
    config: SPRING_BOUNCY,
  });

  const ctaScale = interpolate(ctaProgress, [0, 1], [0.8, 1]);
  const ctaOpacity = interpolate(ctaProgress, [0, 1], [0, 1]);

  // Pulse animation for CTA
  const pulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.02, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <Background variant="gradient" />

      {/* Animated gradient background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          background: `radial-gradient(circle, ${COLORS.primaryStart}30 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${COLORS.primaryStart} 0%, ${COLORS.primaryEnd} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: 16,
              boxShadow: `0 20px 60px ${COLORS.primaryStart}50`,
            }}
          >
            <div style={{ width: 36, height: 5, backgroundColor: COLORS.white, borderRadius: 3 }} />
            <div style={{ width: 26, height: 5, backgroundColor: COLORS.white, borderRadius: 3, opacity: 0.7 }} />
            <div style={{ width: 30, height: 5, backgroundColor: COLORS.white, borderRadius: 3, opacity: 0.5 }} />
          </div>
          <span
            style={{
              fontFamily,
              fontSize: 48,
              fontWeight: 800,
              color: COLORS.white,
              letterSpacing: '-1px',
            }}
          >
            SpecterInk
          </span>
        </div>

        {/* Main title */}
        <h1
          style={{
            fontFamily,
            fontSize: 72,
            fontWeight: 900,
            color: COLORS.white,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-2px',
            margin: 0,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          Ready to Amplify{' '}
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.primaryStart} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Your Voice?
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily,
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.gray,
            textAlign: 'center',
            margin: 0,
            maxWidth: 600,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          Join thousands of founders and experts who trust SpecterInk
          to power their LinkedIn presence.
        </p>

        {/* CTA Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            transform: `scale(${ctaScale * pulse})`,
            opacity: ctaOpacity,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.white,
              background: `linear-gradient(135deg, ${COLORS.primaryStart} 0%, ${COLORS.primaryEnd} 100%)`,
              padding: '20px 50px',
              borderRadius: 50,
              boxShadow: `0 15px 50px ${COLORS.primaryStart}60`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>Download on the App Store</span>
            <AppleIcon />
          </div>

          <span
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.gray,
            }}
          >
            Free to start • No credit card required
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AppleIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);
