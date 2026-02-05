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

export const Scene4_Editor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animations
  const labelProgress = spring({ frame, fps, config: SPRING.snappy });
  const titleProgress = spring({ frame: frame - 10, fps, config: SPRING.smooth });
  const descProgress = spring({ frame: frame - 25, fps, config: SPRING.smooth });
  const scoreProgress = spring({ frame: frame - 50, fps, config: SPRING.bouncy });

  // Animated score value
  const scoreValue = interpolate(scoreProgress, [0, 1], [0, 85]);

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
        {/* Left: Phone */}
        <div style={{ position: 'relative' }}>
          <PremiumPhone
            screenImage="screen-editor.png"
            delay={15}
            scale={1.05}
            rotateY={8}
          />
        </div>

        {/* Right: Text content */}
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
              color: COLORS.green,
              transform: `translateY(${interpolate(labelProgress, [0, 1], [20, 0])}px)`,
              opacity: interpolate(labelProgress, [0, 1], [0, 1]),
            }}
          >
            Smart Editor
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
            Our AI rates your post's engagement potential in real-time.
            Get smart suggestions to make every hook irresistible.
          </p>

          {/* Score display */}
          <div
            style={{
              width: '100%',
              padding: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginTop: 20,
              transform: `scale(${interpolate(scoreProgress, [0, 1], [0.9, 1])})`,
              opacity: interpolate(scoreProgress, [0, 1], [0, 1]),
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 18,
                  fontWeight: 500,
                  color: COLORS.white,
                }}
              >
                Hook Score
              </span>
              <span
                style={{
                  fontFamily,
                  fontSize: 48,
                  fontWeight: 700,
                  color: COLORS.green,
                }}
              >
                {Math.round(scoreValue)}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${scoreValue}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${COLORS.green} 0%, ${COLORS.teal} 100%)`,
                  borderRadius: 4,
                  boxShadow: `0 0 30px ${COLORS.green}50`,
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
              }}
            >
              <span style={{ fontSize: 18 }}>✓</span>
              <span
                style={{
                  fontFamily,
                  fontSize: 15,
                  color: COLORS.gray300,
                }}
              >
                Great! Your hook is engaging.
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
