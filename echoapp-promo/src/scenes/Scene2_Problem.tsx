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

export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Text reveals with stagger
  const line1Progress = spring({ frame, fps, config: SPRING.smooth });
  const line2Progress = spring({ frame: frame - 15, fps, config: SPRING.smooth });
  const line3Progress = spring({ frame: frame - 30, fps, config: SPRING.smooth });

  // Exit animation
  const exitStart = durationInFrames - 25;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );

  const getLineStyle = (progress: number) => ({
    transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
    opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress),
    filter: `blur(${interpolate(progress, [0, 1], [6, 0])}px)`,
  });

  return (
    <AbsoluteFill>
      <AppleBackground />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '0 200px',
        }}
      >
        <h2
          style={{
            fontFamily,
            fontSize: 80,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: '-3px',
            lineHeight: 1.1,
            textAlign: 'center',
            margin: 0,
            ...getLineStyle(line1Progress),
          }}
        >
          Writing great LinkedIn content
        </h2>

        <h2
          style={{
            fontFamily,
            fontSize: 80,
            fontWeight: 700,
            color: COLORS.gray300,
            letterSpacing: '-3px',
            lineHeight: 1.1,
            textAlign: 'center',
            margin: 0,
            ...getLineStyle(line2Progress),
          }}
        >
          takes hours.
        </h2>

        <h2
          style={{
            fontFamily,
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: '-3px',
            lineHeight: 1.1,
            textAlign: 'center',
            margin: 0,
            marginTop: 30,
            background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.purple} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            ...getLineStyle(line3Progress),
          }}
        >
          Until now.
        </h2>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
