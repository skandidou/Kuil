import React from 'react';
import { AbsoluteFill, useVideoConfig, Audio, staticFile, interpolate } from 'remotion';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';

import { Scene1_Intro } from './scenes/Scene1_Intro';
import { Scene2_Problem } from './scenes/Scene2_Problem';
import { Scene3_Voice } from './scenes/Scene3_Voice';
import { Scene4_Editor } from './scenes/Scene4_Editor';
import { Scene5_Calendar } from './scenes/Scene5_Calendar';
import { Scene6_Analytics } from './scenes/Scene6_Analytics';
import { Scene7_CTA } from './scenes/Scene7_CTA';
import { SCENE_DURATIONS, TRANSITION_DURATION, COLORS } from './constants';

// Premium transitions - ALL VISUALLY DISTINCT
import {
  smoothFade,
  wipeRight,
  irisOpen,
  slideUp,
  flashCut,
  zoomThrough,
  blurDissolve,
  morphScale,
} from './components/Transitions';

// =============================================================================
// ECHOAPP PROMO - MAIN COMPOSITION
// Premium Apple keynote-style video with DIVERSE cinematic transitions
// Each transition is unique for maximum visual impact
// =============================================================================

export const EchoappPromo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();

  // Longer transition duration for cinematic feel
  const transitionFrames = Math.round(TRANSITION_DURATION * fps * 2); // Much longer for smooth transitions

  // Different timing styles for variety
  const dramaticTiming = springTiming({
    config: { damping: 35, stiffness: 70, mass: 1.3 },
    durationInFrames: transitionFrames,
  });

  const snappyTiming = springTiming({
    config: { damping: 45, stiffness: 120, mass: 0.9 },
    durationInFrames: Math.round(transitionFrames * 0.8),
  });

  const smoothTiming = linearTiming({
    durationInFrames: transitionFrames,
  });

  const slowTiming = linearTiming({
    durationInFrames: Math.round(transitionFrames * 1.3),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {/* Background music with fade in/out */}
      <Audio
        src={staticFile('audio/promo-music.mp3')}
        volume={(f) => {
          // Fade in during first 1 second
          const fadeIn = interpolate(f, [0, fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Fade out during last 1.5 seconds
          const fadeOut = interpolate(
            f,
            [durationInFrames - fps * 1.5, durationInFrames],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          // Base volume at 0.35 for background feel
          return Math.min(fadeIn, fadeOut) * 0.35;
        }}
        startFrom={0}
      />

      <TransitionSeries>
        {/* Scene 1: Logo Intro */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.intro * fps)}
        >
          <Scene1_Intro />
        </TransitionSeries.Sequence>

        {/* TRANSITION 1: Blur dissolve - smooth elegant reveal */}
        <TransitionSeries.Transition
          presentation={blurDissolve()}
          timing={smoothTiming}
        />

        {/* Scene 2: Problem Statement */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.problem * fps)}
        >
          <Scene2_Problem />
        </TransitionSeries.Sequence>

        {/* TRANSITION 2: Morph scale - premium blur morph */}
        <TransitionSeries.Transition
          presentation={morphScale()}
          timing={dramaticTiming}
        />

        {/* Scene 3: Voice Signature Feature */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.voice * fps)}
        >
          <Scene3_Voice />
        </TransitionSeries.Sequence>

        {/* TRANSITION 3: Zoom through - dolly zoom effect */}
        <TransitionSeries.Transition
          presentation={zoomThrough()}
          timing={smoothTiming}
        />

        {/* Scene 4: Smart Editor */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.editor * fps)}
        >
          <Scene4_Editor />
        </TransitionSeries.Sequence>

        {/* TRANSITION 4: Wipe right - classic cinematic wipe */}
        <TransitionSeries.Transition
          presentation={wipeRight()}
          timing={dramaticTiming}
        />

        {/* Scene 5: Content Calendar */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.calendar * fps)}
        >
          <Scene5_Calendar />
        </TransitionSeries.Sequence>

        {/* TRANSITION 5: Slide up - iOS style */}
        <TransitionSeries.Transition
          presentation={slideUp()}
          timing={smoothTiming}
        />

        {/* Scene 6: Analytics */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.analytics * fps)}
        >
          <Scene6_Analytics />
        </TransitionSeries.Sequence>

        {/* TRANSITION 6: Blur dissolve - elegant finale */}
        <TransitionSeries.Transition
          presentation={blurDissolve()}
          timing={slowTiming}
        />

        {/* Scene 7: CTA Finale */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_DURATIONS.cta * fps)}
        >
          <Scene7_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
