// Motion for gesture-driven UI, after Apple's "Designing Fluid Interfaces"
// (WWDC 2018), via the apple-design skill. Shared by the slider swipe
// (components/product/Slider.tsx) and the before/after divider
// (components/product/BeforeAfterSlider.tsx), so both move alike.

// The spring, in Apple's two designer terms: damping ratio 1 settles without
// overshoot (nothing here should wobble); response is roughly how long it takes
// to get there, in seconds.
const DAMPING = 1;
const RESPONSE = 0.38;
const STIFFNESS = ((2 * Math.PI) / RESPONSE) ** 2;
const FRICTION = (4 * Math.PI * DAMPING) / RESPONSE;

/**
 * Advance the spring by `dt` seconds. `x` is the distance still to go to the
 * target and `v` the velocity, in any one unit (px, %) per second. Small fixed
 * sub-steps keep it stable on a slow frame. Returns the new [x, v].
 */
export function springStep(x: number, v: number, dt: number): [number, number] {
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    v += (-STIFFNESS * x - FRICTION * v) * h;
    x += v * h;
  }
  return [x, v];
}

/** Movement (px) before a touch counts as a drag one way or a scroll the other. */
export const LOCK = 8;

/** Where a flick moving at `velocity` px/s would come to rest, px from here
 *  (Apple's scroll deceleration rate). */
export const project = (velocity: number, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

/** Past a boundary the thing follows less and less, but never stops dead. */
export const rubberband = (overshoot: number, size: number) =>
  (overshoot * size * 0.55) / (size + 0.55 * Math.abs(overshoot));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
