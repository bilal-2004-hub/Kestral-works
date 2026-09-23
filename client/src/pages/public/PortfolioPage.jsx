import { Sparkles } from 'lucide-react';
import Portfolio from '../../components/public/Portfolio.jsx';
import Testimonials from '../../components/public/Testimonials.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';

export default function PortfolioPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-accent-primary/20 blur-[130px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              Selected Client Work & Case Studies
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Digital products that outperform benchmarks.
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              Explore our recent work across web architecture, real-time client portals, mobile applications, and interactive platforms. Every project represents tailored engineering and measurable client impact.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Filterable Portfolio Component */}
      <Portfolio />

      {/* Client Feedback Testimonials */}
      <Testimonials />

      {/* Start Project CTA */}
      <ContactForm />
    </div>
  );
}
