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
import { PremiumPhone } from '../components/PremiumPhone';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export const Scene3_VoiceFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Label animation
  const labelProgress = spring({ frame, fps, config: SPRING.snappy });

  // Title animation
  const titleProgress = spring({ frame: frame - 10, fps, config: SPRING.smooth });

  // Description animation
  const descProgress = spring({ frame: frame - 25, fps, config: SPRING.smooth });

  // Exit
  const exitStart = durationInFrames - 25;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  const exitOpacity = 1 - exitProgress;

  return (
    <AbsoluteFill>
      <AppleBackground />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 140px',
          opacity: exitOpacity,
        }}
      >
        {/* Left: Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 28,
            maxWidth: 650,
          }}
        >
          {/* Label */}
          <span
            style={{
              fontFamily,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: COLORS.blue,
              transform: `translateY(${interpolate(labelProgress, [0, 1], [20, 0])}px)`,
              opacity: interpolate(labelProgress, [0, 1], [0, 1]),
            }}
          >
            AI Voice Analysis
          </span>

          {/* Title */}
          <h2
            style={{
              fontFamily,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-2px',
              lineHeight: 1.1,
              color: COLORS.white,
              margin: 0,
              transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
              opacity: interpolate(titleProgress, [0, 1], [0, 1]),
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

          {/* Description */}
          <p
            style={{
              fontFamily,
              fontSize: 22,
              fontWeight: 400,
              lineHeight: 1.6,
              color: COLORS.gray300,
              margin: 0,
              transform: `translateY(${interpolate(descProgress, [0, 1], [30, 0])}px)`,
              opacity: interpolate(descProgress, [0, 1], [0, 1]),
            }}
          >
            We analyze your LinkedIn history to understand your writing style
            across 5 dimensions. Every post we generate sounds authentically like you.
          </p>

          {/* Voice bars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              marginTop: 20,
            }}
          >
            <VoiceBar label="Analytical" value={92} color={COLORS.blue} delay={40} />
            <VoiceBar label="Formal" value={75} color={COLORS.purple} delay={48} />
            <VoiceBar label="Empathetic" value={68} color={COLORS.teal} delay={56} />
            <VoiceBar label="Bold" value={85} color={COLORS.pink} delay={64} />
          </div>
        </div>

        {/* Right: Phone */}
        <div style={{ position: 'relative' }}>
          <PremiumPhone
            screenImage="screen-voice.png"
            delay={15}
            scale={1.05}
            rotateY={-8}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type VoiceBarProps = {
  label: string;
  value: number;
  color: string;
  delay: number;
};

const VoiceBar: React.FC<VoiceBarProps> = ({ label, value, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: SPRING.smooth });
  const barWidth = interpolate(progress, [0, 1], [0, value]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.gray300,
          width: 90,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
            boxShadow: `0 0 20px ${color}60`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          color,
          width: 40,
          textAlign: 'right',
        }}
      >
        {Math.round(barWidth)}%
      </span>
    </div>
  );
};
