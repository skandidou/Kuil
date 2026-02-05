import React from 'react';
import { Composition, Folder } from 'remotion';
import { EchoappPromo } from './EchoappPromo';
import {
  FPS,
  WIDTH,
  HEIGHT,
  WIDTH_HORIZONTAL,
  HEIGHT_HORIZONTAL,
  SCENE_DURATIONS,
  TRANSITION_DURATION,
} from './constants';

// =============================================================================
// REMOTION ROOT
// Composition registration for rendering
// =============================================================================

// Calculate total duration accounting for transition overlaps
const scenes = Object.values(SCENE_DURATIONS);
const totalSceneDuration = scenes.reduce((a, b) => a + b, 0);
const numTransitions = scenes.length - 1;
const totalDurationSeconds = totalSceneDuration - (numTransitions * TRANSITION_DURATION);
const DURATION_IN_FRAMES = Math.round(totalDurationSeconds * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Echoapp-Promo">
        {/* Primary: 9:16 Vertical (Instagram Reels, TikTok, YouTube Shorts) */}
        <Composition
          id="EchoappPromoVertical"
          component={EchoappPromo}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{}}
        />

        {/* Alternative: 16:9 Horizontal (YouTube, LinkedIn) */}
        <Composition
          id="EchoappPromoHorizontal"
          component={EchoappPromo}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          width={WIDTH_HORIZONTAL}
          height={HEIGHT_HORIZONTAL}
          defaultProps={{}}
        />
      </Folder>

      {/* Default composition - Vertical */}
      <Composition
        id="EchoappPromo"
        component={EchoappPromo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
