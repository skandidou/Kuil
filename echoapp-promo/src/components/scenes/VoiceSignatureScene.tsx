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
import { PhoneMockup } from '../PhoneMockup';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const VoiceSignatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: SPRING_SMOOTH,
  });

  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Description animation
  const descProgress = spring({
    frame: frame - 15,
    fps,
    config: SPRING_SMOOTH,
  });

  const descY = interpolate(descProgress, [0, 1], [30, 0]);
  const descOpacity = interpolate(descProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      <Background variant="gradient" />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 120px',
        }}
      >
        {/* Left side - Phone with Voice Settings screen */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneMockup
            screenImage="screen-voice.png"
            delay={20}
            scale={1.1}
            x={0}
            y={0}
            animationType="slide-up"
          />
        </div>

        {/* Right side - Feature explanation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: 700,
            gap: 30,
          }}
        >
          {/* Feature label */}
          <div
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.accent,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
            }}
          >
            AI Voice Analysis
          </div>

          {/* Title */}
          <h2
            style={{
              fontFamily,
              fontSize: 56,
              fontWeight: 800,
              color: COLORS.white,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: 0,
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
            }}
          >
            Discover Your Unique{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.primaryStart} 0%, ${COLORS.accent} 100%)`,
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
              color: COLORS.gray,
              lineHeight: 1.7,
              margin: 0,
              transform: `translateY(${descY}px)`,
              opacity: descOpacity,
            }}
          >
            Our AI analyzes your LinkedIn history to understand your writing style
            across 5 dimensions: Formal, Bold, Empathetic, Complex, and Brevity.
          </p>

          {/* Voice dimensions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 20,
              width: '100%',
            }}
          >
            <VoiceDimension
              label="Formal"
              value={75}
              color={COLORS.voiceFormal}
              delay={40}
            />
            <VoiceDimension
              label="Bold"
              value={60}
              color={COLORS.voiceBold}
              delay={45}
            />
            <VoiceDimension
              label="Empathetic"
              value={85}
              color={COLORS.voiceEmpathetic}
              delay={50}
            />
            <VoiceDimension
              label="Analytical"
              value={90}
              color={COLORS.voiceComplex}
              delay={55}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type VoiceDimensionProps = {
  label: string;
  value: number;
  color: string;
  delay: number;
};

const VoiceDimension: React.FC<VoiceDimensionProps> = ({
  label,
  value,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const barWidth = interpolate(progress, [0, 1], [0, value]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.white,
          width: 100,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 4,
            boxShadow: `0 0 20px ${color}50`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 700,
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
