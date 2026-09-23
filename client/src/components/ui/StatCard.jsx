export default function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-marine-900/60 border-white/10 text-white',
    accent: 'bg-signal-500/10 border-signal-500/30 text-white',
    marine: 'bg-marine-900 text-white border-white/15',
  };

  return (
    <div className={`rounded-2xl border flex items-start justify-between gap-4 p-6 shadow-2xl backdrop-blur-md ${tones[tone]}`}>
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-marine-100/60">{label}</p>
        <p className="mt-2 font-display text-3xl font-extrabold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-signal-400/80">{hint}</p>}
      </div>
      {Icon && (
        <span className="rounded-xl p-2.5 bg-white/5 border border-white/10 text-signal-400">
          <Icon size={22} />
        </span>
      )}
    </div>
  );
}
