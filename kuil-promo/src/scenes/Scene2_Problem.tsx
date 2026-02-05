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
import { DynamicBackground } from '../components/DynamicBackground';
import { GlitchText, TypewriterText } from '../components/AnimatedText';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Animated "struggling" post card
const StruggleCard: React.FC<{ delay: number; text: string; index: number }> = ({
  delay,
  text,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.bouncy,
  });

  const y = interpolate(progress, [0, 1], [80, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const rotate = interpolate(progress, [0, 1], [10, -3 + index * 2]);

  // Shake effect
  const shakeX = frame > delay + 30 ? Math.sin(frame * 0.3) * 2 : 0;

  return (
    <div
      style={{
        width: 320,
        padding: 24,
        backgroundColor: `${COLORS.gray700}30`,
        borderRadius: 16,
        border: `1px solid ${COLORS.gray500}40`,
        transform: `translateY(${y}px) translateX(${shakeX}px) rotate(${rotate}deg)`,
        opacity,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: COLORS.gray500,
          }}
        />
        <div>
          <div
            style={{
              width: 80,
              height: 10,
              backgroundColor: COLORS.gray500,
              borderRadius: 4,
              marginBottom: 6,
            }}
          />
          <div
            style={{
              width: 50,
              height: 8,
              backgroundColor: COLORS.gray700,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
      <p
        style={{
          fontFamily,
          fontSize: 14,
          color: COLORS.gray300,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 20,
        }}
      >
        {['Like', 'Comment'].map((action) => (
          <span
            key={action}
            style={{
              fontFamily,
              fontSize: 12,
              color: COLORS.gray500,
            }}
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Main text animation
  const textProgress = spring({
    frame,
    fps,
    config: SPRING.smooth,
  });

  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);
  const textY = interpolate(textProgress, [0, 1], [40, 0]);

  // Strike-through animation on "heures"
  const strikeProgress = spring({
    frame: frame - 60,
    fps,
    config: SPRING.snappy,
  });
  const strikeWidth = interpolate(strikeProgress, [0, 1], [0, 100]);

  // Exit
  const exitStart = durationInFrames - 20;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  const exitOpacity = 1 - exitProgress;

  return (
    <AbsoluteFill>
      <DynamicBackground variant="subtle" />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 120px',
          opacity: exitOpacity,
        }}
      >
        {/* Left side - Text */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
          }}
        >
          <h2
            style={{
              fontFamily,
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.white,
              lineHeight: 1.2,
              margin: 0,
              maxWidth: 600,
            }}
          >
            Vous passez{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: COLORS.neonPink }}>des heures</span>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${strikeWidth}%`,
                  height: 4,
                  backgroundColor: COLORS.neonPink,
                  borderRadius: 2,
                }}
              />
            </span>
            <br />
            sur vos posts LinkedIn ?
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TypewriterText
              text="Syndrome de la page blanche..."
              fontSize={20}
              delay={30}
              speed={2}
              color={COLORS.gray300}
            />
            <TypewriterText
              text="Pas d'engagement..."
              fontSize={20}
              delay={70}
              speed={2}
              color={COLORS.gray300}
            />
            <TypewriterText
              text="Votre voix se perd dans la masse..."
              fontSize={20}
              delay={110}
              speed={2}
              color={COLORS.gray300}
            />
          </div>
        </div>

        {/* Right side - Struggle cards */}
        <div
          style={{
            position: 'relative',
            width: 400,
            height: 500,
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <StruggleCard
              delay={20}
              index={0}
              text="Je ne sais pas quoi écrire aujourd'hui..."
            />
          </div>
          <div style={{ position: 'absolute', top: 140, right: 60 }}>
            <StruggleCard
              delay={35}
              index={1}
              text="Mon post n'a eu que 3 likes..."
            />
          </div>
          <div style={{ position: 'absolute', top: 280, right: 20 }}>
            <StruggleCard
              delay={50}
              index={2}
              text="L'IA génère du contenu générique..."
            />
          </div>

          {/* Red X overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 200,
              fontWeight: 900,
              color: `${COLORS.neonPink}30`,
              opacity: interpolate(
                spring({ frame: frame - 80, fps, config: SPRING.bouncy }),
                [0, 1],
                [0, 1]
              ),
            }}
          >
            ✕
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
