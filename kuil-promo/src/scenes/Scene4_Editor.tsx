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
import { AnimatedBadge, AnimatedCounter } from '../components/AnimatedText';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Animated post variant card
const PostVariantCard: React.FC<{
  variant: 'short' | 'story' | 'educational';
  hookScore: number;
  delay: number;
  selected: boolean;
}> = ({ variant, hookScore, delay, selected }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const variantConfig = {
    short: {
      title: 'Court & Punchy',
      icon: '⚡',
      color: COLORS.neonPink,
      lines: 3,
    },
    story: {
      title: 'Storytelling',
      icon: '📖',
      color: COLORS.neonPurple,
      lines: 6,
    },
    educational: {
      title: 'Éducatif',
      icon: '💡',
      color: COLORS.accent,
      lines: 5,
    },
  };

  const config = variantConfig[variant];

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.bouncy,
  });

  const y = interpolate(progress, [0, 1], [60, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  // Selection glow pulse
  const glowPulse = selected
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.6])
    : 0;

  return (
    <div
      style={{
        width: 280,
        padding: 24,
        backgroundColor: selected ? `${config.color}15` : `${COLORS.gray700}20`,
        borderRadius: 20,
        border: `2px solid ${selected ? config.color : COLORS.gray500}40`,
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: selected
          ? `0 0 40px ${config.color}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')}`
          : 'none',
      }}
    >
      {/* Selection indicator */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ✓
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 28 }}>{config.icon}</span>
        <span
          style={{
            fontFamily,
            fontSize: 16,
            fontWeight: 700,
            color: config.color,
          }}
        >
          {config.title}
        </span>
      </div>

      {/* Fake text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: config.lines }).map((_, i) => {
          const lineProgress = spring({
            frame: frame - delay - 10 - i * 3,
            fps,
            config: SPRING.snappy,
          });
          const lineWidth = 40 + Math.random() * 50;

          return (
            <div
              key={i}
              style={{
                height: 8,
                width: `${lineWidth}%`,
                backgroundColor: `${COLORS.gray300}30`,
                borderRadius: 4,
                opacity: interpolate(lineProgress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(lineProgress, [0, 1], [20, 0])}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Hook score */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.gray300,
          }}
        >
          Hook Score
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 80,
              height: 6,
              backgroundColor: `${COLORS.gray500}30`,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${interpolate(
                  spring({ frame: frame - delay - 30, fps, config: SPRING.smooth }),
                  [0, 1],
                  [0, hookScore]
                )}%`,
                height: '100%',
                backgroundColor:
                  hookScore > 80 ? COLORS.neonGreen : hookScore > 60 ? COLORS.primary : COLORS.neonPink,
                borderRadius: 3,
              }}
            />
          </div>
          <span
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 700,
              color: hookScore > 80 ? COLORS.neonGreen : hookScore > 60 ? COLORS.primary : COLORS.neonPink,
            }}
          >
            {Math.round(
              interpolate(
                spring({ frame: frame - delay - 30, fps, config: SPRING.smooth }),
                [0, 1],
                [0, hookScore]
              )
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export const Scene4_Editor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Selection animation - switches between cards
  const selectedIndex = Math.floor(frame / 50) % 3;

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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
          padding: '0 80px',
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <AnimatedBadge text="AI Editor" delay={0} color={COLORS.neonPurple} />

          <h2
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.white,
              textAlign: 'center',
              margin: 0,
              letterSpacing: '-1px',
              opacity: interpolate(
                spring({ frame: frame - 10, fps, config: SPRING.smooth }),
                [0, 1],
                [0, 1]
              ),
              transform: `translateY(${interpolate(
                spring({ frame: frame - 10, fps, config: SPRING.smooth }),
                [0, 1],
                [30, 0]
              )}px)`,
            }}
          >
            3 variantes,{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.neonBlue}, ${COLORS.neonPurple})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              un clic
            </span>
          </h2>

          <p
            style={{
              fontFamily,
              fontSize: 20,
              fontWeight: 400,
              color: COLORS.gray300,
              textAlign: 'center',
              margin: 0,
              maxWidth: 600,
              opacity: interpolate(
                spring({ frame: frame - 25, fps, config: SPRING.smooth }),
                [0, 1],
                [0, 1]
              ),
            }}
          >
            Pour chaque sujet, Kuil génère 3 styles différents.
            Le score de hook prédit l'engagement.
          </p>
        </div>

        {/* Post variant cards */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            alignItems: 'center',
          }}
        >
          <PostVariantCard
            variant="short"
            hookScore={87}
            delay={30}
            selected={selectedIndex === 0}
          />
          <PostVariantCard
            variant="story"
            hookScore={92}
            delay={40}
            selected={selectedIndex === 1}
          />
          <PostVariantCard
            variant="educational"
            hookScore={78}
            delay={50}
            selected={selectedIndex === 2}
          />
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 80,
            marginTop: 20,
          }}
        >
          {[
            { label: 'Temps économisé', value: 85, suffix: '%' },
            { label: 'Posts générés', value: 10000, suffix: '+' },
            { label: 'Engagement moyen', value: 340, suffix: '%' },
          ].map((stat, i) => {
            const statProgress = spring({
              frame: frame - 70 - i * 10,
              fps,
              config: SPRING.smooth,
            });

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  opacity: interpolate(statProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(statProgress, [0, 1], [20, 0])}px)`,
                }}
              >
                <AnimatedCounter
                  from={0}
                  to={stat.value}
                  delay={70 + i * 10}
                  duration={40}
                  fontSize={40}
                  suffix={stat.suffix}
                  color={COLORS.white}
                />
                <span
                  style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 500,
                    color: COLORS.gray300,
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
