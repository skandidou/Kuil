import React from 'react';
import { Composition } from 'remotion';
import { EchoappPromo } from './EchoappPromo';

// Video configuration - Premium 60fps for smooth animations
const FPS = 60;
const WIDTH = 1920;
const HEIGHT = 1080;

// Scene durations in seconds
const SCENE_DURATIONS = {
  intro: 3,
  problem: 3.5,
  voiceFeature: 5,
  editor: 5,
  calendar: 4.5,
  analytics: 4.5,
  cta: 4,
};

// Transition duration
const TRANSITION_DURATION = 0.8;
const NUM_TRANSITIONS = 6;

// Calculate total duration accounting for overlapping transitions
const totalSeconds =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  NUM_TRANSITIONS * TRANSITION_DURATION;

const DURATION_IN_FRAMES = Math.round(totalSeconds * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
