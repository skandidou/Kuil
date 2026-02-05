import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

// =============================================================================
// PREMIUM APPLE-STYLE TRANSITIONS
// Cinematic zoom, blur, and morph effects - NO cheap slides/wipes
// =============================================================================

type EmptyProps = Record<string, never>;
type TransitionComponentProps = TransitionPresentationComponentProps<EmptyProps>;

// -----------------------------------------------------------------------------
// ZOOM BLUR TRANSITION
// Zooms in with motion blur - very Apple keynote style
// -----------------------------------------------------------------------------

const ZoomBlurComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.16, 1, 0.3, 1)(presentationProgress);

  if (isEntering) {
    const scale = interpolate(easedProgress, [0, 1], [0.85, 1]);
    const blur = interpolate(easedProgress, [0, 0.6], [15, 0], {
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(easedProgress, [0, 0.3], [0, 1], {
      extrapolateRight: 'clamp',
    });

    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    const scale = interpolate(easedProgress, [0, 1], [1, 1.15]);
    const blur = interpolate(easedProgress, [0.4, 1], [0, 20], {
      extrapolateLeft: 'clamp',
    });
    const opacity = interpolate(easedProgress, [0.7, 1], [1, 0], {
      extrapolateLeft: 'clamp',
    });

    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
};

export const zoomBlur = (): TransitionPresentation<EmptyProps> => ({
  component: ZoomBlurComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// CROSSFADE ZOOM
// Elegant crossfade with subtle scale change - very premium Apple style
// -----------------------------------------------------------------------------

const createCrossfadeZoomComponent = (scaleAmount: number): React.FC<TransitionComponentProps> => {
  return ({ children, presentationDirection, presentationProgress }) => {
    const isEntering = presentationDirection === 'entering';
    const easedProgress = Easing.bezier(0.4, 0, 0.2, 1)(presentationProgress);

    if (isEntering) {
      const scale = interpolate(easedProgress, [0, 1], [scaleAmount, 1]);
      const opacity = interpolate(easedProgress, [0, 0.5], [0, 1], {
        extrapolateRight: 'clamp',
      });

      return (
        <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
          {children}
        </AbsoluteFill>
      );
    } else {
      const scale = interpolate(easedProgress, [0, 1], [1, 1 / scaleAmount]);
      const opacity = interpolate(easedProgress, [0.5, 1], [1, 0], {
        extrapolateLeft: 'clamp',
      });

      return (
        <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
          {children}
        </AbsoluteFill>
      );
    }
  };
};

export const crossfadeZoom = (scaleAmount: number = 1.08): TransitionPresentation<EmptyProps> => ({
  component: createCrossfadeZoomComponent(scaleAmount),
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// MORPH SCALE
// Scale morph with blur effect - perfect for feature reveals
// -----------------------------------------------------------------------------

const MorphScaleComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.34, 1.2, 0.64, 1)(presentationProgress);

  if (isEntering) {
    const scale = interpolate(easedProgress, [0, 1], [0.88, 1]);
    const opacity = interpolate(presentationProgress, [0, 0.3], [0, 1], {
      extrapolateRight: 'clamp',
    });
    const blur = interpolate(presentationProgress, [0, 0.4], [12, 0], {
      extrapolateRight: 'clamp',
    });

    return (
      <AbsoluteFill style={{ transform: `scale(${scale})`, opacity, filter: `blur(${blur}px)` }}>
        {children}
      </AbsoluteFill>
    );
  } else {
    const scale = interpolate(easedProgress, [0, 1], [1, 1.12]);
    const opacity = interpolate(presentationProgress, [0.6, 1], [1, 0], {
      extrapolateLeft: 'clamp',
    });
    const blur = interpolate(presentationProgress, [0.6, 1], [0, 12], {
      extrapolateLeft: 'clamp',
    });

    return (
      <AbsoluteFill style={{ transform: `scale(${scale})`, opacity, filter: `blur(${blur}px)` }}>
        {children}
      </AbsoluteFill>
    );
  }
};

export const morphScale = (): TransitionPresentation<EmptyProps> => ({
  component: MorphScaleComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// DEPTH FADE
// Fade with z-depth movement - subtle but premium 3D feel
// -----------------------------------------------------------------------------

const DepthFadeComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.4, 0, 0.2, 1)(presentationProgress);

  if (isEntering) {
    const translateZ = interpolate(easedProgress, [0, 1], [-80, 0]);
    const opacity = interpolate(easedProgress, [0, 0.5], [0, 1], {
      extrapolateRight: 'clamp',
    });
    const scale = interpolate(easedProgress, [0, 1], [0.92, 1]);

    return (
      <AbsoluteFill
        style={{
          transform: `perspective(1200px) translateZ(${translateZ}px) scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    const translateZ = interpolate(easedProgress, [0, 1], [0, 80]);
    const opacity = interpolate(easedProgress, [0.5, 1], [1, 0], {
      extrapolateLeft: 'clamp',
    });
    const scale = interpolate(easedProgress, [0, 1], [1, 1.08]);

    return (
      <AbsoluteFill
        style={{
          transform: `perspective(1200px) translateZ(${translateZ}px) scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
};

export const depthFade = (): TransitionPresentation<EmptyProps> => ({
  component: DepthFadeComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// SMOOTH FADE (Ultra Premium)
// Just a beautiful smooth fade - sometimes simplicity is best
// -----------------------------------------------------------------------------

const SmoothFadeComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.4, 0, 0.2, 1)(presentationProgress);
  const opacity = isEntering ? easedProgress : 1 - easedProgress;

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const smoothFade = (): TransitionPresentation<EmptyProps> => ({
  component: SmoothFadeComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// WIPE RIGHT - Classic cinematic wipe from left to right
// -----------------------------------------------------------------------------

const WipeRightComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.4, 0, 0.2, 1)(presentationProgress);

  if (isEntering) {
    // New scene wipes in from left
    const clipX = interpolate(easedProgress, [0, 1], [100, 0]);
    return (
      <AbsoluteFill
        style={{
          clipPath: `inset(0 ${clipX}% 0 0)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    // Old scene stays visible then gets covered
    return (
      <AbsoluteFill>
        {children}
      </AbsoluteFill>
    );
  }
};

export const wipeRight = (): TransitionPresentation<EmptyProps> => ({
  component: WipeRightComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// IRIS OPEN - Circular reveal from center (very cinematic)
// -----------------------------------------------------------------------------

const IrisOpenComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.16, 1, 0.3, 1)(presentationProgress);

  if (isEntering) {
    const radius = interpolate(easedProgress, [0, 1], [0, 150]);
    return (
      <AbsoluteFill
        style={{
          clipPath: `circle(${radius}% at 50% 50%)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    return (
      <AbsoluteFill>
        {children}
      </AbsoluteFill>
    );
  }
};

export const irisOpen = (): TransitionPresentation<EmptyProps> => ({
  component: IrisOpenComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// SLIDE UP - New scene slides up covering old one
// -----------------------------------------------------------------------------

const SlideUpComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.32, 0.72, 0, 1)(presentationProgress);

  if (isEntering) {
    const translateY = interpolate(easedProgress, [0, 1], [100, 0]);
    return (
      <AbsoluteFill
        style={{
          transform: `translateY(${translateY}%)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    const scale = interpolate(easedProgress, [0, 1], [1, 0.9]);
    const opacity = interpolate(easedProgress, [0.5, 1], [1, 0.5], {
      extrapolateLeft: 'clamp',
    });
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
};

export const slideUp = (): TransitionPresentation<EmptyProps> => ({
  component: SlideUpComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// FLASH CUT - Quick white flash then hard cut (trailer style)
// -----------------------------------------------------------------------------

const FlashCutComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';

  // Flash peaks at 40% progress
  const flashIntensity = interpolate(
    presentationProgress,
    [0, 0.4, 0.6, 1],
    [0, 1, 0.8, 0],
    { extrapolateRight: 'clamp' }
  );

  if (isEntering) {
    const opacity = presentationProgress > 0.35 ? 1 : 0;
    return (
      <>
        <AbsoluteFill style={{ opacity }}>
          {children}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: 'white',
            opacity: flashIntensity * 0.95,
            pointerEvents: 'none',
          }}
        />
      </>
    );
  } else {
    const opacity = presentationProgress < 0.35 ? 1 : 0;
    return (
      <>
        <AbsoluteFill style={{ opacity }}>
          {children}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: 'white',
            opacity: flashIntensity * 0.95,
            pointerEvents: 'none',
          }}
        />
      </>
    );
  }
};

export const flashCut = (): TransitionPresentation<EmptyProps> => ({
  component: FlashCutComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// ZOOM THROUGH - Zooms through current into next (dolly zoom feel)
// -----------------------------------------------------------------------------

const ZoomThroughComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.4, 0, 0.2, 1)(presentationProgress);

  if (isEntering) {
    // New scene zooms from far to normal
    const scale = interpolate(easedProgress, [0, 1], [0.3, 1]);
    const opacity = interpolate(easedProgress, [0, 0.3], [0, 1], {
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    // Old scene zooms past camera
    const scale = interpolate(easedProgress, [0, 1], [1, 3]);
    const opacity = interpolate(easedProgress, [0.4, 0.8], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
};

export const zoomThrough = (): TransitionPresentation<EmptyProps> => ({
  component: ZoomThroughComponent,
  props: {} as EmptyProps,
});

// -----------------------------------------------------------------------------
// BLUR DISSOLVE - Blur out/in with dissolve (dreamy, premium)
// -----------------------------------------------------------------------------

const BlurDissolveComponent: React.FC<TransitionComponentProps> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const isEntering = presentationDirection === 'entering';
  const easedProgress = Easing.bezier(0.25, 0.1, 0.25, 1)(presentationProgress);

  if (isEntering) {
    // New scene fades in with blur clearing
    const blur = interpolate(easedProgress, [0, 0.7], [25, 0], {
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(easedProgress, [0, 0.6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const scale = interpolate(easedProgress, [0, 1], [1.02, 1]);
    return (
      <AbsoluteFill
        style={{
          filter: `blur(${blur}px)`,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  } else {
    // Old scene fades out with blur increasing
    const blur = interpolate(easedProgress, [0.3, 1], [0, 25], {
      extrapolateLeft: 'clamp',
    });
    const opacity = interpolate(easedProgress, [0.4, 1], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const scale = interpolate(easedProgress, [0, 1], [1, 0.98]);
    return (
      <AbsoluteFill
        style={{
          filter: `blur(${blur}px)`,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
};

export const blurDissolve = (): TransitionPresentation<EmptyProps> => ({
  component: BlurDissolveComponent,
  props: {} as EmptyProps,
});

// =============================================================================
// LEGACY TRANSITION MOTIFS (for in-scene use)
// =============================================================================

type ExitAnimationProps = {
  children: React.ReactNode;
  exitBuffer?: number;
};

export const ExitAnimation: React.FC<ExitAnimationProps> = ({
  children,
  exitBuffer = 25,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - exitBuffer;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  const opacity = 1 - exitProgress;
  const scale = interpolate(exitProgress, [0, 1], [1, 0.98]);
  const y = interpolate(exitProgress, [0, 1], [0, -20]);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
};
