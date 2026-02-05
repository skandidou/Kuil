import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { AppleBackground } from '../components/AppleBackground';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export const Scene7_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({ frame, fps, config: SPRING.bouncy });

  // Title animation
  const titleProgress = spring({ frame: frame - 15, fps, config: SPRING.smooth });

  // CTA button animation
  const ctaProgress = spring({ frame: frame - 35, fps, config: SPRING.bouncy });

  // Subtle pulse for CTA
  const pulse = 1 + Math.sin(frame * 0.08) * 0.015;

  return (
    <AbsoluteFill>
      <AppleBackground />

      {/* Center glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          background: `radial-gradient(circle, ${COLORS.blue}25 0%, transparent 60%)`,
          filter: 'blur(80px)',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            transform: `scale(${interpolate(logoProgress, [0, 1], [0.5, 1])})`,
            opacity: interpolate(logoProgress, [0, 1], [0, 1]),
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              boxShadow: `0 30px 80px ${COLORS.blue}50`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 6,
                backgroundColor: COLORS.white,
                borderRadius: 3,
              }}
            />
            <div
              style={{
                width: 32,
                height: 6,
                backgroundColor: COLORS.white,
                borderRadius: 3,
                opacity: 0.75,
              }}
            />
            <div
              style={{
                width: 38,
                height: 6,
                backgroundColor: COLORS.white,
                borderRadius: 3,
                opacity: 0.5,
              }}
            />
          </div>

          <span
            style={{
              fontFamily,
              fontSize: 72,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: '-2px',
            }}
          >
            SpecterInk
          </span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontFamily,
            fontSize: 56,
            fontWeight: 600,
            color: COLORS.gray100,
            textAlign: 'center',
            letterSpacing: '-1px',
            lineHeight: 1.3,
            margin: 0,
            maxWidth: 800,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
            opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          }}
        >
          Amplify your voice.
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 50%, ${COLORS.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Stand out on LinkedIn.
          </span>
        </h1>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            transform: `scale(${interpolate(ctaProgress, [0, 1], [0.8, 1]) * pulse})`,
            opacity: interpolate(ctaProgress, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.white,
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              padding: '20px 48px',
              borderRadius: 100,
              boxShadow: `0 20px 60px ${COLORS.blue}50`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <AppleLogo />
            <span>Download on the App Store</span>
          </div>

          <span
            style={{
              fontFamily,
              fontSize: 15,
              fontWeight: 400,
              color: COLORS.gray400,
            }}
          >
            Free to start
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AppleLogo: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);
