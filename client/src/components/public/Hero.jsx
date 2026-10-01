import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, ShieldCheck, Activity } from 'lucide-react';
import { COMPANY } from '../../utils/constants.js';
import StartProjectModal from '../ui/StartProjectModal.jsx';

// Animation variants for rock-solid Framer Motion execution
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const lineVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const fadeUpVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  const scrollToWork = (e) => {
    e.preventDefault();
    document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-marine-950 text-white pt-28 pb-14 lg:pt-36 lg:pb-16"
      aria-label="Hero"
    >
      <StartProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      {/* Ambient background lighting & grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-accent-primary/25 blur-[160px] animate-floatSlow" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[550px] w-[550px] rounded-full bg-signal-500/10 blur-[150px] animate-float" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[350px] w-[350px] rounded-full bg-marine-500/10 blur-[120px]" />

        {/* Minimal dot-grid overlay */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="agency-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#agency-grid)" />
        </svg>
      </div>

      {/* Main Content Area */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container-page relative z-10 my-auto"
      >
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 items-center">
          {/* Headline and Copy */}
          <div>
            {/* Agency Badge */}
            <motion.div
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-signal-400 backdrop-blur-md mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-signal-400 animate-pulse" />
              <span>Independent Digital Agency · Est. 2016</span>
            </motion.div>

            {/* Huge Cinematic Agency Headline */}
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.25rem] font-extrabold uppercase tracking-tight leading-[1.02] text-white">
              <motion.span variants={lineVariants} className="block">
                We Build
              </motion.span>
              <motion.span
                variants={lineVariants}
                className="block bg-gradient-to-r from-white via-marine-100 to-signal-400 bg-clip-text text-transparent"
              >
                Digital
              </motion.span>
              <motion.span variants={lineVariants} className="block">
                Experiences
              </motion.span>
              <motion.span variants={lineVariants} className="block text-marine-200">
                That Move Business.
              </motion.span>
            </h1>

            {/* Supporting paragraph */}
            <motion.p
              variants={fadeUpVariants}
              className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-marine-100/80"
            >
              {COMPANY.name} crafts bespoke web platforms, high-velocity digital products, and design systems for forward-thinking brands. Every engagement is backed by an authenticated, real-time client workspace.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUpVariants} className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-full bg-signal-500 px-8 py-4 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-xl shadow-signal-500/25 hover:bg-signal-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Start a Project</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="#work"
                onClick={scrollToWork}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:border-white/40 hover:bg-white/10 transition-all"
              >
                <span>View Selected Work</span>
                <ArrowDown size={14} />
              </a>
            </motion.div>

            {/* Key Metrics Banner */}
            <motion.div
              variants={fadeUpVariants}
              className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-7 max-w-lg"
            >
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold text-signal-400">140+</p>
                <p className="text-xs uppercase tracking-wider text-marine-100/60 mt-1">Shipped Projects</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold text-signal-400">09+</p>
                <p className="text-xs uppercase tracking-wider text-marine-100/60 mt-1">Years Mastery</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold text-signal-400">98%</p>
                <p className="text-xs uppercase tracking-wider text-marine-100/60 mt-1">Client Retention</p>
              </div>
            </motion.div>
          </div>

          {/* Interactive Workspace Preview Widget (Agency Differentiator) */}
          <motion.div
            variants={fadeUpVariants}
            className="relative"
          >
            <div className="relative rounded-3xl border border-white/15 bg-marine-900/60 p-7 backdrop-blur-xl shadow-2xl shadow-marine-950/80">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/20 text-signal-400">
                    <Activity size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-signal-400">Live Client Workspace</span>
                    <h3 className="text-base font-bold text-white">Apex Cloud Platform v3.0</h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sprint Active
                </span>
              </div>

              {/* Progress visual */}
              <div className="mt-6 rounded-2xl bg-white/[0.04] p-4 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-marine-100/70 font-medium">Sprint 04 Milestone Progress</span>
                  <span className="font-mono font-bold text-signal-400">78% Complete</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-marine-400 via-signal-400 to-signal-500" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-marine-100/50 font-mono">
                  <span>6 of 8 Tasks Approved</span>
                  <span>Target Handover: Oct 18</span>
                </div>
              </div>

              {/* Real-time Sprint Tasks */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-white truncate font-medium">Design token architecture & Figma sync</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">Approved ✓</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-signal-400 shrink-0 animate-pulse" />
                    <span className="text-white truncate font-medium">Interactive 3D viewport integration</span>
                  </div>
                  <span className="text-[10px] font-mono text-signal-400 shrink-0">In Review</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-marine-400 shrink-0" />
                    <span className="text-white truncate font-medium">Real-time Firestore query optimization</span>
                  </div>
                  <span className="text-[10px] font-mono text-marine-300 shrink-0">In Progress</span>
                </div>
              </div>

              {/* Footer Trust strip */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-marine-100/60">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-signal-400" />
                  Private Client Encrypted
                </span>
                <Link to="/login" className="text-signal-400 font-semibold hover:underline">
                  Sign in to Portal →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Scroll Indicator */}
      <div className="container-page relative z-10 pt-10 flex items-center justify-between border-t border-white/10 text-xs text-marine-100/50">
        <span className="uppercase tracking-widest font-mono">Creative Digital Agency & Product Studio</span>
        <a
          href="#services"
          className="flex items-center gap-2 hover:text-signal-400 transition-colors uppercase tracking-widest font-mono"
        >
          <span>Scroll to explore</span>
          <ArrowDown size={14} className="animate-bounce" />
        </a>
      </div>
    </section>
  );
}
