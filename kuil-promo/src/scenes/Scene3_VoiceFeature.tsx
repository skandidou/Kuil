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
import { AnimatedBadge, GradientHeadline } from '../components/AnimatedText';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Pentagon voice signature visualization
const VoicePentagon: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dimensions = [
    { label: 'Formel', value: 75, color: COLORS.primary },
    { label: 'Bold', value: 85, color: COLORS.neonPink },
    { label: 'Empathique', value: 68, color: COLORS.accent },
    { label: 'Complexe', value: 60, color: COLORS.neonPurple },
    { label: 'Concis', value: 90, color: COLORS.neonGreen },
  ];

  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;

  // Calculate pentagon points
  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.smooth,
  });

  // Animated values
  const animatedDimensions = dimensions.map((d, i) => ({
    ...d,
    animValue: interpolate(progress, [0, 1], [0, d.value]),
  }));

  // Create path
  const pathPoints = animatedDimensions
    .map((d, i) => {
      const pt = getPoint(i, d.animValue);
      return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
    })
    .join(' ') + ' Z';

  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Rotation animation
  const rotate = interpolate(frame, [delay, delay + 300], [0, 360]);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity,
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background grid */}
        {[20, 40, 60, 80, 100].map((level) => (
          <polygon
            key={level}
            points={dimensions
              .map((_, i) => {
                const pt = getPoint(i, level);
                return `${pt.x},${pt.y}`;
              })
              .join(' ')}
            fill="none"
            stroke={COLORS.gray500}
            strokeWidth={0.5}
            opacity={0.2}
          />
        ))}

        {/* Animated fill */}
        <path
          d={pathPoints}
          fill={`${COLORS.primary}30`}
          stroke={COLORS.primary}
          strokeWidth={2}
        />

        {/* Animated dots */}
        {animatedDimensions.map((d, i) => {
          const pt = getPoint(i, d.animValue);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={6}
              fill={d.color}
              style={{
                filter: `drop-shadow(0 0 10px ${d.color})`,
              }}
            />
          );
        })}
      </svg>

      {/* Labels */}
      {dimensions.map((d, i) => {
        const pt = getPoint(i, 115);
        const labelProgress = spring({
          frame: frame - delay - 20 - i * 5,
          fps,
          config: SPRING.snappy,
        });
        const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              transform: 'translate(-50%, -50%)',
              fontFamily,
              fontSize: 11,
              fontWeight: 600,
              color: d.color,
              opacity: labelOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {d.label}
          </div>
        );
      })}
    </div>
  );
};

// Voice bar component
const VoiceBar: React.FC<{
  label: string;
  value: number;
  color: string;
  delay: number;
}> = ({ label, value, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.smooth,
  });

  const barWidth = interpolate(progress, [0, 1], [0, value]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.gray300,
          width: 100,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          backgroundColor: `${COLORS.gray500}30`,
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
            boxShadow: `0 0 20px ${color}60`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 700,
          color,
          width: 45,
          textAlign: 'right',
        }}
      >
        {Math.round(barWidth)}%
      </span>
    </div>
  );
};

export const Scene3_VoiceFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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
      <DynamicBackground />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 120px',
          opacity: exitOpacity,
        }}
      >
        {/* Left - Text content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            maxWidth: 550,
          }}
        >
          <AnimatedBadge text="Voice Signature AI" delay={0} color={COLORS.accent} />

          <GradientHeadline fontSize={56} delay={10}>
            Votre voix,{'\n'}amplifiée
          </GradientHeadline>

          <p
            style={{
              fontFamily,
              fontSize: 20,
              fontWeight: 400,
              color: COLORS.gray300,
              lineHeight: 1.6,
              margin: 0,
              opacity: interpolate(
                spring({ frame: frame - 30, fps, config: SPRING.smooth }),
                [0, 1],
                [0, 1]
              ),
              transform: `translateY(${interpolate(
                spring({ frame: frame - 30, fps, config: SPRING.smooth }),
                [0, 1],
                [20, 0]
              )}px)`,
            }}
          >
            Kuil analyse vos posts existants pour capturer votre style unique
            sur 5 dimensions. Chaque contenu généré sonne authentiquement comme vous.
          </p>

          {/* Voice bars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              marginTop: 20,
            }}
          >
            <VoiceBar label="Analytique" value={92} color={COLORS.primary} delay={50} />
            <VoiceBar label="Formel" value={75} color={COLORS.neonPurple} delay={58} />
            <VoiceBar label="Empathique" value={68} color={COLORS.accent} delay={66} />
            <VoiceBar label="Audacieux" value={85} color={COLORS.neonPink} delay={74} />
            <VoiceBar label="Concis" value={90} color={COLORS.neonGreen} delay={82} />
          </div>
        </div>

        {/* Right - Pentagon visualization */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Glow effect behind pentagon */}
          <div
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.primary}30 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />

          {/* Pentagon */}
          <div style={{ transform: 'scale(1.8)' }}>
            <VoicePentagon delay={25} />
          </div>

          {/* Orbiting particles */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (frame * 0.02 + i * 72) * (Math.PI / 180);
            const orbitRadius = 180;
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLORS.accent,
                  left: '50%',
                  top: '50%',
                  transform: `translate(${x}px, ${y}px)`,
                  boxShadow: `0 0 15px ${COLORS.accent}`,
                  opacity: 0.6,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
