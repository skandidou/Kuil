import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from 'remotion';
import { COLORS, SPRING_SMOOTH, SPRING_BOUNCY } from './constants';

type PhoneMockupProps = {
  screenImage: string;
  delay?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotation?: number;
  animationType?: 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'float';
};

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  screenImage,
  delay = 0,
  scale = 1,
  x = 0,
  y = 0,
  rotation = 0,
  animationType = 'slide-up',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  // Animation calculations based on type
  let translateX = x;
  let translateY = y;
  let scaleValue = scale;
  let rotateValue = rotation;

  switch (animationType) {
    case 'slide-up':
      translateY = interpolate(progress, [0, 1], [y + 100, y]);
      break;
    case 'slide-left':
      translateX = interpolate(progress, [0, 1], [x + 200, x]);
      break;
    case 'slide-right':
      translateX = interpolate(progress, [0, 1], [x - 200, x]);
      break;
    case 'scale':
      scaleValue = interpolate(progress, [0, 1], [0.5, scale]);
      break;
    case 'float':
      // Subtle floating animation
      const floatOffset = Math.sin((frame - delay) * 0.05) * 5;
      translateY = y + floatOffset;
      break;
  }

  const opacity = interpolate(progress, [0, 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Phone dimensions (iPhone 14 Pro aspect ratio)
  const phoneWidth = 280;
  const phoneHeight = 580;
  const borderRadius = 45;
  const bezelWidth = 8;

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${translateX}px, ${translateY}px) scale(${scaleValue}) rotate(${rotateValue}deg)`,
        opacity,
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          width: phoneWidth,
          height: phoneHeight,
          borderRadius,
          background: `linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 100%)`,
          boxShadow: `
            0 25px 80px rgba(0, 0, 0, 0.5),
            0 10px 30px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          padding: bezelWidth,
          position: 'relative',
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: phoneWidth - bezelWidth * 2,
            height: phoneHeight - bezelWidth * 2,
            borderRadius: borderRadius - bezelWidth,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Img
            src={staticFile(screenImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: bezelWidth + 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 90,
            height: 28,
            backgroundColor: '#000',
            borderRadius: 20,
          }}
        />
      </div>

      {/* Reflection effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: phoneWidth,
          height: phoneHeight,
          borderRadius,
          background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

type MultiPhoneMockupProps = {
  screens: string[];
  delay?: number;
};

export const MultiPhoneMockup: React.FC<MultiPhoneMockupProps> = ({
  screens,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {screens.length >= 3 && (
        <PhoneMockup
          screenImage={screens[0]}
          delay={delay + 15}
          x={-350}
          y={50}
          scale={0.85}
          rotation={-8}
          animationType="slide-left"
        />
      )}
      <PhoneMockup
        screenImage={screens[screens.length > 1 ? 1 : 0]}
        delay={delay}
        x={0}
        y={0}
        scale={1}
        rotation={0}
        animationType="slide-up"
      />
      {screens.length >= 3 && (
        <PhoneMockup
          screenImage={screens[2]}
          delay={delay + 15}
          x={350}
          y={50}
          scale={0.85}
          rotation={8}
          animationType="slide-right"
        />
      )}
    </div>
  );
};
