import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from 'remotion';
import { SPRING } from './constants';

type PremiumPhoneProps = {
  screenImage: string;
  delay?: number;
  scale?: number;
  rotateY?: number;
  rotateX?: number;
  x?: number;
  y?: number;
};

export const PremiumPhone: React.FC<PremiumPhoneProps> = ({
  screenImage,
  delay = 0,
  scale = 1,
  rotateY = 0,
  rotateX = 0,
  x = 0,
  y = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance animation
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: SPRING.gentle,
  });

  // Subtle floating animation
  const floatY = Math.sin((frame - delay) * 0.03) * 8;
  const floatRotate = Math.sin((frame - delay) * 0.02) * 1;

  const translateY = interpolate(entrance, [0, 1], [120, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scaleAnim = interpolate(entrance, [0, 1], [0.85, scale]);

  // Phone dimensions - iPhone 15 Pro style
  const phoneWidth = 300;
  const phoneHeight = 620;
  const borderRadius = 55;
  const bezelWidth = 6;

  return (
    <div
      style={{
        position: 'relative',
        transform: `
          translate(${x}px, ${y + translateY + floatY}px)
          scale(${scaleAnim})
          perspective(1200px)
          rotateY(${rotateY + floatRotate}deg)
          rotateX(${rotateX}deg)
        `,
        opacity,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: '10%',
          width: '80%',
          height: 60,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
          transform: 'translateZ(-50px)',
        }}
      />

      {/* Phone body - Titanium frame effect */}
      <div
        style={{
          width: phoneWidth,
          height: phoneHeight,
          borderRadius,
          background: `linear-gradient(
            145deg,
            #3a3a3c 0%,
            #2c2c2e 20%,
            #1c1c1e 50%,
            #2c2c2e 80%,
            #3a3a3c 100%
          )`,
          boxShadow: `
            0 50px 100px rgba(0, 0, 0, 0.5),
            0 20px 60px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
          `,
          padding: bezelWidth,
          position: 'relative',
        }}
      >
        {/* Titanium edge highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen container */}
        <div
          style={{
            width: phoneWidth - bezelWidth * 2,
            height: phoneHeight - bezelWidth * 2,
            borderRadius: borderRadius - bezelWidth,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#000',
          }}
        >
          {/* Screen content */}
          <Img
            src={staticFile(screenImage)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Screen glass reflection */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.08) 0%,
                transparent 40%,
                transparent 60%,
                rgba(255, 255, 255, 0.02) 100%
              )`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: bezelWidth + 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126,
            height: 36,
            backgroundColor: '#000',
            borderRadius: 24,
            boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Side buttons - Volume */}
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 120,
            width: 4,
            height: 35,
            backgroundColor: '#3a3a3c',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 170,
            width: 4,
            height: 60,
            backgroundColor: '#3a3a3c',
            borderRadius: '2px 0 0 2px',
          }}
        />

        {/* Side button - Power */}
        <div
          style={{
            position: 'absolute',
            right: -3,
            top: 160,
            width: 4,
            height: 80,
            backgroundColor: '#3a3a3c',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>
    </div>
  );
};
