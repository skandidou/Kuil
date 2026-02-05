import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import { Scene1_Intro } from './scenes/Scene1_Intro';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_VoiceFeature } from './scenes/Scene3_VoiceFeature';
import { Scene4_Editor } from './scenes/Scene4_Editor';
import { Scene5_Calendar } from './scenes/Scene5_Calendar';
import { Scene6_Analytics } from './scenes/Scene6_Analytics';
import { Scene7_CTA } from './scenes/Scene7_CTA';

// Scene durations in seconds - Apple style pacing (longer for premium feel)
const SCENE_DURATIONS = {
  intro: 3,
  problem: 3.5,
  voiceFeature: 5,
  editor: 5,
  calendar: 4.5,
  analytics: 4.5,
  cta: 4,
};

export const EchoappPromo: React.FC = () => {
  const { fps } = useVideoConfig();

  // Apple-style spring timing for smooth transitions
  const smoothTransition = springTiming({
    config: { damping: 30, stiffness: 100, mass: 1 },
    durationInFrames: Math.round(0.8 * fps),
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
          presentation={fade()}
          timing={smoothTransition}
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

        {/* Scene 4: Smart Editor */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.editor * fps)}
        >
          <Scene4_Editor />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={smoothTransition}
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

        {/* Scene 6: Analytics */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.analytics * fps)}
        >
          <Scene6_Analytics />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={smoothTransition}
        />

        {/* Scene 7: CTA */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.cta * fps)}
        >
          <Scene7_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
