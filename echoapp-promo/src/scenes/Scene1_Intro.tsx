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
import { COLORS, SPRING } from '../components/constants';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo icon animation
  const iconProgress = spring({
    frame,
    fps,
    config: SPRING.bouncy,
  });

  const iconScale = interpolate(iconProgress, [0, 1], [0, 1]);
  const iconOpacity = interpolate(iconProgress, [0, 1], [0, 1]);

  // Logo text animation
  const textProgress = spring({
    frame: frame - 20,
    fps,
    config: SPRING.smooth,
  });

  const textX = interpolate(textProgress, [0, 1], [30, 0]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - 50,
    fps,
    config: SPRING.smooth,
  });

  const taglineY = interpolate(taglineProgress, [0, 1], [30, 0]);
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);

  // Exit animation
  const exitStart = durationInFrames - 30;
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
          opacity: exitOpacity,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 24,
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              transform: `scale(${iconScale})`,
              opacity: iconOpacity,
              boxShadow: `0 20px 60px ${COLORS.blue}40`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 5,
                backgroundColor: COLORS.white,
                borderRadius: 3,
              }}
            />
            <div
              style={{
                width: 30,
                height: 5,
                backgroundColor: COLORS.white,
                borderRadius: 3,
                opacity: 0.75,
              }}
            />
            <div
              style={{
                width: 35,
                height: 5,
                backgroundColor: COLORS.white,
                borderRadius: 3,
                opacity: 0.5,
              }}
            />
          </div>

          {/* Logo text */}
          <span
            style={{
              fontFamily,
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: '-1.5px',
              transform: `translateX(${textX}px)`,
              opacity: textOpacity,
            }}
          >
            SpecterInk
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            transform: `translateY(${taglineY}px)`,
            opacity: taglineOpacity,
          }}
        >
          <p
            style={{
              fontFamily,
              fontSize: 32,
              fontWeight: 400,
              color: COLORS.gray300,
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Your LinkedIn Voice, Amplified.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
