import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Compass, Layout, Code2, ShieldCheck, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROCESS_STAGES = [
  {
    num: '01',
    title: 'Discover',
    headline: 'Deep Architectural & Problem Analysis',
    desc: 'We unearth the core commercial objective, analyze user pain points, audit technical constraints, and define quantitative KPIs before a single wireframe or line of code is written.',
    deliverables: ['Technical Feasibility Study', 'User Journey Mapping', 'KPI Definition & Scope Matrix'],
    icon: Search,
  },
  {
    num: '02',
    title: 'Plan',
    headline: 'Sprint Roadmap & Technology Strategy',
    desc: 'We map out a milestone-driven sprint schedule with explicit deliverable checkpoints, database schema models, and cloud infrastructure requirements.',
    deliverables: ['System Architecture Diagram', 'Two-Week Agile Sprint Plan', 'Deliverable Acceptance Criteria'],
    icon: Compass,
  },
  {
    num: '03',
    title: 'Design',
    headline: 'Interactive Prototyping & Design Systems',
    desc: 'We craft high-fidelity Figma components, design tokens, responsive layouts, and fluid micro-interactions with live prototype walkthroughs for client feedback.',
    deliverables: ['Design Token Architecture', 'High-Fidelity Figma Prototypes', 'Design System Library'],
    icon: Layout,
  },
  {
    num: '04',
    title: 'Build',
    headline: 'Clean Code & Real-Time Workspace Sync',
    desc: 'Our full-stack engineers build the application using React, Node.js, and Firebase. All tasks, milestone burn rates, and staging builds are tracked in your client workspace.',
    deliverables: ['Production React Codebase', 'REST / GraphQL APIs & Firestore', 'Staging Preview Deployments'],
    icon: Code2,
  },
  {
    num: '05',
    title: 'Test',
    headline: 'Rigorous QA & Security Hardening',
    desc: 'End-to-end automated testing, cross-browser compatibility, Lighthouse performance optimization, accessibility (a11y) audits, and Firebase security rule verification.',
    deliverables: ['Automated Test Suite', 'Performance & CWV 95+ Audit', 'Security Rules Certification'],
    icon: ShieldCheck,
  },
  {
    num: '06',
    title: 'Launch',
    headline: 'Zero-Downtime Release & IP Handover',
    desc: 'Production deployment with zero downtime, DNS cutover, analytics telemetry tracking, complete repository IP handover, and 30 days of warranty support.',
    deliverables: ['Production Cloud Deployment', '100% IP & Asset Handover', '30-Day Post-Launch SLA'],
    icon: Rocket,
  },
];

export default function Process() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="process" className="relative scroll-mt-24 bg-marine-950 py-28 sm:py-36 text-white">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-10">
          <div>
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Delivery Blueprint</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white">
              The 6-Stage <span className="text-signal-400">Blueprint</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-marine-100/75 leading-relaxed">
            A battle-tested methodology designed for radical clarity, velocity, and zero surprises from kickoff to production release.
          </p>
        </div>

        {/* Interactive Storytelling Timeline */}
        <div className="mt-14 grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Column: Stage Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {PROCESS_STAGES.map((stage, idx) => {
              const isSelected = activeStage === idx;
              const Icon = stage.icon;

              return (
                <button
                  key={stage.num}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`flex w-full items-center justify-between p-5 rounded-2xl transition-all duration-300 text-left border ${
                    isSelected
                      ? 'bg-signal-500 text-marine-950 border-signal-500 shadow-xl font-bold'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] text-white border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isSelected ? 'text-marine-950' : 'text-signal-400'
                      }`}
                    >
                      {stage.num}
                    </span>
                    <span className="font-display text-lg font-bold tracking-tight">
                      {stage.title}
                    </span>
                  </div>
                  <Icon
                    size={18}
                    className={isSelected ? 'text-marine-950' : 'text-marine-100/40'}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Stage Detail Display Card */}
          <div className="lg:col-span-7">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-white/15 bg-marine-900/60 p-8 sm:p-10 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-signal-400 uppercase tracking-widest">
                    Stage {PROCESS_STAGES[activeStage].num} of 06
                  </span>
                </div>
                <span className="rounded-full bg-signal-500 text-marine-950 font-mono text-xs px-3 py-1 font-bold">
                  {PROCESS_STAGES[activeStage].title}
                </span>
              </div>

              <h3 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-white">
                {PROCESS_STAGES[activeStage].headline}
              </h3>

              <p className="mt-4 text-base leading-relaxed text-marine-100/75">
                {PROCESS_STAGES[activeStage].desc}
              </p>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-signal-400 font-mono mb-4">
                  Verified Stage Deliverables
                </h4>
                <div className="space-y-3">
                  {PROCESS_STAGES[activeStage].deliverables.map((del, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-3 text-sm text-marine-100/85 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <Link
                  to="/process"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-signal-400 hover:text-white transition-colors link-underline"
                >
                  <span>Explore Complete 10-Step Timeline</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full bg-signal-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-marine-950 hover:bg-signal-400 transition-colors shadow-sm"
                >
                  Kickoff Project
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
