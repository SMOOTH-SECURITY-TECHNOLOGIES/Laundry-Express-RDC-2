/**
 * HapticFeedback — Utility for tactile feedback on mobile devices
 * Uses the Vibration API where available
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [40, 50, 40],
};

export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(PATTERNS[pattern]);
  }
};

/**
 * Hook for haptic feedback on touch events
 */
export const useHapticFeedback = () => {
  const vibrate = (pattern: HapticPattern = 'light') => {
    triggerHaptic(pattern);
  };

  const onTouchStart = (pattern: HapticPattern = 'light') => ({
    onTouchStart: () => vibrate(pattern),
  });

  const onClick = (pattern: HapticPattern = 'light') => ({
    onClick: () => vibrate(pattern),
  });

  return { vibrate, onTouchStart, onClick };
};

export default triggerHaptic;
