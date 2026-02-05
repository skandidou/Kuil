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
import { PhoneMockup, FloatingParticles, GlowOrb } from '../components/PhoneMockup';
import { fontFamily } from '../components/Typography';
import { COLORS, SAFE_AREA } from '../constants';

// =============================================================================
// SCENE 3: VOICE SIGNATURE - Based on real app UI
// Hexagonal radar chart with animated reveal
// =============================================================================

export const Scene3_Voice: React.FC = () => {
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
      <Background spotlight={true} spotlightIntensity={0.2} />

      <FloatingParticles count={20} color={COLORS.blue} opacity={0.3} />
      <GlowOrb color={COLORS.blue} size={350} x="25%" y="70%" pulseSpeed={0.02} />
      <GlowOrb color={COLORS.purple} size={300} x="75%" y="30%" pulseSpeed={0.015} />

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
              color: COLORS.blue,
              transform: `translateY(${interpolate(labelReveal, [0, 1], [20, 0])}px)`,
              opacity: labelReveal,
              filter: `blur(${interpolate(labelReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            AI Voice Analysis
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
            Your unique
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.teal} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Voice Signature
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
            AI analyzes your LinkedIn history to capture your voice.
          </p>
        </div>

        {/* Phone with real app UI */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneMockup delay={30} scale={0.85} rotateY={0} rotateX={0}>
            <VoiceSignatureScreen />
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Real app Voice Signature screen
const VoiceSignatureScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const radarReveal = spring({
    frame: frame - 60,
    fps,
    config: { damping: 30, stiffness: 50, mass: 1.2 },
  });

  const confidenceReveal = spring({
    frame: frame - 90,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        padding: '60px 20px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
      }}
    >
      {/* Voice Signature Card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 20,
          marginBottom: 16,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily, fontSize: 12, color: COLORS.gray400, marginBottom: 4 }}>Primary Tone</div>
            <div style={{ fontFamily, fontSize: 24, fontWeight: 700, color: COLORS.white }}>Analytical</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(52, 211, 153, 0.15)',
              borderRadius: 20,
              transform: `scale(${confidenceReveal})`,
              opacity: confidenceReveal,
            }}
          >
            <span style={{ fontFamily, fontSize: 11, color: COLORS.green }}>↗ +12% Confidence</span>
          </div>
        </div>

        {/* Hexagonal Radar Chart */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <HexagonRadar progress={radarReveal} />
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20 }}>
          <span style={{ fontFamily, fontSize: 10, color: COLORS.gray400 }}>FORMAL</span>
          <span style={{ fontFamily, fontSize: 10, color: COLORS.gray400 }}>BOLD</span>
          <span style={{ fontFamily, fontSize: 10, color: COLORS.gray400 }}>EMPATHETIC</span>
        </div>
      </div>

      {/* Re-analyze button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span style={{ fontFamily, fontSize: 14, color: COLORS.gray300 }}>↻ Re-analyze LinkedIn History</span>
      </div>
    </div>
  );
};

// Hexagonal radar chart component
const HexagonRadar: React.FC<{ progress: number }> = ({ progress }) => {
  const size = 140;
  const center = size / 2;
  const maxRadius = size / 2 - 10;

  // Create hexagon points for outer border
  const createHexPoints = (radius: number): string => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // Animated radar values (0-1 scale)
  const values = [0.85, 0.7, 0.6, 0.75, 0.65, 0.8].map(v => v * progress);

  // Create data polygon points
  const createDataPoints = (): string => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const radius = maxRadius * values[i];
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background hexagons */}
      {[1, 0.66, 0.33].map((scale, i) => (
        <polygon
          key={i}
          points={createHexPoints(maxRadius * scale)}
          fill="none"
          stroke="rgba(96, 165, 250, 0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Radial lines */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = center + maxRadius * Math.cos(angle);
        const y = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(96, 165, 250, 0.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={createDataPoints()}
        fill={`${COLORS.blue}40`}
        stroke={COLORS.blue}
        strokeWidth="2"
        style={{
          filter: `drop-shadow(0 0 10px ${COLORS.blue}60)`,
        }}
      />

      {/* Center dot */}
      <circle cx={center} cy={center} r="3" fill={COLORS.blue} />
    </svg>
  );
};
