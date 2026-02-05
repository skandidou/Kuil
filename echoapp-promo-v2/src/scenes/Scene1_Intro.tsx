import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { Background } from '../components/Background';
import { FloatingParticles, GlowOrb } from '../components/PhoneMockup';
import { Shine, PulseRing, TextHighlight } from '../components/Effects';
import { fontFamily } from '../components/Typography';
import { COLORS, SPACING } from '../constants';

// =============================================================================
// SCENE 1: EPIC LOGO INTRO
// Apple keynote-style with particles, glows, and dramatic reveal
// =============================================================================

export const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Staggered reveals
  const logoReveal = spring({
    frame: frame - 15,
    fps,
    config: { damping: 25, stiffness: 50, mass: 1.3 },
  });

  const textReveal = spring({
    frame: frame - 45,
    fps,
    config: { damping: 30, stiffness: 60, mass: 1.1 },
  });

  const taglineReveal = spring({
    frame: frame - 75,
    fps,
    config: { damping: 28, stiffness: 55, mass: 1 },
  });

  // No internal exit animation - let TransitionSeries handle it

  // Logo pulse
  const logoPulse = 1 + Math.sin(frame * 0.04) * 0.02;
  const logoFloat = Math.sin(frame * 0.025) * 8;

  // Word reveal for tagline
  const words = ['Your', 'LinkedIn', 'Voice,', 'Amplified.'];

  return (
    <AbsoluteFill>
      <Background spotlight={true} spotlightIntensity={0.25} />

      {/* Floating particles */}
      <FloatingParticles count={30} color={COLORS.blue} opacity={0.5} />

      {/* Animated glow orbs */}
      <GlowOrb color={COLORS.blue} size={400} x="30%" y="30%" pulseSpeed={0.015} />
      <GlowOrb color={COLORS.purple} size={350} x="70%" y="60%" pulseSpeed={0.02} />
      <GlowOrb color={COLORS.teal} size={300} x="50%" y="80%" pulseSpeed={0.018} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
          opacity: 1,
          transform: 'scale(1)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 25,
            transform: `translateY(${logoFloat}px) scale(${logoPulse})`,
          }}
        >
          {/* App Icon with Shine Effect */}
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              borderRadius: 38,
              background: `linear-gradient(145deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              transform: `scale(${interpolate(logoReveal, [0, 1], [0.3, 1])}) rotate(${interpolate(logoReveal, [0, 1], [-20, 0])}deg)`,
              opacity: interpolate(logoReveal, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
              filter: `blur(${interpolate(logoReveal, [0, 1], [15, 0])}px)`,
              boxShadow: `
                0 50px 120px ${COLORS.blue}60,
                0 25px 70px ${COLORS.purple}50,
                0 0 0 1px rgba(255,255,255,0.15),
                inset 0 1px 1px rgba(255,255,255,0.3),
                0 0 80px ${COLORS.blue}40
              `,
              overflow: 'hidden',
            }}
          >
            {[60, 46, 54].map((width, i) => (
              <div
                key={i}
                style={{
                  width,
                  height: 9,
                  backgroundColor: COLORS.white,
                  borderRadius: 5,
                  opacity: 1 - i * 0.2,
                  transform: `scaleX(${interpolate(logoReveal, [0.3 + i * 0.1, 0.6 + i * 0.1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`,
                }}
              />
            ))}
            {/* Shine sweep across logo */}
            <Shine delay={60} duration={50} color="rgba(255,255,255,0.5)" width={120} />
            {/* Second shine for extra polish */}
            <Shine delay={130} duration={45} color="rgba(255,255,255,0.3)" width={80} />
          </div>

          {/* Pulse rings emanating from logo */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <PulseRing delay={70} color={COLORS.blue} size={180} repeatInterval={100} />
            <PulseRing delay={85} color={COLORS.purple} size={200} repeatInterval={100} />
          </div>

          {/* Brand name with letter reveal */}
          <div style={{ overflow: 'hidden' }}>
            <h1
              style={{
                fontFamily,
                fontSize: 72,
                fontWeight: 700,
                color: COLORS.white,
                letterSpacing: '-3px',
                margin: 0,
                transform: `translateY(${interpolate(textReveal, [0, 1], [80, 0])}px)`,
                opacity: textReveal,
                filter: `blur(${interpolate(textReveal, [0, 1], [10, 0])}px)`,
                textShadow: `0 4px 40px rgba(0,0,0,0.4), 0 0 80px ${COLORS.blue}30`,
              }}
            >
              Kuil
            </h1>
          </div>
        </div>

        {/* Tagline with word-by-word reveal */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            maxWidth: 450,
          }}
        >
          {words.map((word, i) => {
            const wordDelay = 75 + i * 8;
            const wordProgress = spring({
              frame: frame - wordDelay,
              fps,
              config: { damping: 25, stiffness: 80, mass: 0.8 },
            });

            const isGradient = word === 'Amplified.';

            return (
              <span
                key={i}
                style={{
                  fontFamily,
                  fontSize: 30,
                  fontWeight: isGradient ? 600 : 400,
                  letterSpacing: '-0.5px',
                  ...(isGradient
                    ? {
                        background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                      }
                    : { color: COLORS.gray300 }),
                  transform: `translateY(${interpolate(wordProgress, [0, 1], [30, 0])}px)`,
                  opacity: wordProgress,
                  filter: `blur(${interpolate(wordProgress, [0, 1], [5, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
