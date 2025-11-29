'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GradientColors {
  start: string;
  c1: string;
  c2: string;
  c3: string;
}

export interface GradientBackgroundProps {
  colors: GradientColors;
  className?: string;
}

/**
 * Animated gradient background component.
 *
 * Uses CSS custom properties and the `animate-gradient-grow` class from globals.css
 * to create a smooth radial gradient animation.
 *
 * @example
 * ```tsx
 * const colors = { start: '#0a1525', c1: '#1a3a60', c2: '#3065a0', c3: '#70a5d8' };
 * <GradientBackground colors={colors} />
 * ```
 *
 * CSS Dependencies (in globals.css):
 * - @property --gradient-color-1, --gradient-color-2, --gradient-color-3
 * - @keyframes gradient-grow
 * - .animate-gradient-grow
 */
export function GradientBackground({ colors, className }: GradientBackgroundProps) {
  return (
    <div
      className={cn('fixed inset-0 -z-10 animate-gradient-grow', className)}
      style={{
        '--start-color': colors.start,
        '--target-color-1': colors.c1,
        '--target-color-2': colors.c2,
        '--target-color-3': colors.c3,
      } as React.CSSProperties}
    />
  );
}

/**
 * Preset color palettes for common use cases.
 * Based on the "blue hour" gradient progression theme.
 */
export const gradientPresets: Record<string, GradientColors> = {
  midnightBlue: { start: '#0a1525', c1: '#1a3a60', c2: '#3065a0', c3: '#70a5d8' },
  forest: { start: '#102018', c1: '#285040', c2: '#408060', c3: '#60a080' },
  rose: { start: '#2a1820', c1: '#8b4a5e', c2: '#c46d7a', c3: '#e8a4a0' },
  sunset: { start: '#3a1a08', c1: '#c45e2a', c2: '#e88a4a', c3: '#f5c38a' },
  purple: { start: '#1a0a25', c1: '#3a1a60', c2: '#6530a0', c3: '#a570d8' },
  teal: { start: '#0a2520', c1: '#1a6050', c2: '#30a080', c3: '#70d8b0' },
  gold: { start: '#251a0a', c1: '#604a1a', c2: '#a08030', c3: '#d8c070' },
  lightGold: { start: '#1a1a0a', c1: '#4a4a1a', c2: '#808030', c3: '#c0c070' },
};
