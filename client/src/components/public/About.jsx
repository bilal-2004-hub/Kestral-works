import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useCountUp, useScrollReveal } from '../../hooks/useGSAP.js';
import { Sparkles, Target, Compass, Award, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { COMPANY } from '../../utils/constants.js';
import { Link } from 'react-router-dom';

const STATS = [
  { value: 140, suffix: '+', label: 'Projects Delivered', detail: 'Across web architecture, mobile apps, and SaaS platforms.' },
  { value: 9, suffix: '+', label: 'Years Studio Mastery', detail: 'Crafting high-velocity digital solutions since 2016.' },
  { value: 98, suffix: '%', label: 'Returning Client Rate', detail: 'Long-term partnership retention with enterprise clients.' },
  { value: 99, suffix: '.9%', label: 'Cloud System Uptime', detail: 'Enterprise-grade reliability and real-time observability.' },
];

function StatCard({ stat }) {
  const countRef = useCountUp(stat.value, 1.8);
  return (
    <div className="border-l-2 border-signal-500 pl-6 py-2">
      <div className="flex items-baseline gap-1">
        <span ref={countRef} className="font-display text-4xl sm:text-5xl font-black text-white">
          0
        </span>
        <span className="font-display text-3xl sm:text-4xl font-black text-signal-400">
          {stat.suffix}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold uppercase tracking-wider text-white">
        {stat.label}
      </p>
      <p className="mt-1 text-xs text-marine-100/60 leading-relaxed max-w-xs">
        {stat.detail}
      </p>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 bg-marine-900/30 py-28 sm:py-36 text-white border-y border-white/5">
      <div className="container-page">
        {/* Editorial Storytelling Statement */}
        <div className="max-w-4xl">
          <div className="section-chip mb-4">
            <Sparkles size={13} className="text-signal-400" />
            <span>The Agency Philosophy</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-[1.02]">
            We don't just build software.{' '}
            <span className="text-signal-400">
              We build digital experiences people remember.
            </span>
          </h2>

          <p className="mt-8 text-base sm:text-xl leading-relaxed text-marine-100/80">
            Founded with the conviction that great digital products demand uncompromising engineering and radical transparency, {COMPANY.name} bridges the gap between visionary product design and robust cloud architecture.
          </p>
        </div>

        {/* Asymmetric Studio Composition */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 items-center">
          {/* Left: Studio Image with Floating Overlay Badge */}
          <div className="relative lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl bg-marine-950 border border-white/15 shadow-2xl aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80"
                alt="Our Engineering & Design Studio"
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-marine-950/80 via-transparent to-transparent" />
            </div>

            {/* Floating Trust Badge */}
            <div className="absolute -bottom-6 -right-4 sm:bottom-6 sm:-right-6 rounded-2xl bg-marine-900/95 backdrop-blur-xl p-5 shadow-2xl border border-white/15 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-marine-950 font-bold">
                  ★
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Zero Bureaucracy</p>
                  <p className="text-[11px] text-marine-100/60 mt-0.5">Direct communication with lead systems engineers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Narrative & Engineering Pillars */}
          <div className="lg:col-span-6 space-y-8 lg:pl-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                A modern collective built for speed and fidelity.
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-marine-100/70">
                Traditional agencies bury clients in layers of account managers, vague estimates, and disjointed handoffs. At {COMPANY.name}, our clients collaborate directly in a live workspace with access to real-time sprint burndowns, interactive staging previews, and automated deliverable approvals.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-start gap-3.5">
                <CheckCircle2 size={20} className="text-signal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Architectural Rigor</h4>
                  <p className="text-xs text-marine-100/60 mt-0.5">Clean TypeScript codebases, modular component systems, and zero technical debt shortcuts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 size={20} className="text-signal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Live Transparency</h4>
                  <p className="text-xs text-marine-100/60 mt-0.5">Dedicated client portal with real-time milestone tracking, task feedback, and file archives.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <CheckCircle2 size={20} className="text-signal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Guaranteed IP Transfer</h4>
                  <p className="text-xs text-marine-100/60 mt-0.5">100% intellectual property, design source files, and cloud repository handover upon release.</p>
                </div>
              </div>
            </div>

            <div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-signal-400 hover:text-white transition-colors link-underline"
              >
                <span>Read more about our leadership & values</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Visual Animated Numbers Grid */}
        <div className="mt-28 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/10 pt-14">
          {STATS.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
