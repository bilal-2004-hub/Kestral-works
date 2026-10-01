import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft, Target, DollarSign, Calendar } from 'lucide-react';
import { projectRequestApi } from '../../services/endpoints.js';

const SERVICES = [
  { label: 'Web Development', emoji: '🌐' },
  { label: 'Mobile App Development', emoji: '📱' },
  { label: 'UI/UX Design', emoji: '🎨' },
  { label: 'Graphic Design', emoji: '✏️' },
  { label: 'Software Development', emoji: '💻' },
  { label: 'Digital Marketing', emoji: '📣' },
  { label: 'SEO', emoji: '🔍' },
  { label: 'E-commerce Development', emoji: '🛒' },
  { label: 'Content Writing', emoji: '📝' },
  { label: 'Video Editing', emoji: '🎬' },
  { label: 'Custom Software Solutions', emoji: '⚙️' },
  { label: 'Other', emoji: '💡' },
];

const BUDGET_OPTIONS = [
  'Under $1,000',
  '$1,000 – $5,000',
  '$5,000 – $15,000',
  '$15,000 – $50,000',
  '$50,000+',
  'Not sure yet',
];

const EMPTY_FORM = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  companyName: '',
  projectTitle: '',
  projectDescription: '',
  serviceField: '',
  goals: '',
  budget: '',
  deadline: '',
  additionalRequirements: '',
};

export default function StartProjectModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitted(false);
      setApiError('');
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key) => (e) => {
    const val = typeof e === 'string' ? e : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((err) => ({ ...err, [key]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Your name is required';
    if (!form.customerEmail.trim() || !/\S+@\S+\.\S+/.test(form.customerEmail)) e.customerEmail = 'A valid email is required';
    if (!form.projectTitle.trim()) e.projectTitle = 'A project title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.serviceField) e.serviceField = 'Please select a service field';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setApiError('');
    setSubmitting(true);
    try {
      await projectRequestApi.submit(form);
      setSubmitted(true);
    } catch (err) {
      setApiError(err?.response?.data?.message || err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start a Project"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-marine-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-marine-950 shadow-2xl text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-marine-950/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-signal-500 to-amber-600 text-marine-950 shadow-md">
              <Sparkles size={16} className="text-marine-950" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                {submitted ? 'Request Submitted!' : 'Start a Project'}
              </h2>
              {!submitted && (
                <p className="text-xs font-mono text-marine-100/60">Step {step} of 3</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-marine-100/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        {!submitted && (
          <div className="h-1 bg-white/5">
            <div
              className="h-1 bg-gradient-to-r from-signal-500 to-accent-primary transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {/* ─── Success State ─────────────────────────────────────────────────── */}
          {submitted && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">You're all set!</h3>
                <p className="mt-2 text-sm text-marine-100/80 max-w-md mx-auto leading-relaxed">
                  Your project request has been permanently recorded and automatically matched to our registered specialists.
                </p>
                <p className="mt-4 text-xs font-mono text-marine-100/60">
                  Confirmation sent to: <span className="font-semibold text-signal-400">{form.customerEmail}</span>
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="rounded-xl bg-signal-500 px-7 py-3 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-lg shadow-signal-500/20 hover:bg-signal-400 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 1: Contact & Project Info ────────────────────────────────── */}
          {!submitted && step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-white">About you & your project</h3>
                <p className="mt-1 text-xs text-marine-100/60">Tell us who you are and what you're looking to build.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Your name" required error={errors.customerName}>
                  <input
                    id="customerName"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.customerName}
                    onChange={set('customerName')}
                    className={inputClass(errors.customerName)}
                  />
                </FormField>
                <FormField label="Email address" required error={errors.customerEmail}>
                  <input
                    id="customerEmail"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.customerEmail}
                    onChange={set('customerEmail')}
                    className={inputClass(errors.customerEmail)}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone number">
                  <input
                    id="customerPhone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.customerPhone}
                    onChange={set('customerPhone')}
                    className={inputClass()}
                  />
                </FormField>
                <FormField label="Company name">
                  <input
                    id="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    value={form.companyName}
                    onChange={set('companyName')}
                    className={inputClass()}
                  />
                </FormField>
              </div>

              <FormField label="Project title" required error={errors.projectTitle}>
                <input
                  id="projectTitle"
                  type="text"
                  placeholder="e.g. Next-Gen Mobile App or Web Platform"
                  value={form.projectTitle}
                  onChange={set('projectTitle')}
                  className={inputClass(errors.projectTitle)}
                />
              </FormField>

              <FormField label="Project description">
                <textarea
                  id="projectDescription"
                  rows={3}
                  placeholder="Briefly describe what you need built, redesigned, or scaled…"
                  value={form.projectDescription}
                  onChange={set('projectDescription')}
                  className={inputClass() + ' resize-none'}
                />
              </FormField>
            </div>
          )}

          {/* ─── Step 2: Service & Budget ───────────────────────────────────────── */}
          {!submitted && step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Service field & budget</h3>
                <p className="mt-1 text-xs text-marine-100/60">
                  Select your required service. This matches your project directly to registered clients with this skill.
                </p>
              </div>

              {errors.serviceField && (
                <p className="flex items-center gap-1.5 text-xs font-mono text-red-400">
                  <AlertCircle size={14} /> {errors.serviceField}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SERVICES.map(({ label, emoji }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set('serviceField')(label)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition-all ${
                      form.serviceField === label
                        ? 'border-signal-500 bg-signal-500/20 font-bold text-signal-300 shadow-md'
                        : 'border-white/10 bg-marine-900/60 text-marine-100/80 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>

              <FormField label="Budget range">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('budget')(opt)}
                      className={`rounded-xl border px-3 py-2 text-xs font-mono transition-all ${
                        form.budget === opt
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'border-white/10 bg-marine-900/60 text-marine-100/60 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Preferred deadline">
                <input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={set('deadline')}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass()}
                />
              </FormField>
            </div>
          )}

          {/* ─── Step 3: Goals & Final Details ─────────────────────────────────── */}
          {!submitted && step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Goals & final details</h3>
                <p className="mt-1 text-xs text-marine-100/60">Help us understand what success looks like for this project.</p>
              </div>

              <FormField label="Project goals">
                <textarea
                  id="goals"
                  rows={3}
                  placeholder="What are the main outcomes you want to achieve? (e.g. increase conversions, launch MVP, improve UX)"
                  value={form.goals}
                  onChange={set('goals')}
                  className={inputClass() + ' resize-none'}
                />
              </FormField>

              <FormField label="Additional requirements or notes">
                <textarea
                  id="additionalRequirements"
                  rows={3}
                  placeholder="Any specific technologies, preferences, constraints, or design inspirations…"
                  value={form.additionalRequirements}
                  onChange={set('additionalRequirements')}
                  className={inputClass() + ' resize-none'}
                />
              </FormField>

              {/* Summary card */}
              <div className="rounded-xl border border-white/10 bg-marine-900/80 p-4 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-signal-400">Request Summary</h4>
                <dl className="space-y-1.5 text-xs">
                  <Row label="Project" value={form.projectTitle} />
                  <Row label="Service" value={form.serviceField} />
                  {form.budget && <Row label="Budget" value={form.budget} />}
                  {form.deadline && <Row label="Deadline" value={new Date(form.deadline).toLocaleDateString()} />}
                </dl>
              </div>

              {apiError && (
                <p className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={14} /> {apiError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!submitted && (
          <div className="sticky bottom-0 flex items-center justify-between border-t border-white/10 bg-marine-950/95 px-6 py-4 backdrop-blur-md">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-marine-100/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-marine-100/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 rounded-xl bg-signal-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-lg shadow-signal-500/20 hover:bg-signal-400 transition-all"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-signal-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-lg shadow-signal-500/20 hover:bg-signal-400 transition-all disabled:opacity-60"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function FormField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono uppercase tracking-wider text-marine-100/80">
        {label}{required && <span className="ml-1 text-signal-400 font-bold">*</span>}
      </label>
      {children}
      {error && <p className="flex items-center gap-1 text-[11px] font-mono text-red-400"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-marine-100/50 font-mono">{label}:</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}

function inputClass(error = '') {
  return `w-full rounded-xl border px-3.5 py-2.5 text-xs text-white bg-marine-900/80 placeholder:text-marine-100/30 transition-all focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-500/60 bg-red-500/10 focus:ring-red-400 text-white'
      : 'border-white/10 focus:border-signal-400 focus:ring-signal-500/20 focus:bg-marine-900'
  }`;
}
