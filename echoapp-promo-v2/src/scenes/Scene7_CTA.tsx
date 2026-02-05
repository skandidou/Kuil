import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { Background } from '../components/Background';
import { FloatingParticles, GlowOrb } from '../components/PhoneMockup';
import { Shine, PulseRing } from '../components/Effects';
import { fontFamily } from '../components/Typography';
import { COLORS, SPACING } from '../constants';

// =============================================================================
// SCENE 7: EPIC CTA FINALE
// Premium Apple-style call-to-action with dramatic reveal
// =============================================================================

export const Scene7_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered reveals
  const logoReveal = spring({
    frame: frame - 10,
    fps,
    config: { damping: 25, stiffness: 55, mass: 1.2 },
  });

  const taglineReveal = spring({
    frame: frame - 40,
    fps,
    config: { damping: 28, stiffness: 60, mass: 1.1 },
  });

  const subtitleReveal = spring({
    frame: frame - 65,
    fps,
    config: { damping: 28, stiffness: 65, mass: 1 },
  });

  const ctaReveal = spring({
    frame: frame - 90,
    fps,
    config: { damping: 22, stiffness: 80, mass: 0.9 },
  });

  // Logo floating
  const logoFloat = Math.sin(frame * 0.02) * 6;
  const logoPulse = 1 + Math.sin(frame * 0.04) * 0.015;

  // CTA button pulse
  const ctaPulse = 1 + Math.sin(frame * 0.06) * 0.02 * Math.min(ctaReveal, 1);

  // Glow intensity
  const glowIntensity = 0.3 + Math.sin(frame * 0.025) * 0.1;

  return (
    <AbsoluteFill>
      <Background spotlight={true} spotlightIntensity={glowIntensity} />

      {/* Particles */}
      <FloatingParticles count={40} color={COLORS.blue} opacity={0.5} />

      {/* Animated glow orbs */}
      <GlowOrb color={COLORS.blue} size={500} x="50%" y="35%" pulseSpeed={0.015} />
      <GlowOrb color={COLORS.purple} size={400} x="30%" y="60%" pulseSpeed={0.02} />
      <GlowOrb color={COLORS.pink} size={350} x="70%" y="70%" pulseSpeed={0.018} />

      {/* Extra central glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${COLORS.blue}40 0%, ${COLORS.purple}20 40%, transparent 70%)`,
          filter: 'blur(80px)',
          transform: 'translate(-50%, -50%)',
          opacity: interpolate(logoReveal, [0, 1], [0, 1]),
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          paddingLeft: SPACING.xl,
          paddingRight: SPACING.xl,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            transform: `translateY(${logoFloat}px) scale(${logoPulse})`,
          }}
        >
          {/* App Icon with Shine */}
          <div
            style={{
              position: 'relative',
              width: 130,
              height: 130,
              borderRadius: 36,
              background: `linear-gradient(145deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 11,
              transform: `scale(${interpolate(logoReveal, [0, 1], [0.4, 1])}) rotate(${interpolate(logoReveal, [0, 1], [-15, 0])}deg)`,
              opacity: interpolate(logoReveal, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
              filter: `blur(${interpolate(logoReveal, [0, 1], [12, 0])}px)`,
              boxShadow: `
                0 50px 120px ${COLORS.blue}60,
                0 25px 70px ${COLORS.purple}50,
                0 0 0 1px rgba(255,255,255,0.15),
                inset 0 1px 1px rgba(255,255,255,0.3),
                0 0 100px ${COLORS.blue}50
              `,
              overflow: 'hidden',
            }}
          >
            {[56, 42, 50].map((width, i) => (
              <div
                key={i}
                style={{
                  width,
                  height: 8,
                  backgroundColor: COLORS.white,
                  borderRadius: 4,
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
            {/* Shine effect on logo */}
            <Shine delay={50} duration={45} color="rgba(255,255,255,0.5)" width={100} />
            <Shine delay={140} duration={40} color="rgba(255,255,255,0.35)" width={70} />
          </div>

          {/* Pulse rings around logo */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <PulseRing delay={60} color={COLORS.blue} size={160} repeatInterval={90} />
            <PulseRing delay={75} color={COLORS.purple} size={180} repeatInterval={90} />
          </div>

          {/* Brand name */}
          <h1
            style={{
              fontFamily,
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: '-3px',
              margin: 0,
              transform: `translateY(${interpolate(logoReveal, [0, 1], [50, 0])}px)`,
              opacity: logoReveal,
              filter: `blur(${interpolate(logoReveal, [0, 1], [10, 0])}px)`,
              textShadow: `0 4px 40px rgba(0,0,0,0.4), 0 0 80px ${COLORS.blue}30`,
            }}
          >
            Kuil
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h2
            style={{
              fontFamily,
              fontSize: 36,
              fontWeight: 600,
              color: COLORS.gray100,
              textAlign: 'center',
              letterSpacing: '-1px',
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 450,
              transform: `translateY(${interpolate(taglineReveal, [0, 1], [40, 0])}px)`,
              opacity: taglineReveal,
              filter: `blur(${interpolate(taglineReveal, [0, 1], [8, 0])}px)`,
            }}
          >
            Amplify your voice.
          </h2>

          <h2
            style={{
              fontFamily,
              fontSize: 36,
              fontWeight: 600,
              textAlign: 'center',
              letterSpacing: '-1px',
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 450,
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 50%, ${COLORS.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              transform: `translateY(${interpolate(subtitleReveal, [0, 1], [35, 0])}px)`,
              opacity: subtitleReveal,
              filter: `blur(${interpolate(subtitleReveal, [0, 1], [8, 0])}px)`,
            }}
          >
            Stand out on LinkedIn.
          </h2>
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            transform: `translateY(${interpolate(ctaReveal, [0, 1], [30, 0])}px) scale(${ctaPulse})`,
            opacity: ctaReveal,
            filter: `blur(${interpolate(ctaReveal, [0, 1], [6, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.white,
              background: `linear-gradient(145deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              padding: '20px 52px',
              borderRadius: 100,
              boxShadow: `
                0 30px 80px ${COLORS.blue}60,
                0 12px 40px ${COLORS.purple}45,
                0 0 0 1px rgba(255,255,255,0.2),
                inset 0 1px 1px rgba(255,255,255,0.25)
              `,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <AppleLogo />
            <span>Download on App Store</span>
          </div>

          <span
            style={{
              fontFamily,
              fontSize: 18,
              fontWeight: 500,
              color: COLORS.gray300,
              opacity: interpolate(ctaReveal, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' }),
            }}
          >
            Kuil.ai
          </span>
        </div>

        {/* Social proof */}
        <SocialProof delay={120} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Apple Logo
const AppleLogo: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

// Social proof component
const SocialProof: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 70, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        opacity: interpolate(progress, [0, 1], [0, 0.8]),
      }}
    >
      {/* Star rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ color: '#FFD700', fontSize: 14 }}>★</span>
          ))}
        </div>
        <span style={{ fontFamily, fontSize: 13, color: COLORS.gray400 }}>4.9</span>
      </div>

      <div style={{ width: 1, height: 16, backgroundColor: COLORS.gray600 }} />

      {/* Users count */}
      <span style={{ fontFamily, fontSize: 13, color: COLORS.gray400 }}>
        10K+ creators
      </span>
    </div>
  );
};
