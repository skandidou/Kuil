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

export const AnalyticsScene: React.FC = () => {
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

  // Stats animation
  const statsProgress = spring({
    frame: frame - 30,
    fps,
    config: SPRING_BOUNCY,
  });

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
        {/* Left side - Feature explanation */}
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
            Analytics & Insights
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
            Track Your{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.primaryStart} 0%, ${COLORS.primaryEnd} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Growth
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
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
            }}
          >
            Get personalized insights about your content performance.
            Understand what resonates with your audience.
          </p>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20,
              marginTop: 20,
              width: '100%',
            }}
          >
            <StatCard
              value={78}
              suffix=""
              label="Visibility Score"
              color={COLORS.primaryStart}
              delay={40}
            />
            <StatCard
              value={102}
              suffix="%"
              label="Potential Growth"
              color="#4ADE80"
              delay={50}
            />
            <StatCard
              value={82}
              suffix="%"
              label="Outperforming Peers"
              color={COLORS.accent}
              delay={60}
            />
            <StatCard
              value={3.2}
              suffix="x"
              label="Engagement Boost"
              color={COLORS.accentAlt}
              delay={70}
            />
          </div>
        </div>

        {/* Right side - Phone with Analytics screen */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Two phones showing different screens */}
          <PhoneMockup
            screenImage="screen-analytics.png"
            delay={20}
            scale={0.95}
            x={-100}
            y={30}
            rotation={-5}
            animationType="slide-up"
          />
          <PhoneMockup
            screenImage="screen-dashboard.png"
            delay={35}
            scale={1.05}
            x={100}
            y={-30}
            rotation={5}
            animationType="slide-up"
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type StatCardProps = {
  value: number;
  suffix: string;
  label: string;
  color: string;
  delay: number;
};

const StatCard: React.FC<StatCardProps> = ({
  value,
  suffix,
  label,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_BOUNCY,
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const animatedValue = interpolate(progress, [0, 1], [0, value]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 42,
            fontWeight: 800,
            color,
          }}
        >
          {suffix === '%' || suffix === 'x'
            ? animatedValue.toFixed(1)
            : Math.round(animatedValue)}
        </span>
        <span
          style={{
            fontFamily,
            fontSize: 24,
            fontWeight: 700,
            color,
          }}
        >
          {suffix}
        </span>
      </div>
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.gray,
        }}
      >
        {label}
      </span>
    </div>
  );
};
