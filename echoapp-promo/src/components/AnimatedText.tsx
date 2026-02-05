import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { COLORS, SPRING_SMOOTH, SPRING_BOUNCY } from './constants';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

type AnimatedTitleProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  gradient?: boolean;
};

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  text,
  delay = 0,
  fontSize = 120,
  gradient = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 30px',
      }}
    >
      {words.map((word, wordIndex) => {
        const wordDelay = delay + wordIndex * 5;

        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: SPRING_SMOOTH,
        });

        const y = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        return (
          <span
            key={wordIndex}
            style={{
              fontFamily,
              fontSize,
              fontWeight: 800,
              transform: `translateY(${y}px)`,
              opacity,
              background: gradient
                ? `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.accent} 100%)`
                : 'none',
              color: gradient ? 'transparent' : COLORS.white,
              WebkitBackgroundClip: gradient ? 'text' : 'unset',
              backgroundClip: gradient ? 'text' : 'unset',
              letterSpacing: '-2px',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

type AnimatedSubtitleProps = {
  text: string;
  delay?: number;
  fontSize?: number;
};

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({
  text,
  delay = 0,
  fontSize = 36,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  return (
    <p
      style={{
        fontFamily,
        fontSize,
        fontWeight: 400,
        color: COLORS.gray,
        transform: `translateY(${y}px)`,
        opacity,
        letterSpacing: '0.5px',
        lineHeight: 1.5,
        textAlign: 'center',
        maxWidth: 900,
      }}
    >
      {text}
    </p>
  );
};

type TypewriterTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  charFrames?: number;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 0,
  fontSize = 28,
  color = COLORS.white,
  charFrames = 2,
}) => {
  const frame = useCurrentFrame();

  const adjustedFrame = Math.max(0, frame - delay);
  const typedChars = Math.min(
    text.length,
    Math.floor(adjustedFrame / charFrames)
  );
  const displayText = text.slice(0, typedChars);

  // Cursor blink
  const cursorOpacity = interpolate(
    adjustedFrame % 20,
    [0, 10, 20],
    [1, 0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight: 500,
        color,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span>{displayText}</span>
      {typedChars < text.length && (
        <span
          style={{
            opacity: cursorOpacity,
            marginLeft: 2,
            color: COLORS.accent,
          }}
        >
          |
        </span>
      )}
    </div>
  );
};

type AnimatedBadgeProps = {
  text: string;
  delay?: number;
  color?: string;
};

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  text,
  delay = 0,
  color = COLORS.primaryStart,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: SPRING_BOUNCY,
  });

  const opacity = interpolate(scale, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontFamily,
        fontSize: 16,
        fontWeight: 600,
        color: COLORS.white,
        backgroundColor: color,
        padding: '10px 24px',
        borderRadius: 30,
        transform: `scale(${scale})`,
        opacity,
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  );
};
