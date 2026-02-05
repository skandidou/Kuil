import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

import { Scene1_Intro } from './scenes/Scene1_Intro';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_VoiceFeature } from './scenes/Scene3_VoiceFeature';
import { Scene4_Editor } from './scenes/Scene4_Editor';
import { Scene5_Calendar } from './scenes/Scene5_Calendar';
import { Scene6_CTA } from './scenes/Scene6_CTA';

// Scene durations in seconds - punchy, fast-paced
export const SCENE_DURATIONS = {
  intro: 2.5,
  problem: 3.5,
  voiceFeature: 4,
  editor: 4,
  calendar: 3.5,
  cta: 3,
};

// Transition duration in seconds
export const TRANSITION_DURATION = 0.5;
export const NUM_TRANSITIONS = 5;

export const KuilPromo: React.FC = () => {
  const { fps } = useVideoConfig();

  // Smooth spring timing for transitions
  const smoothTransition = springTiming({
    config: { damping: 25, stiffness: 120, mass: 1 },
    durationInFrames: Math.round(TRANSITION_DURATION * fps),
  });

  // Slide transition for variety
  const slideTransition = springTiming({
    config: { damping: 30, stiffness: 150, mass: 0.8 },
    durationInFrames: Math.round(TRANSITION_DURATION * fps),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <TransitionSeries>
        {/* Scene 1: Logo Intro */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.intro * fps)}
        >
          <Scene1_Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={smoothTransition}
        />

        {/* Scene 2: Problem Statement */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.problem * fps)}
        >
          <Scene2_Problem />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={slideTransition}
        />

        {/* Scene 3: Voice Signature Feature */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.voiceFeature * fps)}
        >
          <Scene3_VoiceFeature />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={smoothTransition}
        />

        {/* Scene 4: AI Editor */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.editor * fps)}
        >
          <Scene4_Editor />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-left' })}
          timing={slideTransition}
        />

        {/* Scene 5: Content Calendar */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.calendar * fps)}
        >
          <Scene5_Calendar />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={smoothTransition}
        />

        {/* Scene 6: CTA */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.cta * fps)}
        >
          <Scene6_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
