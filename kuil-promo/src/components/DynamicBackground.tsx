import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  random,
} from 'remotion';
import { COLORS } from './constants';

type ParticleProps = {
  index: number;
  seed: string;
};

const Particle: React.FC<ParticleProps> = ({ index, seed }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Random properties for each particle
  const startX = random(`${seed}-x-${index}`) * width;
  const startY = random(`${seed}-y-${index}`) * height;
  const size = 2 + random(`${seed}-size-${index}`) * 4;
  const speed = 0.3 + random(`${seed}-speed-${index}`) * 0.7;
  const delay = random(`${seed}-delay-${index}`) * 100;

  // Floating animation
  const floatY = Math.sin((frame + delay) * 0.02 * speed) * 30;
  const floatX = Math.cos((frame + delay) * 0.015 * speed) * 20;

  // Pulsing opacity
  const pulse = interpolate(
    Math.sin((frame + delay) * 0.05),
    [-1, 1],
    [0.2, 0.8]
  );

  // Subtle color shift
  const hue = interpolate(frame, [0, durationInFrames], [220, 280]);

  return (
    <div
      style={{
        position: 'absolute',
        left: startX + floatX,
        top: startY + floatY,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `hsla(${hue}, 80%, 60%, ${pulse})`,
        boxShadow: `0 0 ${size * 3}px hsla(${hue}, 80%, 60%, ${pulse * 0.5})`,
      }}
    />
  );
};

type GlowOrbProps = {
  x: string;
  y: string;
  size: number;
  color1: string;
  color2: string;
  speed: number;
  delay: number;
};

const GlowOrb: React.FC<GlowOrbProps> = ({ x, y, size, color1, color2, speed, delay }) => {
  const frame = useCurrentFrame();

  const offsetX = Math.sin((frame + delay) * 0.008 * speed) * 50;
  const offsetY = Math.cos((frame + delay) * 0.006 * speed) * 40;
  const scale = interpolate(
    Math.sin((frame + delay) * 0.01),
    [-1, 1],
    [0.9, 1.1]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity: 0.4,
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
      }}
    />
  );
};

type DynamicBackgroundProps = {
  particleCount?: number;
  variant?: 'default' | 'intense' | 'subtle';
};

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  particleCount = 40,
  variant = 'default',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Grid lines animation
  const gridOffset = (frame * 0.5) % 100;

  const orbOpacity = variant === 'intense' ? 0.5 : variant === 'subtle' ? 0.2 : 0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.darkBg, overflow: 'hidden' }}>
      {/* Animated gradient mesh */}
      <GlowOrb
        x="-10%"
        y="10%"
        size={1000}
        color1={`${COLORS.primary}${Math.round(orbOpacity * 255).toString(16).padStart(2, '0')}`}
        color2="transparent"
        speed={1}
        delay={0}
      />
      <GlowOrb
        x="60%"
        y="-20%"
        size={1200}
        color1={`${COLORS.neonPurple}${Math.round(orbOpacity * 255).toString(16).padStart(2, '0')}`}
        color2="transparent"
        speed={0.8}
        delay={50}
      />
      <GlowOrb
        x="80%"
        y="60%"
        size={900}
        color1={`${COLORS.accent}${Math.round(orbOpacity * 255).toString(16).padStart(2, '0')}`}
        color2="transparent"
        speed={1.2}
        delay={100}
      />
      <GlowOrb
        x="20%"
        y="70%"
        size={800}
        color1={`${COLORS.neonPink}${Math.round(orbOpacity * 0.5 * 255).toString(16).padStart(2, '0')}`}
        color2="transparent"
        speed={0.9}
        delay={75}
      />

      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${COLORS.gray700}10 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.gray700}10 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          backgroundPosition: `${gridOffset}px ${gridOffset}px`,
          opacity: 0.3,
        }}
      />

      {/* Floating particles */}
      {variant !== 'subtle' && Array.from({ length: particleCount }).map((_, i) => (
        <Particle key={i} index={i} seed="kuil-particles" />
      ))}

      {/* Top and bottom gradients for depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${COLORS.darkBg} 0%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(0deg, ${COLORS.darkBg} 0%, transparent 100%)`,
        }}
      />

      {/* Scanline effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* Noise texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </AbsoluteFill>
  );
};
