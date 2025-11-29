'use client';

import { useEffect, useRef } from 'react';

interface GrainOptions {
  animate?: boolean;
  patternWidth?: number;
  patternHeight?: number;
  grainOpacity?: number;
  grainDensity?: number;
  grainWidth?: number;
  grainHeight?: number;
  grainChaos?: number;
  grainSpeed?: number;
}

const defaultOptions: Required<GrainOptions> = {
  animate: false,
  patternWidth: 100,
  patternHeight: 100,
  grainOpacity: 0.08,
  grainDensity: 1,
  grainWidth: 1,
  grainHeight: 1,
  grainChaos: 0.5,
  grainSpeed: 20,
};

function generateNoise(options: Required<GrainOptions>): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = options.patternWidth;
  canvas.height = options.patternHeight;

  for (let w = 0; w < options.patternWidth; w += options.grainDensity) {
    for (let h = 0; h < options.patternHeight; h += options.grainDensity) {
      const rgb = Math.random() * 256 | 0;
      ctx.fillStyle = `rgba(${rgb}, ${rgb}, ${rgb}, ${options.grainOpacity})`;
      ctx.fillRect(w, h, options.grainWidth, options.grainHeight);
    }
  }

  return canvas.toDataURL('image/png');
}

export function GrainOverlay({ options = {} }: { options?: GrainOptions }) {
  const grainRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const mergedOptions: Required<GrainOptions> = { ...defaultOptions, ...options };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const noise = generateNoise(mergedOptions);

    // Create keyframes animation
    const keyFrames = [
      '0%:-10%,10%',
      '10%:-25%,0%',
      '20%:-30%,10%',
      '30%:-30%,30%',
      '40%:-20%,20%',
      '50%:-15%,10%',
      '60%:-20%,20%',
      '70%:-5%,20%',
      '80%:-25%,5%',
      '90%:-30%,25%',
      '100%:-10%,10%',
    ];

    let animation = '@keyframes grainAnimation {';
    for (const keyFrame of keyFrames) {
      const [percent, translate] = keyFrame.split(':');
      animation += `${percent} { transform: translate(${translate}); }`;
    }
    animation += '}';

    // Remove existing style if any
    if (styleRef.current) {
      styleRef.current.remove();
    }

    // Add animation style
    const style = document.createElement('style');
    style.id = 'grain-animation-style';
    style.innerHTML = animation;
    document.head.appendChild(style);
    styleRef.current = style;

    // Apply noise to the grain element
    if (grainRef.current) {
      grainRef.current.style.backgroundImage = `url(${noise})`;
    }

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [mergedOptions.animate, mergedOptions.patternWidth, mergedOptions.patternHeight,
      mergedOptions.grainOpacity, mergedOptions.grainDensity, mergedOptions.grainWidth,
      mergedOptions.grainHeight, mergedOptions.grainChaos, mergedOptions.grainSpeed]);

  return (
    <div
      ref={grainRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        width: '300%',
        height: '300%',
        left: '-100%',
        top: '-100%',
        ...(mergedOptions.animate && {
          animation: `grainAnimation ${mergedOptions.grainChaos}s steps(${mergedOptions.grainSpeed}, end) infinite`,
        }),
      }}
    />
  );
}
