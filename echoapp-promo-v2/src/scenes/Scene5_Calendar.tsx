import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { Background } from '../components/Background';
import { PhoneMockup, FloatingParticles, GlowOrb } from '../components/PhoneMockup';
import { fontFamily } from '../components/Typography';
import { COLORS, SAFE_AREA } from '../constants';

// =============================================================================
// SCENE 5: CONTENT CALENDAR - Based on real app UI
// Week view with scheduled posts, optimal time suggestion
// =============================================================================

export const Scene5_Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Text animations
  const labelReveal = spring({
    frame: frame - 5,
    fps,
    config: { damping: 30, stiffness: 90, mass: 1 },
  });

  const titleReveal = spring({
    frame: frame - 20,
    fps,
    config: { damping: 28, stiffness: 80, mass: 1.1 },
  });

  const descReveal = spring({
    frame: frame - 40,
    fps,
    config: { damping: 30, stiffness: 85, mass: 1 },
  });

  // Exit
  const exitStart = durationInFrames - 30;
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Background spotlight={true} spotlightIntensity={0.18} />

      <FloatingParticles count={20} color={COLORS.orange} opacity={0.35} />
      <GlowOrb color={COLORS.orange} size={300} x="25%" y="70%" pulseSpeed={0.02} />
      <GlowOrb color={COLORS.pink} size={280} x="75%" y="40%" pulseSpeed={0.018} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: SAFE_AREA.top + 40,
          paddingLeft: SAFE_AREA.horizontal,
          paddingRight: SAFE_AREA.horizontal,
          paddingBottom: SAFE_AREA.bottom,
          opacity: 1 - exitProgress,
          transform: `scale(${1 - exitProgress * 0.05}) translateY(${-exitProgress * 40}px)`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <span
            style={{
              fontFamily,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: COLORS.orange,
              transform: `translateY(${interpolate(labelReveal, [0, 1], [20, 0])}px)`,
              opacity: labelReveal,
              filter: `blur(${interpolate(labelReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            Content Calendar
          </span>

          <h2
            style={{
              fontFamily,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              color: COLORS.white,
              margin: 0,
              textAlign: 'center',
              transform: `translateY(${interpolate(titleReveal, [0, 1], [30, 0])}px)`,
              opacity: titleReveal,
              filter: `blur(${interpolate(titleReveal, [0, 1], [6, 0])}px)`,
            }}
          >
            Schedule at the
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.pink} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Perfect Time
            </span>
          </h2>

          <p
            style={{
              fontFamily,
              fontSize: 16,
              fontWeight: 400,
              color: COLORS.gray300,
              margin: 0,
              textAlign: 'center',
              maxWidth: 340,
              transform: `translateY(${interpolate(descReveal, [0, 1], [20, 0])}px)`,
              opacity: descReveal,
              filter: `blur(${interpolate(descReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            AI suggests optimal posting times for your audience.
          </p>
        </div>

        {/* Phone with real app UI */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneMockup delay={30} scale={0.85} rotateY={0} rotateX={0}>
            <ContentCalendarScreen />
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Real app Content Calendar screen
const ContentCalendarScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const days = [
    { name: 'MON', num: 23 },
    { name: 'TUE', num: 24 },
    { name: 'WED', num: 25, isSelected: true },
    { name: 'THU', num: 26 },
    { name: 'FRI', num: 27 },
    { name: 'SAT', num: 28 },
  ];

  return (
    <div
      style={{
        padding: '55px 16px 16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <div>
            <div style={{ fontFamily, fontSize: 16, fontWeight: 600, color: COLORS.white }}>Content Calendar</div>
            <div style={{ fontFamily, fontSize: 11, color: COLORS.gray400 }}>October 2023</div>
          </div>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: COLORS.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: COLORS.white,
          }}
        >
          +
        </div>
      </div>

      {/* Week days */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {days.map((day, i) => (
          <WeekDay key={i} day={day} delay={50 + i * 8} />
        ))}
      </div>

      {/* Suggest Optimal Time button */}
      <SuggestOptimalButton delay={100} />

      {/* Timeline posts */}
      <div style={{ flex: 1, marginTop: 16 }}>
        <TimelinePost
          time="09:00 AM"
          status="SCHEDULED"
          statusColor={COLORS.green}
          title="How AI is changing the landscape for founders in 2024. The shift fro..."
          avatar="🧑‍💼"
          subtitle="Linked to personal profile"
          delay={120}
        />

        <HighEngagementSlot delay={145} />

        <TimelinePost
          time="02:30 PM"
          status="DRAFT"
          statusColor={COLORS.gray400}
          title="3 tips for building a personal brand on LinkedIn without burning out fro..."
          isGray={true}
          delay={165}
        />

        <TimelinePost
          time="06:00 PM"
          status="PUBLISHED"
          statusColor={COLORS.green}
          title="Why consistency is the key to..."
          stats={{ likes: 124, comments: 18 }}
          delay={185}
        />
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
};

const WeekDay: React.FC<{ day: { name: string; num: number; isSelected?: boolean }; delay: number }> = ({
  day,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 100, mass: 0.8 },
  });

  return (
    <div
      style={{
        flex: 1,
        padding: '10px 0',
        borderRadius: 12,
        background: day.isSelected ? COLORS.blue : 'rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
        opacity: progress,
      }}
    >
      <span style={{ fontFamily, fontSize: 9, color: day.isSelected ? COLORS.white : COLORS.gray400 }}>
        {day.name}
      </span>
      <span
        style={{
          fontFamily,
          fontSize: 16,
          fontWeight: 600,
          color: day.isSelected ? COLORS.white : COLORS.gray300,
        }}
      >
        {day.num}
      </span>
      {day.isSelected && (
        <div style={{ width: 4, height: 4, borderRadius: 2, background: COLORS.white }} />
      )}
    </div>
  );
};

const SuggestOptimalButton: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        padding: '14px 20px',
        background: `linear-gradient(135deg, ${COLORS.orange}20, ${COLORS.yellow}20)`,
        borderRadius: 12,
        border: `1px solid ${COLORS.orange}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transform: `translateY(${interpolate(progress, [0, 1], [10, 0])}px)`,
        opacity: progress,
      }}
    >
      <span style={{ fontSize: 12 }}>✦</span>
      <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.orange }}>
        Suggest Optimal Time
      </span>
    </div>
  );
};

const TimelinePost: React.FC<{
  time: string;
  status: string;
  statusColor: string;
  title: string;
  avatar?: string;
  subtitle?: string;
  stats?: { likes: number; comments: number };
  isGray?: boolean;
  delay: number;
}> = ({ time, status, statusColor, title, avatar, subtitle, stats, isGray, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
        opacity: progress,
      }}
    >
      <div style={{ fontFamily, fontSize: 11, color: COLORS.gray400, width: 55, flexShrink: 0 }}>{time}</div>
      <div
        style={{
          flex: 1,
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily, fontSize: 10, fontWeight: 600, color: statusColor }}>{status}</span>
          {stats && <span style={{ fontSize: 12 }}>👁</span>}
          {!stats && <span style={{ fontSize: 12 }}>⋮</span>}
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 13,
            color: isGray ? COLORS.gray400 : COLORS.white,
            lineHeight: 1.4,
            marginBottom: subtitle || stats ? 8 : 0,
          }}
        >
          {title}
        </div>
        {avatar && subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{avatar}</span>
            <span style={{ fontFamily, fontSize: 10, color: COLORS.gray400 }}>{subtitle}</span>
          </div>
        )}
        {stats && (
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily, fontSize: 11, color: COLORS.green }}>❤️ {stats.likes}</span>
            <span style={{ fontFamily, fontSize: 11, color: COLORS.gray400 }}>💬 {stats.comments}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const HighEngagementSlot: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  const pulse = 1 + Math.sin(frame * 0.1) * 0.02;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px) scale(${pulse})`,
        opacity: progress,
      }}
    >
      <div style={{ fontFamily, fontSize: 11, color: COLORS.gray400, width: 55, flexShrink: 0 }}>12:00 PM</div>
      <div
        style={{
          flex: 1,
          padding: 16,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          border: `1px dashed ${COLORS.orange}50`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 16 }}>⭐</span>
        <span style={{ fontFamily, fontSize: 12, fontWeight: 600, color: COLORS.orange }}>
          HIGH ENGAGEMENT SLOT
        </span>
      </div>
    </div>
  );
};

const BottomNav: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {[
      { icon: '🏠', label: 'Home' },
      { icon: '📅', label: 'Calendar', active: true },
      { icon: '✍️', label: 'AI Writer' },
      { icon: '📊', label: 'Analytics' },
      { icon: '⚙️', label: 'Settings' },
    ].map((item, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 16, opacity: item.active ? 1 : 0.5 }}>{item.icon}</span>
        <span
          style={{
            fontFamily,
            fontSize: 9,
            color: item.active ? COLORS.blue : COLORS.gray400,
          }}
        >
          {item.label}
        </span>
      </div>
    ))}
  </div>
);
