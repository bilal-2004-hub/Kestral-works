import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Layers, Cpu, Code2, ShieldCheck, Zap } from 'lucide-react';
import Services from '../../components/public/Services.jsx';
import Process from '../../components/public/Process.jsx';
import FAQ from '../../components/public/FAQ.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';
import Button from '../../components/ui/Button.jsx';
import { Link } from 'react-router-dom';

const TECH_STACKS = [
  { name: 'React / Next.js', role: 'Frontend Architecture' },
  { name: 'Node.js & Express', role: 'REST & GraphQL Services' },
  { name: 'Firebase & Firestore', role: 'Real-time Cloud Database & Auth' },
  { name: 'GSAP & Framer Motion', role: 'Fluid 60fps Micro-interactions' },
  { name: 'TailwindCSS & CSS3', role: 'Responsive Modern UI Systems' },
  { name: 'PostgreSQL & Cloud SQL', role: 'Relational Data Storage' },
  { name: 'Docker & Google Cloud', role: 'CI/CD & Serverless Containers' },
  { name: 'Figma & Design Tokens', role: 'Design Systems & Prototyping' },
];

export default function ServicesPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-10 h-96 w-96 rounded-full bg-accent-primary/20 blur-[130px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              Full-Spectrum Digital Services
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Capabilities built to scale your business.
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              From bespoke web architectures and SaaS client portals to high-converting eCommerce and fluid motion design, we engineer end-to-end solutions that drive undeniable business growth.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid with Expandable Modals */}
      <Services />

      {/* Technology Stack Showcase */}
      <section className="py-24 bg-marine-950 border-b border-white/5">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Technology Ecosystem</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Modern, battle-tested technologies
            </h2>
            <p className="mt-3 text-base text-marine-100/75">
              We choose stacks engineered for lightning-fast speeds, rock-solid security, and effortless maintainability.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TECH_STACKS.map((tech, idx) => (
              <div key={idx} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-2xl backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-marine-950 font-mono text-xs font-bold">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">{tech.name}</h3>
                  <p className="text-xs text-marine-100/60 mt-0.5">{tech.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process & Delivery Cadence */}
      <Process />

      {/* FAQ */}
      <FAQ />

      {/* Contact Section */}
      <ContactForm />
    </div>
  );
}
