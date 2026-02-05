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
import { PhoneMockup, FloatingParticles, GlowOrb, TypingText } from '../components/PhoneMockup';
import { fontFamily } from '../components/Typography';
import { COLORS, SAFE_AREA } from '../constants';

// =============================================================================
// SCENE 4: SMART EDITOR - Based on real app UI
// Hook Score with progress bar, Mobile/Desktop toggle, AI suggestions
// =============================================================================

export const Scene4_Editor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Text animations
  const labelReveal = spring({
    frame: frame - 5,
    fps,
    config: { damping: 30, stiffness: 90, mass: 1 },
  });

  const titleReveal = spring({
    frame: frame - 20,
    fps,
    config: { damping: 28, stiffness: 80, mass: 1.1 },
  });

  const descReveal = spring({
    frame: frame - 40,
    fps,
    config: { damping: 30, stiffness: 85, mass: 1 },
  });

  // Exit
  const exitStart = durationInFrames - 30;
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Background spotlight={true} spotlightIntensity={0.22} />

      <FloatingParticles count={20} color={COLORS.green} opacity={0.35} />
      <GlowOrb color={COLORS.green} size={350} x="70%" y="65%" pulseSpeed={0.018} />
      <GlowOrb color={COLORS.teal} size={280} x="30%" y="35%" pulseSpeed={0.022} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: SAFE_AREA.top + 40,
          paddingLeft: SAFE_AREA.horizontal,
          paddingRight: SAFE_AREA.horizontal,
          paddingBottom: SAFE_AREA.bottom,
          opacity: 1 - exitProgress,
          transform: `scale(${1 - exitProgress * 0.05}) translateY(${-exitProgress * 40}px)`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <span
            style={{
              fontFamily,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: COLORS.green,
              transform: `translateY(${interpolate(labelReveal, [0, 1], [20, 0])}px)`,
              opacity: labelReveal,
              filter: `blur(${interpolate(labelReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            Smart Editor
          </span>

          <h2
            style={{
              fontFamily,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              color: COLORS.white,
              margin: 0,
              textAlign: 'center',
              transform: `translateY(${interpolate(titleReveal, [0, 1], [30, 0])}px)`,
              opacity: titleReveal,
              filter: `blur(${interpolate(titleReveal, [0, 1], [6, 0])}px)`,
            }}
          >
            Perfect your
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.teal} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Hook Score
            </span>
          </h2>

          <p
            style={{
              fontFamily,
              fontSize: 16,
              fontWeight: 400,
              color: COLORS.gray300,
              margin: 0,
              textAlign: 'center',
              maxWidth: 340,
              transform: `translateY(${interpolate(descReveal, [0, 1], [20, 0])}px)`,
              opacity: descReveal,
              filter: `blur(${interpolate(descReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            AI rates your engagement potential in real-time.
          </p>
        </div>

        {/* Phone with real app UI */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneMockup delay={30} scale={0.85} rotateY={0} rotateX={0}>
            <SmartEditorScreen />
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Real app Smart Editor screen
const SmartEditorScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scoreProgress = spring({
    frame: frame - 70,
    fps,
    config: { damping: 25, stiffness: 60, mass: 1 },
  });

  const hookScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 85]));

  const suggestionReveal = spring({
    frame: frame - 140,
    fps,
    config: { damping: 22, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        padding: '55px 16px 16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily, fontSize: 11, color: COLORS.gray400 }}>‹</div>
        <div style={{ fontFamily, fontSize: 16, fontWeight: 600, color: COLORS.white }}>Smart Editor</div>
        <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.blue }}>Post</div>
      </div>

      {/* Mobile/Desktop Toggle */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 6,
            background: COLORS.blue,
            fontFamily,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.white,
            textAlign: 'center',
          }}
        >
          MOBILE VIEW
        </div>
        <div
          style={{
            flex: 1,
            padding: '8px 0',
            fontFamily,
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.gray400,
            textAlign: 'center',
          }}
        >
          DESKTOP VIEW
        </div>
      </div>

      {/* Hook Score Card */}
      <div
        style={{
          padding: 14,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                background: COLORS.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
              }}
            >
              ◆
            </div>
            <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.white }}>Hook Score</span>
          </div>
          <span style={{ fontFamily, fontSize: 18, fontWeight: 700, color: COLORS.green }}>{hookScore}/100</span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 6,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${hookScore}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.teal})`,
              borderRadius: 3,
              boxShadow: `0 0 10px ${COLORS.green}60`,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>✓</span>
          <span style={{ fontFamily, fontSize: 12, color: COLORS.green }}>Great! Your hook is engaging.</span>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 0',
          marginBottom: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {['B', 'I', '≡', '⌔', '@', '#'].map((icon, i) => (
          <span key={i} style={{ fontFamily, fontSize: 16, fontWeight: i === 0 ? 700 : 400, color: COLORS.gray400 }}>
            {icon}
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: COLORS.blue }}>✦</span>
          <span style={{ fontFamily, fontSize: 11, fontWeight: 600, color: COLORS.blue }}>AI CLEANUP</span>
        </div>
      </div>

      {/* Text content */}
      <div style={{ flex: 1 }}>
        <TypingText
          text="I used to think that consistency was the key to LinkedIn growth. I was"
          startFrame={55}
          speed={28}
          cursorColor={COLORS.blue}
          style={{
            fontFamily,
            fontSize: 15,
            lineHeight: 1.6,
            color: COLORS.white,
          }}
        />
      </div>

      {/* AI Suggestion bubble */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          right: 16,
          left: 80,
          padding: 14,
          background: COLORS.blue,
          borderRadius: '16px 16px 4px 16px',
          transform: `translateY(${interpolate(suggestionReveal, [0, 1], [20, 0])}px) scale(${suggestionReveal})`,
          opacity: suggestionReveal,
        }}
      >
        <div style={{ fontFamily, fontSize: 12, fontWeight: 600, color: COLORS.white, marginBottom: 4 }}>
          AI Suggestion:
        </div>
        <div style={{ fontFamily, fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
          "The first line is good, but let's make it punchier for mobile."
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <span style={{ fontFamily, fontSize: 10, color: COLORS.gray400 }}>CHARACTER COUNT</span>
          <div style={{ fontFamily, fontSize: 13, color: COLORS.green }}>452 / 3000</div>
        </div>
        <div
          style={{
            padding: '10px 24px',
            background: COLORS.blue,
            borderRadius: 20,
            fontFamily,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.white,
          }}
        >
          Next
        </div>
      </div>
    </div>
  );
};
