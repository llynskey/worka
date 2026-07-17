import { Easing, Platform } from 'react-native';

/**
 * One shared motion language for the landing page so every animation uses the
 * same curve, timing and travel distance — the entrance cascade, the headline
 * cross-fade and the scroll reveals all move to the same rhythm rather than
 * each doing its own thing. Keeping these in one place is what makes the page
 * feel deliberate rather than busy.
 */
export const MOTION = {
  // Premium ease-out: quick to leave, gentle to settle.
  ease: Easing.bezier(0.2, 0.8, 0.2, 1),
  // Ease-in for exits (the outgoing headline).
  easeIn: Easing.bezier(0.4, 0, 0.75, 0.4),
  enter: 560, // ms — entrance / cross-fade in
  exit: 260, // ms — cross-fade out
  rise: 14, // px — vertical travel on entrance
  stagger: 90, // ms — gap between cascaded siblings
};

// CSS equivalent of MOTION.ease for web transitions (pressed states etc.).
export const CSS_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export const IS_WEB = Platform.OS === 'web';
