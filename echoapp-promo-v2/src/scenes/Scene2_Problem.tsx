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
import { GlowOrb, TypingText, FloatingParticles } from '../components/PhoneMockup';
import { PulseRing } from '../components/Effects';
import { fontFamily } from '../components/Typography';
import { COLORS, SPACING, SAFE_AREA } from '../constants';

// =============================================================================
// SCENE 2: PROBLEM STATEMENT
// Dramatic typewriter effect with cinematic reveals
// =============================================================================

export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // No internal exit animation - let TransitionSeries handle it

  // Line reveals with typewriter
  const line1Start = 10;
  const line2Start = 50;
  const line3Start = 90;
  const untilNowStart = 140;

  const untilNowReveal = spring({
    frame: frame - untilNowStart,
    fps,
    config: { damping: 20, stiffness: 50, mass: 1.2 },
  });

  // Glow intensity based on "Until now" reveal
  const glowIntensity = interpolate(untilNowReveal, [0, 1], [0, 0.8]);

  // Shake effect for "takes hours"
  const shakeIntensity = frame >= line3Start + 30 && frame < untilNowStart
    ? Math.sin(frame * 0.8) * 2
    : 0;

  return (
    <AbsoluteFill>
      <Background spotlight={false} />

      {/* Subtle particles */}
      <FloatingParticles count={15} color={COLORS.gray400} opacity={0.2} />

      {/* Animated glow that appears with "Until now" */}
      <GlowOrb
        color={COLORS.blue}
        size={500}
        x="50%"
        y="55%"
        pulseSpeed={0.025}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${COLORS.purple}30 0%, transparent 60%)`,
          filter: 'blur(80px)',
          transform: 'translate(-50%, -50%)',
          opacity: glowIntensity,
        }}
      />

      {/* Pulse rings when "Until now" appears */}
      {frame >= untilNowStart && (
        <div style={{ position: 'absolute', left: '50%', top: '65%', transform: 'translate(-50%, -50%)' }}>
          <PulseRing delay={untilNowStart} color={COLORS.blue} size={200} repeatInterval={80} />
          <PulseRing delay={untilNowStart + 15} color={COLORS.purple} size={250} repeatInterval={80} />
        </div>
      )}

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingLeft: SAFE_AREA.horizontal,
          paddingRight: SAFE_AREA.horizontal,
          opacity: 1,
          transform: 'scale(1)',
        }}
      >
        {/* Line 1 - Typing */}
        <div style={{ minHeight: 65, display: 'flex', alignItems: 'center' }}>
          <TypingText
            text="Writing great"
            startFrame={line1Start}
            speed={25}
            cursorColor={COLORS.white}
            showCursor={frame < line2Start + 10}
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-2px',
              color: COLORS.white,
            }}
          />
        </div>

        {/* Line 2 - Typing */}
        <div style={{ minHeight: 65, display: 'flex', alignItems: 'center' }}>
          <TypingText
            text="LinkedIn content"
            startFrame={line2Start}
            speed={25}
            cursorColor={COLORS.white}
            showCursor={frame >= line2Start && frame < line3Start + 10}
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-2px',
              color: COLORS.white,
            }}
          />
        </div>

        {/* Line 3 - Typing with shake */}
        <div
          style={{
            minHeight: 65,
            display: 'flex',
            alignItems: 'center',
            transform: `translateX(${shakeIntensity}px)`,
          }}
        >
          <TypingText
            text="takes hours."
            startFrame={line3Start}
            speed={20}
            cursorColor={COLORS.gray400}
            showCursor={frame >= line3Start && frame < untilNowStart}
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-2px',
              color: COLORS.gray400,
            }}
          />
        </div>

        {/* "Until now." - Dramatic reveal */}
        <div
          style={{
            marginTop: 40,
            minHeight: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2
            style={{
              fontFamily,
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: '-2px',
              margin: 0,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 50%, ${COLORS.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              transform: `
                translateY(${interpolate(untilNowReveal, [0, 1], [60, 0])}px)
                scale(${interpolate(untilNowReveal, [0, 1], [0.7, 1])})
              `,
              opacity: untilNowReveal,
              filter: `blur(${interpolate(untilNowReveal, [0, 1], [15, 0])}px)`,
              textShadow: `0 0 60px ${COLORS.blue}50`,
            }}
          >
            Until now.
          </h2>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
