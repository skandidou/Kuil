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
// SCENE 6: ANALYTICS DASHBOARD - Based on real app UI
// Network Visibility Score with circular progress, Daily Inspiration cards
// =============================================================================

export const Scene6_Analytics: React.FC = () => {
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
      <Background spotlight={true} spotlightIntensity={0.2} />

      <FloatingParticles count={25} color={COLORS.purple} opacity={0.4} />
      <GlowOrb color={COLORS.purple} size={350} x="70%" y="60%" pulseSpeed={0.02} />
      <GlowOrb color={COLORS.blue} size={300} x="30%" y="35%" pulseSpeed={0.016} />

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
              color: COLORS.purple,
              transform: `translateY(${interpolate(labelReveal, [0, 1], [20, 0])}px)`,
              opacity: labelReveal,
              filter: `blur(${interpolate(labelReveal, [0, 1], [4, 0])}px)`,
            }}
          >
            Analytics
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
            Track your
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.blue} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Growth
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
            See what's working and optimize your strategy.
          </p>
        </div>

        {/* Phone with real app UI */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneMockup delay={30} scale={0.85} rotateY={0} rotateX={0}>
            <DashboardScreen />
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Real app Dashboard screen
const DashboardScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scoreProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 30, stiffness: 40, mass: 1.2 },
  });

  const visibilityScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 78]));

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.purple})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            👤
          </div>
          <div>
            <div style={{ fontFamily, fontSize: 10, color: COLORS.gray400, marginBottom: 2 }}>FOUNDER</div>
            <div style={{ fontFamily, fontSize: 15, fontWeight: 600, color: COLORS.white }}>Good morning, Specter</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 16, opacity: 0.6 }}>🔍</span>
          <span style={{ fontSize: 16, opacity: 0.6 }}>🔔</span>
        </div>
      </div>

      {/* Network Visibility Score */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily, fontSize: 10, letterSpacing: 1.5, color: COLORS.gray400, marginBottom: 12 }}>
          NETWORK VISIBILITY SCORE
        </div>
        <VisibilityScoreCircle score={visibilityScore} progress={scoreProgress} />
        <div style={{ fontFamily, fontSize: 13, color: COLORS.gray300, marginTop: 12 }}>
          Outperforming <span style={{ color: COLORS.white, fontWeight: 600 }}>82%</span> of peers
        </div>
      </div>

      {/* Daily Inspiration */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily, fontSize: 16, fontWeight: 600, color: COLORS.white }}>Daily Inspiration</span>
        <span style={{ fontFamily, fontSize: 12, color: COLORS.blue }}>REFINE AI</span>
      </div>

      <InspirationCards />

      {/* Coming Up Next */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white, marginBottom: 12 }}>
          Coming Up Next
        </div>
        <UpcomingPost />
      </div>

      {/* Bottom Navigation */}
      <BottomNavDashboard />
    </div>
  );
};

const VisibilityScoreCircle: React.FC<{ score: number; progress: number }> = ({ score, progress }) => {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (score / 100));

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.blue}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 10px ${COLORS.blue}80)`,
          }}
        />
      </svg>
      {/* Score text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily, fontSize: 36, fontWeight: 700, color: COLORS.white }}>{score}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'rgba(52, 211, 153, 0.15)',
            borderRadius: 12,
          }}
        >
          <span style={{ fontFamily, fontSize: 10, color: COLORS.green }}>↗ +5%</span>
        </div>
      </div>
    </div>
  );
};

const InspirationCards: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardReveal = spring({
    frame: frame - 100,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        transform: `translateY(${interpolate(cardReveal, [0, 1], [20, 0])}px)`,
        opacity: cardReveal,
      }}
    >
      {/* Main card */}
      <div
        style={{
          flex: 2,
          padding: 14,
          background: `linear-gradient(135deg, ${COLORS.blue}30, ${COLORS.purple}20)`,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: `${COLORS.blue}30`,
            borderRadius: 12,
            fontFamily,
            fontSize: 9,
            color: COLORS.blue,
            marginBottom: 50,
          }}
        >
          AI TREND
        </div>
        <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.white, lineHeight: 1.4, marginBottom: 8 }}>
          The 3 reasons why SaaS founders are shifting to local LLMs
        </div>
        <div style={{ fontFamily, fontSize: 10, color: COLORS.gray400, marginBottom: 12 }}>
          Based on recent YC discussions
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: COLORS.teal,
            borderRadius: 20,
            fontFamily,
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.black,
          }}
        >
          ✦ Develop Hook
        </div>
      </div>

      {/* Secondary card */}
      <div
        style={{
          flex: 1,
          padding: 14,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            fontFamily,
            fontSize: 9,
            color: COLORS.gray400,
            marginBottom: 12,
          }}
        >
          AUTO
        </div>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 500, color: COLORS.gray300, lineHeight: 1.4 }}>
          Stop selling...
        </div>
        <div style={{ fontFamily, fontSize: 9, color: COLORS.gray400, marginTop: 'auto' }}>
          Trending
        </div>
      </div>
    </div>
  );
};

const UpcomingPost: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - 130,
    fps,
    config: { damping: 25, stiffness: 80, mass: 0.9 },
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        transform: `translateY(${interpolate(reveal, [0, 1], [10, 0])}px)`,
        opacity: reveal,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: COLORS.blue,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        🔗
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily, fontSize: 9, color: COLORS.gray400, marginBottom: 2 }}>LINKEDIN SCHEDULE</div>
        <div style={{ fontFamily, fontSize: 13, color: COLORS.white }}>Why focus is the ultima...</div>
        <div style={{ fontFamily, fontSize: 10, color: COLORS.blue }}>Today @ 4:30 PM</div>
      </div>
      <span style={{ fontSize: 14 }}>✏️</span>
    </div>
  );
};

const BottomNavDashboard: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-around',
      paddingTop: 12,
      marginTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {[
      { icon: '🏠', label: 'Home', active: true },
      { icon: '📅', label: '' },
      { icon: '+', label: '', isAdd: true },
      { icon: '📈', label: '' },
      { icon: '👤', label: '' },
    ].map((item, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {item.isAdd ? (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: COLORS.blue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: COLORS.white,
              marginTop: -20,
            }}
          >
            +
          </div>
        ) : (
          <span style={{ fontSize: 18, opacity: item.active ? 1 : 0.4 }}>{item.icon}</span>
        )}
      </div>
    ))}
  </div>
);
