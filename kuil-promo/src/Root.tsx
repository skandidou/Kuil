import React from 'react';
import { Composition, Folder } from 'remotion';
import { KuilPromo, SCENE_DURATIONS, TRANSITION_DURATION, NUM_TRANSITIONS } from './KuilPromo';

// Video configuration - Premium 60fps for smooth animations
const FPS = 60;
const WIDTH = 1920;
const HEIGHT = 1080;

// Calculate total duration accounting for overlapping transitions
const totalSeconds =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  NUM_TRANSITIONS * TRANSITION_DURATION;

const DURATION_IN_FRAMES = Math.round(totalSeconds * FPS);

// Vertical format for TikTok/Instagram Reels
const VERTICAL_WIDTH = 1080;
const VERTICAL_HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Kuil-Promo">
        {/* Main horizontal format (YouTube, LinkedIn) */}
        <Composition
          id="KuilPromo"
          component={KuilPromo}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{}}
        />

        {/* Vertical format (TikTok, Instagram Reels) */}
        <Composition
          id="KuilPromoVertical"
          component={KuilPromo}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          width={VERTICAL_WIDTH}
          height={VERTICAL_HEIGHT}
          defaultProps={{}}
        />

        {/* Square format (Instagram Feed) */}
        <Composition
          id="KuilPromoSquare"
          component={KuilPromo}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          width={1080}
          height={1080}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
};
