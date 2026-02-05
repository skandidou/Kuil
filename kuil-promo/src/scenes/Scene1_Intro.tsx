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
import { DynamicBackground } from '../components/DynamicBackground';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Initial flash effect
  const flashOpacity = interpolate(
    frame,
    [0, 5, 15],
    [1, 0.8, 0],
    { extrapolateRight: 'clamp' }
  );

  // Logo icon animation - dramatic entrance
  const iconProgress = spring({
    frame: frame - 10,
    fps,
    config: SPRING.bouncy,
  });

  const iconScale = interpolate(iconProgress, [0, 1], [0, 1]);
  const iconRotate = interpolate(iconProgress, [0, 1], [-180, 0]);
  const iconOpacity = interpolate(iconProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Logo "K" letter animation
  const kProgress = spring({
    frame: frame - 25,
    fps,
    config: SPRING.snappy,
  });

  // Text animation
  const textProgress = spring({
    frame: frame - 35,
    fps,
    config: SPRING.smooth,
  });

  const textX = interpolate(textProgress, [0, 1], [50, 0]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - 55,
    fps,
    config: SPRING.smooth,
  });

  const taglineY = interpolate(taglineProgress, [0, 1], [30, 0]);
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);

  // Glow pulse effect
  const glowPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.6, 1]
  );

  // Exit animation
  const exitStart = durationInFrames - 20;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  const exitScale = interpolate(exitProgress, [0, 1], [1, 1.2]);
  const exitOpacity = 1 - exitProgress;

  return (
    <AbsoluteFill>
      <DynamicBackground variant="intense" particleCount={50} />

      {/* Initial flash */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.white,
          opacity: flashOpacity,
          mixBlendMode: 'overlay',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Logo icon - stylized K */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.neonPurple} 100%)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
              opacity: iconOpacity,
              boxShadow: `
                0 20px 60px ${COLORS.primary}60,
                0 0 ${80 * glowPulse}px ${COLORS.neonPurple}40
              `,
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: 56,
                fontWeight: 900,
                color: COLORS.white,
                transform: `scale(${interpolate(kProgress, [0, 1], [0, 1])})`,
              }}
            >
              K
            </span>
          </div>

          {/* Logo text */}
          <span
            style={{
              fontFamily,
              fontSize: 72,
              fontWeight: 800,
              color: COLORS.white,
              letterSpacing: '-2px',
              transform: `translateX(${textX}px)`,
              opacity: textOpacity,
            }}
          >
            uil
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            transform: `translateY(${taglineY}px)`,
            opacity: taglineOpacity,
          }}
        >
          <p
            style={{
              fontFamily,
              fontSize: 28,
              fontWeight: 400,
              color: COLORS.gray300,
              letterSpacing: '0.5px',
              margin: 0,
            }}
          >
            L'IA qui parle comme{' '}
            <span
              style={{
                color: 'transparent',
                background: `linear-gradient(90deg, ${COLORS.neonBlue}, ${COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                fontWeight: 600,
              }}
            >
              vous
            </span>
          </p>
        </div>

        {/* Animated rings around logo */}
        {[1, 2, 3].map((ring) => {
          const ringProgress = spring({
            frame: frame - 15 - ring * 8,
            fps,
            config: { damping: 30, stiffness: 60, mass: 1.5 },
          });

          const ringScale = interpolate(ringProgress, [0, 1], [0.5, 1 + ring * 0.3]);
          const ringOpacity = interpolate(ringProgress, [0, 0.5, 1], [0, 0.4, 0]);

          return (
            <div
              key={ring}
              style={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: 28,
                border: `2px solid ${COLORS.neonPurple}`,
                transform: `scale(${ringScale})`,
                opacity: ringOpacity,
                top: '50%',
                left: '50%',
                marginTop: -50 - 30, // Center accounting for gap
                marginLeft: -50 - 46, // Center accounting for text
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
