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
import { AnimatedBadge } from '../components/AnimatedText';
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Calendar day cell
const CalendarDay: React.FC<{
  day: number;
  hasPost: boolean;
  isToday: boolean;
  postTime?: string;
  delay: number;
}> = ({ day, hasPost, isToday, postTime, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.snappy,
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  // Pulse effect for posts
  const postPulse = hasPost
    ? interpolate(Math.sin((frame - delay) * 0.1), [-1, 1], [0.8, 1])
    : 1;

  return (
    <div
      style={{
        width: 100,
        height: 90,
        borderRadius: 12,
        backgroundColor: isToday
          ? `${COLORS.primary}30`
          : hasPost
          ? `${COLORS.neonGreen}15`
          : `${COLORS.gray700}20`,
        border: `1px solid ${
          isToday ? COLORS.primary : hasPost ? COLORS.neonGreen : COLORS.gray500
        }40`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transform: `scale(${scale})`,
        opacity,
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 20,
          fontWeight: isToday ? 700 : 500,
          color: isToday ? COLORS.primary : COLORS.white,
        }}
      >
        {day}
      </span>

      {hasPost && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transform: `scale(${postPulse})`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: COLORS.neonGreen,
              boxShadow: `0 0 10px ${COLORS.neonGreen}`,
            }}
          />
          <span
            style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.neonGreen,
            }}
          >
            {postTime}
          </span>
        </div>
      )}

      {/* LinkedIn icon for scheduled posts */}
      {hasPost && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: COLORS.linkedin,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.white,
          }}
        >
          in
        </div>
      )}
    </div>
  );
};

// Mini post preview
const ScheduledPostPreview: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING.bouncy,
  });

  const x = interpolate(progress, [0, 1], [100, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: 300,
        padding: 20,
        backgroundColor: `${COLORS.gray700}30`,
        borderRadius: 16,
        border: `1px solid ${COLORS.gray500}40`,
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.gray300,
          }}
        >
          Programmé pour Mardi 9h00
        </span>
        <div
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            backgroundColor: `${COLORS.neonGreen}20`,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.neonGreen,
            }}
          >
            Prêt
          </span>
        </div>
      </div>

      {/* Post content preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[80, 100, 60, 90, 50].map((width, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: `${width}%`,
              backgroundColor: `${COLORS.gray300}20`,
              borderRadius: 3,
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
        }}
      >
        {['Modifier', 'Poster maintenant'].map((action, i) => (
          <span
            key={i}
            style={{
              fontFamily,
              fontSize: 12,
              fontWeight: 500,
              color: i === 1 ? COLORS.primary : COLORS.gray300,
            }}
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Scene5_Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calendar data
  const calendarDays = [
    { day: 27, hasPost: false },
    { day: 28, hasPost: true, postTime: '9:00' },
    { day: 29, hasPost: false },
    { day: 30, hasPost: true, postTime: '12:00', isToday: true },
    { day: 31, hasPost: true, postTime: '9:00' },
    { day: 1, hasPost: false },
    { day: 2, hasPost: true, postTime: '18:00' },
  ];

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
          padding: '0 100px',
          opacity: exitOpacity,
        }}
      >
        {/* Left - Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
            maxWidth: 450,
          }}
        >
          <AnimatedBadge text="Content Calendar" delay={0} color={COLORS.neonGreen} />

          <h2
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.white,
              lineHeight: 1.15,
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
            Programmez,{'\n'}
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.neonGreen}, ${COLORS.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              publiez, dominez
            </span>
          </h2>

          <p
            style={{
              fontFamily,
              fontSize: 18,
              fontWeight: 400,
              color: COLORS.gray300,
              lineHeight: 1.6,
              margin: 0,
              opacity: interpolate(
                spring({ frame: frame - 25, fps, config: SPRING.smooth }),
                [0, 1],
                [0, 1]
              ),
            }}
          >
            Planifiez votre semaine en avance. Kuil publie automatiquement
            aux heures optimales pour votre audience.
          </p>

          {/* Scheduled post preview */}
          <ScheduledPostPreview delay={50} />
        </div>

        {/* Right - Calendar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Week days header */}
          <div style={{ display: 'flex', gap: 8 }}>
            {weekDays.map((day, i) => {
              const headerProgress = spring({
                frame: frame - 10 - i * 2,
                fps,
                config: SPRING.snappy,
              });

              return (
                <div
                  key={day}
                  style={{
                    width: 100,
                    textAlign: 'center',
                    fontFamily,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.gray300,
                    opacity: interpolate(headerProgress, [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(headerProgress, [0, 1], [-10, 0])}px)`,
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'flex', gap: 8 }}>
            {calendarDays.map((dayData, i) => (
              <CalendarDay
                key={i}
                day={dayData.day}
                hasPost={dayData.hasPost}
                isToday={dayData.isToday || false}
                postTime={dayData.postTime}
                delay={25 + i * 5}
              />
            ))}
          </div>

          {/* Connection line animation */}
          <div
            style={{
              position: 'relative',
              height: 40,
              marginTop: 10,
            }}
          >
            {[1, 2, 4, 6].map((idx, i) => {
              const lineProgress = spring({
                frame: frame - 60 - i * 8,
                fps,
                config: SPRING.smooth,
              });

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: idx * 108 + 50,
                    top: 0,
                    width: 2,
                    height: `${interpolate(lineProgress, [0, 1], [0, 100])}%`,
                    backgroundColor: COLORS.neonGreen,
                    borderRadius: 1,
                    boxShadow: `0 0 10px ${COLORS.neonGreen}`,
                  }}
                />
              );
            })}

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 108 + 50,
                width: `${interpolate(
                  spring({ frame: frame - 80, fps, config: SPRING.smooth }),
                  [0, 1],
                  [0, 540]
                )}px`,
                height: 2,
                backgroundColor: COLORS.neonGreen,
                borderRadius: 1,
                boxShadow: `0 0 10px ${COLORS.neonGreen}`,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
