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
import { PhoneMockup, MultiPhoneMockup } from '../PhoneMockup';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const ContentCalendarScene: React.FC = () => {
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
        {/* Left side - Phone with Calendar screen */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneMockup
            screenImage="screen-calendar.png"
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
            Content Calendar
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
            Schedule & Publish{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.primaryStart} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Effortlessly
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
            Plan your content strategy with our intelligent calendar.
            AI suggests optimal posting times for maximum engagement.
          </p>

          {/* Feature cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 20,
              width: '100%',
            }}
          >
            <FeatureCard
              icon="📅"
              title="Smart Scheduling"
              description="AI finds the best time to post based on your audience"
              delay={40}
            />
            <FeatureCard
              icon="🔗"
              title="LinkedIn Direct Publish"
              description="Post directly from the app with one tap"
              delay={50}
            />
            <FeatureCard
              icon="📊"
              title="Performance Tracking"
              description="See likes, comments, and impressions in real-time"
              delay={60}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  delay: number;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const x = interpolate(progress, [0, 1], [50, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.white,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily,
            fontSize: 14,
            fontWeight: 400,
            color: COLORS.gray,
          }}
        >
          {description}
        </span>
      </div>
    </div>
  );
};
