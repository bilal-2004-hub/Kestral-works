import { useEffect, useState, useRef } from 'react';

/**
 * Hook to smoothly interpolate a numeric progress value over duration ms.
 */
export function useAnimatedProgress(targetValue, duration = 800) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const currentRef = useRef(targetValue);
  const targetRef = useRef(targetValue);
  const startRef = useRef(targetValue);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    targetRef.current = targetValue;
    startRef.current = currentRef.current;
    startTimeRef.current = null;

    if (startRef.current === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startRef.current + (targetRef.current - startRef.current) * eased);

      currentRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentRef.current = targetValue;
        setDisplayValue(targetValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}
