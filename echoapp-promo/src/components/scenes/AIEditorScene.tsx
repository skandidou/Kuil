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

export const AIEditorScene: React.FC = () => {
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

  // Hook score animation
  const scoreProgress = spring({
    frame: frame - 40,
    fps,
    config: SPRING_BOUNCY,
  });

  const scoreValue = interpolate(scoreProgress, [0, 1], [0, 85]);

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
            Smart Editor
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
            Write Posts That{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.accentAlt} 0%, ${COLORS.primaryEnd} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Get Noticed
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
            Our Hook Scorer rates your post's engagement potential in real-time.
            Get AI suggestions to make your content more compelling.
          </p>

          {/* Hook Score Display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              marginTop: 30,
              padding: 30,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 18,
                  fontWeight: 600,
                  color: COLORS.white,
                }}
              >
                Hook Score
              </span>
              <span
                style={{
                  fontFamily,
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#4ADE80',
                }}
              >
                {Math.round(scoreValue)}/100
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${scoreValue}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)',
                  borderRadius: 6,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#4ADE80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: COLORS.dark, fontSize: 12 }}>✓</span>
              </div>
              <span
                style={{
                  fontFamily,
                  fontSize: 14,
                  color: COLORS.gray,
                }}
              >
                Great! Your hook is engaging.
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Phone with Editor screen */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneMockup
            screenImage="screen-editor.png"
            delay={20}
            scale={1.1}
            x={0}
            y={0}
            animationType="slide-up"
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
