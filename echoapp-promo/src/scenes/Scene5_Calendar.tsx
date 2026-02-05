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

export const Scene5_Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animations
  const labelProgress = spring({ frame, fps, config: SPRING.snappy });
  const titleProgress = spring({ frame: frame - 10, fps, config: SPRING.smooth });
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
              color: COLORS.orange,
              transform: `translateY(${interpolate(labelProgress, [0, 1], [20, 0])}px)`,
              opacity: interpolate(labelProgress, [0, 1], [0, 1]),
            }}
          >
            Content Calendar
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
            Schedule at the
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.pink} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Perfect Time
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
            AI analyzes your audience's activity to suggest optimal posting times.
            Plan weeks ahead and publish with one tap.
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 20,
            }}
          >
            <FeaturePill text="Smart Scheduling" delay={45} />
            <FeaturePill text="Direct Publish" delay={52} />
            <FeaturePill text="Analytics" delay={59} />
          </div>
        </div>

        {/* Right: Phone */}
        <div style={{ position: 'relative' }}>
          <PremiumPhone
            screenImage="screen-calendar.png"
            delay={15}
            scale={1.05}
            rotateY={-8}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type FeaturePillProps = {
  text: string;
  delay: number;
};

const FeaturePill: React.FC<FeaturePillProps> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: SPRING.bouncy });
  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        color: COLORS.white,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 24px',
        borderRadius: 100,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {text}
    </div>
  );
};
