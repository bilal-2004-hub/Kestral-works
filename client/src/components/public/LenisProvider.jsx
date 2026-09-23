import { useEffect } from 'react';

/**
 * LenisProvider — initialises Lenis smooth scrolling for the public website.
 * Only activates when the user has no preference for reduced motion.
 * Integrates with GSAP ScrollTrigger if it is present.
 */
export default function LenisProvider({ children }) {
  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let lenis;
    let raf;

    async function init() {
      try {
        const { default: Lenis } = await import('lenis');
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          smoothWheel: true,
        });
        window.__lenis = lenis;

        // Connect to GSAP ScrollTrigger if loaded
        try {
          const { ScrollTrigger } = await import('gsap/ScrollTrigger');
          lenis.on('scroll', ScrollTrigger.update);
        } catch {
          // ScrollTrigger not loaded yet — no-op
        }

        function animate(time) {
          lenis.raf(time);
          raf = requestAnimationFrame(animate);
        }
        raf = requestAnimationFrame(animate);
      } catch (err) {
        // Lenis failed to init — fall back to native scroll
        console.warn('Lenis init failed, using native scroll', err);
      }
    }

    init();

    return () => {
      cancelAnimationFrame(raf);
      window.__lenis = null;
      lenis?.destroy();
    };
  }, []);

  return children;
}
