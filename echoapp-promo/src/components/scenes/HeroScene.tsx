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
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: SPRING_BOUNCY,
  });

  const logoScale = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // Title animation
  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: SPRING_SMOOTH,
  });

  const titleY = interpolate(titleProgress, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - 30,
    fps,
    config: SPRING_SMOOTH,
  });

  const taglineY = interpolate(taglineProgress, [0, 1], [40, 0]);
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);

  // Phone animation
  const phoneProgress = spring({
    frame: frame - 45,
    fps,
    config: SPRING_SMOOTH,
  });

  const phoneY = interpolate(phoneProgress, [0, 1], [150, 0]);
  const phoneOpacity = interpolate(phoneProgress, [0, 1], [0, 1]);
  const phoneScale = interpolate(phoneProgress, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill>
      <Background variant="gradient" />

      {/* Content container */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 120px',
        }}
      >
        {/* Left side - Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: 800,
            gap: 30,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            {/* Logo icon - stylized lines representing content */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${COLORS.primaryStart} 0%, ${COLORS.primaryEnd} 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                padding: 12,
              }}
            >
              <div style={{ width: 28, height: 4, backgroundColor: COLORS.white, borderRadius: 2 }} />
              <div style={{ width: 20, height: 4, backgroundColor: COLORS.white, borderRadius: 2, opacity: 0.7 }} />
              <div style={{ width: 24, height: 4, backgroundColor: COLORS.white, borderRadius: 2, opacity: 0.5 }} />
            </div>
            <span
              style={{
                fontFamily,
                fontSize: 32,
                fontWeight: 700,
                color: COLORS.white,
                letterSpacing: '-0.5px',
              }}
            >
              SpecterInk
            </span>
          </div>

          {/* Main title */}
          <h1
            style={{
              fontFamily,
              fontSize: 72,
              fontWeight: 800,
              color: COLORS.white,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              margin: 0,
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
            }}
          >
            Your LinkedIn Voice,{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.primaryStart} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Amplified
            </span>
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily,
              fontSize: 26,
              fontWeight: 400,
              color: COLORS.gray,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 600,
              transform: `translateY(${taglineY}px)`,
              opacity: taglineOpacity,
            }}
          >
            The AI ghostwriter for elite founders and industry experts.
            Write posts that sound like you — powered by AI that learns your voice.
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 20,
              transform: `translateY(${taglineY}px)`,
              opacity: taglineOpacity,
            }}
          >
            <FeatureBadge text="Voice Analysis" delay={50} />
            <FeatureBadge text="AI Generation" delay={55} />
            <FeatureBadge text="Hook Scoring" delay={60} />
          </div>
        </div>

        {/* Right side - Phone mockup */}
        <div
          style={{
            position: 'relative',
            transform: `translateY(${phoneY}px) scale(${phoneScale})`,
            opacity: phoneOpacity,
          }}
        >
          <PhoneMockup
            screenImage="screen-welcome.png"
            delay={0}
            scale={1.1}
            animationType="float"
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type FeatureBadgeProps = {
  text: string;
  delay: number;
};

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_BOUNCY,
  });

  const scale = interpolate(progress, [0, 1], [0, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontFamily,
        fontSize: 14,
        fontWeight: 600,
        color: COLORS.white,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: `1px solid rgba(255, 255, 255, 0.2)`,
        padding: '10px 20px',
        borderRadius: 30,
        transform: `scale(${scale})`,
        opacity,
        backdropFilter: 'blur(10px)',
      }}
    >
      {text}
    </div>
  );
};
