import { Sparkles } from 'lucide-react';
import FAQ from '../../components/public/FAQ.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';

export default function FAQPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-accent-primary/20 blur-[130px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              Frequently Asked Questions
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Questions & Answers
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              Find detailed explanations regarding how our client portal operates, contract structures, engineering timelines, IP ownership, and post-launch support.
            </p>
          </div>
        </div>
      </section>

      {/* Main FAQ Accordion */}
      <FAQ showHeading={false} />

      {/* Contact Section */}
      <ContactForm />
    </div>
  );
}
