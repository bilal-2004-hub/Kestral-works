import { Sparkles, MapPin, Mail, Phone, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import ContactForm from '../../components/public/ContactForm.jsx';
import FAQ from '../../components/public/FAQ.jsx';
import { COMPANY } from '../../utils/constants.js';

export default function ContactPage() {
  return (
    <div className="pt-24 bg-marine-950 text-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-marine-950 py-20 text-white relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-accent-primary/20 blur-[130px]" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-signal-400 tracking-wide uppercase backdrop-blur-md">
              <Sparkles size={14} />
              Connect With Our Engineering Studio
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Let's build something extraordinary together.
            </h1>
            <p className="mt-6 text-lg text-marine-100/80 leading-relaxed">
              Have a new product, system overhaul, or urgent technical initiative? Share your brief and our technical architects will prepare tailored insights for your exploratory consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Interactive Contact Form */}
      <ContactForm isStandalone={true} />

      {/* FAQ for easy reference */}
      <FAQ limit={4} />
    </div>
  );
}
