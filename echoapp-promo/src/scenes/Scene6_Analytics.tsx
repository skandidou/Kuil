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

export const Scene6_Analytics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animations
  const labelProgress = spring({ frame, fps, config: SPRING.snappy });
  const titleProgress = spring({ frame: frame - 10, fps, config: SPRING.smooth });

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
        {/* Left: Two phones */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <PremiumPhone
            screenImage="screen-analytics.png"
            delay={10}
            scale={0.9}
            x={-80}
            y={30}
            rotateY={12}
          />
          <PremiumPhone
            screenImage="screen-dashboard.png"
            delay={25}
            scale={1}
            x={80}
            y={-30}
            rotateY={-5}
          />
        </div>

        {/* Right: Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 28,
            maxWidth: 550,
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
              color: COLORS.purple,
              transform: `translateY(${interpolate(labelProgress, [0, 1], [20, 0])}px)`,
              opacity: interpolate(labelProgress, [0, 1], [0, 1]),
            }}
          >
            Analytics
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
            Track your
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.blue} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Growth
            </span>
          </h2>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              width: '100%',
              marginTop: 20,
            }}
          >
            <StatCard
              value={78}
              label="Visibility Score"
              color={COLORS.blue}
              delay={40}
            />
            <StatCard
              value={102}
              suffix="%"
              label="Growth"
              color={COLORS.green}
              delay={48}
            />
            <StatCard
              value={82}
              suffix="%"
              label="Outperforming"
              color={COLORS.purple}
              delay={56}
            />
            <StatCard
              value={3.2}
              suffix="x"
              label="Engagement"
              color={COLORS.orange}
              delay={64}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type StatCardProps = {
  value: number;
  suffix?: string;
  label: string;
  color: string;
  delay: number;
};

const StatCard: React.FC<StatCardProps> = ({
  value,
  suffix = '',
  label,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: SPRING.bouncy });
  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const animatedValue = interpolate(progress, [0, 1], [0, value]);

  const displayValue = suffix === '%' || suffix === 'x'
    ? animatedValue.toFixed(1)
    : Math.round(animatedValue);

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 40,
            fontWeight: 700,
            color,
          }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 24,
              fontWeight: 600,
              color,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.gray300,
        }}
      >
        {label}
      </span>
    </div>
  );
};
