import { motion } from 'framer-motion';
import { Sparkles, Target, Zap, Shield, Users, Award, Code2, Rocket } from 'lucide-react';
import About from '../../components/public/About.jsx';
import Testimonials from '../../components/public/Testimonials.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';

const VALUES = [
  {
    icon: Code2,
    title: 'Clean Architecture First',
    desc: 'We write scalable, documented, maintainable codebases with zero shortcuts. No technical debt swept under the rug.',
  },
  {
    icon: Users,
    title: 'Radical Transparency',
    desc: 'Live workspace visibility, real-time burn rates, direct developer communication, and no layers of account managers.',
  },
  {
    icon: Zap,
    title: 'Extreme Performance',
    desc: 'Sub-second page loads, 95+ Google Lighthouse scores, and 60fps animations engineered into every single release.',
  },
  {
    icon: Shield,
    title: 'Enterprise-grade Security',
    desc: 'Strict Firebase security rules, end-to-end data encryption, automated testing, and comprehensive code audits.',
  },
];

const LEADERSHIP = [
  {
    name: 'Julian Vance',
    role: 'Managing Principal & Systems Architect',
    bio: 'Former distributed systems lead with 12+ years designing high-throughput cloud infrastructure and reactive web systems.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Claire Moreau',
    role: 'Head of Interaction Design & Creative Direction',
    bio: 'Award-winning design lead passionate about micro-interactions, spatial interfaces, and cohesive design token architecture.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'David Kalu',
    role: 'Principal Full-Stack Engineer',
    bio: 'Specialist in React, Node.js, and Firebase ecosystems, driving high-velocity sprint cadence and zero-defect QA pipelines.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-accent-primary/15 blur-[120px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              About Our Studio
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Engineering digital products with uncompromising craftsmanship.
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              We are an autonomous engineering and product design collective. We partner with ambitious startups and modern enterprises to design, build, and deploy benchmark-setting digital experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Core Component with Counters & Story */}
      <About />

      {/* Our Engineering Values */}
      <section className="py-24 bg-marine-950 border-b border-white/5">
        <div className="container-page">
          <div className="max-w-2xl">
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Core Values</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Principles that guide our engineering
            </h2>
            <p className="mt-3 text-base text-marine-100/75">
              We hold ourselves to strict architectural and design standards that directly benefit your product's longevity.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="rounded-2xl border border-white/10 bg-marine-900/60 p-7 shadow-2xl backdrop-blur-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-500/15 text-signal-400 border border-signal-500/20">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-white">{val.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-marine-100/70">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership / Team */}
      <section className="py-24 bg-marine-900/30 border-b border-white/5">
        <div className="container-page">
          <div className="max-w-2xl">
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Leadership</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Leadership & Studio Leads
            </h2>
            <p className="mt-3 text-base text-marine-100/75">
              Direct access to seasoned engineers and designers from day one.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {LEADERSHIP.map((lead, i) => (
              <div key={i} className="group rounded-2xl border border-white/10 bg-marine-900/60 overflow-hidden shadow-2xl backdrop-blur-md transition-all hover:border-white/20">
                <div className="aspect-[4/3] overflow-hidden bg-marine-950">
                  <img
                    src={lead.image}
                    alt={lead.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-white">{lead.name}</h3>
                  <p className="text-xs font-semibold text-signal-400 uppercase tracking-wider mt-1">{lead.role}</p>
                  <p className="mt-3 text-sm text-marine-100/70 leading-relaxed">{lead.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <ContactForm />
    </div>
  );
}
