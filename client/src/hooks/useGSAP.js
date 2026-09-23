import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useGSAP — mounts a GSAP context scoped to a container ref.
 * Automatically reverts on unmount and respects prefers-reduced-motion.
 *
 * Usage:
 *   const containerRef = useRef();
 *   useGSAP(() => {
 *     gsap.from('.my-el', { opacity: 0, y: 40, … });
 *   }, containerRef);
 */
export function useGSAP(setup, containerRef, deps = []) {
  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(setup, containerRef.current ?? undefined);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useScrollReveal — simple fade-up animation when el enters viewport.
 */
export function useScrollReveal(ref, options = {}) {
  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !ref.current) return;

    const el = ref.current;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: options.y ?? 40 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.8,
        ease: options.ease ?? 'power3.out',
        delay: options.delay ?? 0,
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [ref, options.delay]);
}

/**
 * useCountUp — animates a number from 0 to `target` when el enters viewport.
 */
export function useCountUp(ref, target, options = {}) {
  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !ref.current) return;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration: options.duration ?? 1.8,
      ease: options.ease ?? 'power2.out',
      delay: options.delay ?? 0,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      onUpdate() {
        if (ref.current) {
          ref.current.textContent =
            options.format
              ? options.format(obj.val)
              : Math.round(obj.val).toString();
        }
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [target]);
}

export { gsap, ScrollTrigger };
