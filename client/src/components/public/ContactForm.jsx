import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, CheckCircle2, ArrowRight, Clock, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { Input, TextArea, Select } from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';
import { contactApi } from '../../services/endpoints.js';
import { useAction } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { COMPANY, SERVICES } from '../../utils/constants.js';

const BUDGET_RANGES = [
  '$5k – $15k',
  '$15k – $35k',
  '$35k – $75k',
  '$75k+',
  'Flexible / Open',
];

const TIMELINE_RANGES = [
  'ASAP (< 1 Month)',
  '1 – 3 Months',
  '3 – 6 Months',
  'Flexible',
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  service: '',
  budget: '',
  timeline: '',
  message: '',
  website: '',
};

export default function ContactForm({ isStandalone = false }) {
  const [form, setForm] = useState(emptyForm);
  const [sent, setSent] = useState(false);
  const { execute, pending, fieldErrors } = useAction(contactApi.send);
  const toast = useToast();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDirect = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        message: `[Estimated Budget: ${form.budget || 'Not specified'}] [Target Timeline: ${form.timeline || 'Not specified'}]\n\n${form.message}`,
      };
      await execute(payload);
      setForm(emptyForm);
      setSent(true);
      toast.success('Your project brief has been submitted. Our team will be in touch shortly.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit project brief. Please verify required fields.');
    }
  };

  return (
    <section
      id="contact"
      className={`relative scroll-mt-24 bg-marine-950 text-white overflow-hidden ${
        isStandalone ? 'py-16 sm:py-24' : 'py-28 sm:py-36'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-accent-primary/20 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-signal-500/10 blur-[150px]" />

      <div className="container-page relative z-10">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          {/* Left Column: Bold Agency Closing Statement */}
          <div className="lg:col-span-5">
            <div className="section-chip-dark mb-4">
              <Sparkles size={13} className="text-signal-400" />
              <span>Project Consultation</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-[0.98]">
              Have a Project <br />
              in Mind? <br />
              <span className="text-signal-400">Let's Talk.</span>
            </h2>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-marine-100/75">
              Tell us about your objectives, timeline, and technical requirements. You will hear directly from a lead systems architect within 4 business hours.
            </p>

            <div className="mt-12 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-signal-400 border border-white/15">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-marine-100/50">Direct Studio Email</p>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-base font-bold text-white hover:text-signal-400 transition-colors"
                  >
                    {COMPANY.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-signal-400 border border-white/15">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-marine-100/50">Studio Telephone</p>
                  <a
                    href={`tel:${COMPANY.phone}`}
                    className="text-base font-bold text-white hover:text-signal-400 transition-colors"
                  >
                    {COMPANY.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-signal-400 border border-white/15">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-marine-100/50">Headquarters</p>
                  <p className="text-base font-bold text-white">{COMPANY.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-2 text-xs font-mono text-marine-100/60">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>All briefs covered under mutual non-disclosure (NDA).</span>
            </div>
          </div>

          {/* Right Column: Clean Agency Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-start gap-4 py-8"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-500 text-marine-950 shadow-xl shadow-signal-500/30">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                    Your brief has been delivered.
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-marine-100/75">
                    Our technical leads are reviewing your project requirements and will prepare initial architectural insights along with available consultation slots.
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10 w-full flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="rounded-full bg-white/10 border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                    >
                      Send Another Inquiry
                    </button>
                    <span className="font-mono text-xs text-marine-100/50">
                      ID: #{Date.now().toString().slice(-6)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Alexander Wright"
                        value={form.name}
                        onChange={update('name')}
                        className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-marine-100/30 focus:border-signal-400 focus:bg-white/10 focus:outline-none transition-all"
                      />
                      {fieldErrors?.name && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="alexander@company.com"
                        value={form.email}
                        onChange={update('email')}
                        className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-marine-100/30 focus:border-signal-400 focus:bg-white/10 focus:outline-none transition-all"
                      />
                      {fieldErrors?.email && (
                        <p className="mt-1 text-xs text-rose-400">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                        Telephone (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 (555) 000-0000"
                        value={form.phone}
                        onChange={update('phone')}
                        className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-marine-100/30 focus:border-signal-400 focus:bg-white/10 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                        Company / Brand
                      </label>
                      <input
                        type="text"
                        name="company"
                        placeholder="Vanguard Enterprises"
                        value={form.company}
                        onChange={update('company')}
                        className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-marine-100/30 focus:border-signal-400 focus:bg-white/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                      Primary Service Area
                    </label>
                    <select
                      name="service"
                      value={form.service}
                      onChange={update('service')}
                      className="w-full rounded-xl bg-marine-900 border border-white/15 px-4 py-3 text-sm text-white focus:border-signal-400 focus:outline-none transition-all"
                    >
                      <option value="">Select an area of interest...</option>
                      {SERVICES.map((s) => (
                        <option key={s.name} value={s.name} className="bg-marine-950 text-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Selector Pills */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2.5">
                      Estimated Project Budget
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGET_RANGES.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setDirect('budget', b)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            form.budget === b
                              ? 'bg-signal-500 text-marine-950 shadow-md'
                              : 'bg-white/5 border border-white/15 text-marine-100/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Selector Pills */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2.5">
                      Target Launch Timeline
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TIMELINE_RANGES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDirect('timeline', t)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            form.timeline === t
                              ? 'bg-signal-500 text-marine-950 shadow-md'
                              : 'bg-white/5 border border-white/15 text-marine-100/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-marine-100/80 mb-2">
                      Project Scope & Goals *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Outline your project scope, target audiences, core deliverables, and success metrics..."
                      value={form.message}
                      onChange={update('message')}
                      className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-marine-100/30 focus:border-signal-400 focus:bg-white/10 focus:outline-none transition-all"
                    />
                    {fieldErrors?.message && (
                      <p className="mt-1 text-xs text-rose-400">{fieldErrors.message}</p>
                    )}
                  </div>

                  {/* Anti-spam honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={form.website}
                    onChange={update('website')}
                    className="hidden"
                  />

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full flex items-center justify-center gap-3 rounded-full bg-signal-500 py-4 px-8 text-xs font-extrabold uppercase tracking-wider text-marine-950 shadow-xl shadow-signal-500/20 hover:bg-signal-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <span>{pending ? 'Submitting Brief...' : 'Start a Conversation'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
