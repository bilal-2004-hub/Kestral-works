import { Sparkles, CheckCircle2, ShieldCheck, Clock, FileCheck2, Cpu } from 'lucide-react';
import Process from '../../components/public/Process.jsx';
import FAQ from '../../components/public/FAQ.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';

const PILLARS = [
  {
    icon: Clock,
    title: 'Agile 2-Week Sprints',
    desc: 'Transparent sprint cadence with verifiable staging demos and actionable milestones at every step.',
  },
  {
    icon: FileCheck2,
    title: 'Live Workspace Tracking',
    desc: 'Clients monitor progress in real-time, review deliverables, annotate comments, and approve tasks directly.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Technical Debt Guarantee',
    desc: 'Rigorous linting, automated testing, semantic versioning, and continuous security audits before release.',
  },
  {
    icon: Cpu,
    title: 'Modern CI/CD Deployment',
    desc: 'Automated preview pipelines for rapid feedback loops and seamless production zero-downtime rollouts.',
  },
];

export default function ProcessPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-accent-primary/20 blur-[130px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              The Agency Engineering Standard
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              How we take projects from concept to production.
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              We eliminated bureaucratic agency bloat. Our 10-stage delivery blueprint ensures absolute clarity, rapid execution cycles, and continuous client collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Pillars */}
      <section className="py-20 bg-marine-900/30 border-b border-white/5">
        <div className="container-page">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-marine-900/60 p-7 shadow-2xl backdrop-blur-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500 text-marine-950 font-bold">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold text-white">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-marine-100/70">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive 6-Step Timeline */}
      <Process />

      {/* FAQ */}
      <FAQ />

      {/* Contact Inquiry */}
      <ContactForm />
    </div>
  );
}
