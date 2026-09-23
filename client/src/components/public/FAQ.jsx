import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS_DATA = [
  {
    num: '01',
    question: 'How does the Client Portal operate during an active project?',
    answer:
      'Every client gets a dedicated, secure real-time portal where you can monitor milestone progression, view tasks, approve work-in-progress deliverables, give structured feedback with annotated comments, access invoice summaries, and chat directly with lead engineers without digging through email threads.',
    category: 'Portal & Collaboration',
  },
  {
    num: '02',
    question: 'What is your typical project timeline and delivery cadence?',
    answer:
      'Timelines depend on scope. A focused MVP or brand flagship typically delivers in 3 to 5 weeks, while comprehensive full-stack platforms and custom SaaS products span 8 to 14 weeks. We work in 1-2 week agile sprints with live staging demo reviews at the conclusion of each sprint.',
    category: 'Process & Timelines',
  },
  {
    num: '03',
    question: 'Do you offer post-launch support and infrastructure management?',
    answer:
      'Yes. All projects include 30 days of complimentary warranty support for bug fixes and performance tuning. We also offer dedicated monthly SLA maintenance tiers covering 24/7 uptime monitoring, security patching, cloud scaling, and ongoing feature sprints.',
    category: 'Support & Maintenance',
  },
  {
    num: '04',
    question: 'How are payments and milestone disbursements structured?',
    answer:
      'We operate on transparent milestone-based contracts. Typically, projects kick off with a 30% initial deposit, followed by milestone disbursements tied to verified demo approvals, with the final 20% due upon production deployment and IP handover.',
    category: 'Pricing & Contracts',
  },
  {
    num: '05',
    question: 'Do we own 100% of the code, designs, and intellectual property?',
    answer:
      'Unconditionally yes. Upon final milestone settlement, 100% of all intellectual property, source repositories, design files (Figma), database schemas, and cloud assets are transferred completely to your organization.',
    category: 'Legal & Ownership',
  },
  {
    num: '06',
    question: 'Can you work with our existing in-house engineering or design team?',
    answer:
      'Frequently. We can operate as a full autonomous pod delivering an entire product or integrate seamlessly as specialized staff augmentation for frontend architecture, design systems, or cloud backend engineering.',
    category: 'Team Integration',
  },
];

export default function FAQ({ limit = null, showHeading = true }) {
  const [openIndex, setOpenIndex] = useState(0);
  const items = limit ? FAQS_DATA.slice(0, limit) : FAQS_DATA;

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="relative scroll-mt-24 bg-marine-900/40 py-28 sm:py-36 text-white border-y border-white/5">
      <div className="container-page">
        {showHeading && (
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-10">
            <div>
              <div className="section-chip mb-3">
                <Sparkles size={13} className="text-signal-400" />
                <span>Knowledge & Answers</span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white">
                Frequently Asked <span className="text-signal-400">Questions</span>
              </h2>
            </div>
            <p className="max-w-md text-sm sm:text-base text-marine-100/75 leading-relaxed">
              Clear, transparent details about our collaboration model, intellectual property ownership, milestone disbursements, and client portal operations.
            </p>
          </div>
        )}

        {/* Minimalist Editorial Numbered Accordion */}
        <div className="mt-10 divide-y divide-white/10 border-b border-white/10">
          {items.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={faq.num} className="py-6 sm:py-8 transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-start justify-between gap-6 text-left focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-6 sm:gap-10 min-w-0">
                    <span className="font-mono text-sm sm:text-base font-bold text-signal-400 mt-1">
                      {faq.num}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-signal-400 transition-colors">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isOpen
                        ? 'bg-signal-500 text-marine-950 rotate-45'
                        : 'bg-white/10 text-white group-hover:bg-signal-500 group-hover:text-marine-950'
                    }`}
                  >
                    <Plus size={18} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 pl-12 sm:pl-16 pr-4 sm:pr-12">
                        <p className="text-base sm:text-lg leading-relaxed text-marine-100/80 max-w-3xl">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Bar */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-marine-900/80 p-6 border border-white/15 shadow-2xl">
          <div>
            <p className="font-display text-base font-bold text-white">Have a question that is not answered here?</p>
            <p className="text-xs text-marine-100/60 mt-0.5">We respond to technical and business inquiries within 4 hours.</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marine-950 hover:bg-signal-400 transition-colors shadow-sm shrink-0"
          >
            <span>Ask Us Directly</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
