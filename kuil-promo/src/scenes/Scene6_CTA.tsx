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
import { SplitRevealText } from '../components/AnimatedText';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

// Animated App Store button
const AppStoreButton: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.bouncy,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  // Glow pulse
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.8]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 32px',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        boxShadow: `0 0 60px ${COLORS.white}${Math.round(glowPulse * 80).toString(16).padStart(2, '0')}`,
        cursor: 'pointer',
      }}
    >
      {/* Apple logo */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill={COLORS.black}
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.black,
            opacity: 0.7,
          }}
        >
          Télécharger sur
        </span>
        <span
          style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.black,
            letterSpacing: '-0.5px',
          }}
        >
          App Store
        </span>
      </div>
    </div>
  );
};

// Flying particles
const FlyingParticle: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const startX = (index * 137) % width;
  const startY = height + 50;
  const speed = 2 + (index % 5);
  const wobble = Math.sin(frame * 0.05 + index) * 30;

  const y = startY - frame * speed;
  const x = startX + wobble;
  const opacity = interpolate(y, [height, height / 2, 0], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const size = 4 + (index % 4) * 2;

  const colors = [COLORS.neonBlue, COLORS.neonPurple, COLORS.neonPink, COLORS.neonGreen, COLORS.accent];
  const color = colors[index % colors.length];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        opacity,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
};

export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: SPRING.bouncy,
  });

  const logoScale = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoRotate = interpolate(logoProgress, [0, 1], [-180, 0]);

  // Headline animation
  const headlineProgress = spring({
    frame: frame - 20,
    fps,
    config: SPRING.smooth,
  });

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - 50,
    fps,
    config: SPRING.smooth,
  });

  // Pulsing glow
  const glowPulse = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.5, 1]);

  // No exit animation - end on CTA

  return (
    <AbsoluteFill>
      <DynamicBackground variant="intense" particleCount={60} />

      {/* Flying particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <FlyingParticle key={i} index={i} />
      ))}

      {/* Central glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.primary}30 0%, transparent 60%)`,
          filter: 'blur(100px)',
          opacity: glowPulse,
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
            width: 120,
            height: 120,
            borderRadius: 32,
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.neonPurple} 100%)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            boxShadow: `
              0 20px 80px ${COLORS.primary}60,
              0 0 ${100 * glowPulse}px ${COLORS.neonPurple}40
            `,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: 72,
              fontWeight: 900,
              color: COLORS.white,
            }}
          >
            K
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            opacity: interpolate(headlineProgress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(headlineProgress, [0, 1], [40, 0])}px)`,
          }}
        >
          <h1
            style={{
              fontFamily,
              fontSize: 72,
              fontWeight: 900,
              color: COLORS.white,
              textAlign: 'center',
              margin: 0,
              letterSpacing: '-3px',
            }}
          >
            Prêt à{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.neonBlue}, ${COLORS.neonPurple}, ${COLORS.neonPink})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              dominer
            </span>
            {' '}LinkedIn?
          </h1>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily,
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.gray300,
            textAlign: 'center',
            margin: 0,
            maxWidth: 600,
            opacity: interpolate(taglineProgress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(taglineProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          Rejoignez des milliers de créateurs qui font passer leur contenu
          au niveau supérieur avec Kuil.
        </p>

        {/* CTA Button */}
        <AppStoreButton delay={70} />

        {/* Social proof */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 20,
            opacity: interpolate(
              spring({ frame: frame - 90, fps, config: SPRING.smooth }),
              [0, 1],
              [0, 1]
            ),
          }}
        >
          {/* Star rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: 18,
                    color: '#FFD700',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span
              style={{
                fontFamily,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.white,
              }}
            >
              4.9
            </span>
          </div>

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: COLORS.gray500,
            }}
          />

          <span
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.gray300,
            }}
          >
            +5,000 créateurs actifs
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
