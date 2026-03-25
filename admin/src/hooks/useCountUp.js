import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 (or start) to end over the given duration.
 * @param {number} end - Target value
 * @param {number} duration - Animation duration in ms
 * @param {boolean} enabled - Whether to run animation (e.g. when data has loaded)
 * @param {number} start - Starting value (default 0)
 */
export function useCountUp(end, duration = 800, enabled = true, start = 0) {
  const [value, setValue] = useState(enabled ? start : end);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!enabled || end == null) {
      setValue(end ?? start);
      return;
    }
    const target = typeof end === 'number' ? end : parseInt(end, 10) || 0;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for snappy finish
      const eased = progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (target - start) * eased);
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, enabled, start]);

  return value;
}
