import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 350px
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-marine-900/90 text-signal-400 border border-white/15 shadow-xl shadow-marine-950/60 backdrop-blur-xl hover:bg-signal-500 hover:text-marine-950 hover:border-signal-400 hover:shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-signal-400 focus:ring-offset-2 focus:ring-offset-marine-950"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
