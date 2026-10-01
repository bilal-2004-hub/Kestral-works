import { readableStatus } from '../../utils/format.js';

/* Colour encodes state, but the label always carries the meaning on its own. */
const palette = {
  planning: 'bg-white/10 text-white/80 border-white/15',
  in_progress: 'bg-signal-500/15 text-signal-300 border-signal-500/30',
  client_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  revision: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  on_hold: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  pending: 'bg-white/10 text-white/70 border-white/15',
  review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  open: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  in_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  hidden: 'bg-white/5 text-white/40 border-white/10',
  new: 'bg-signal-500/20 text-signal-300 border-signal-500/30',
  read: 'bg-white/5 text-white/50 border-white/10',
  replied: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  archived: 'bg-white/5 text-white/40 border-white/10',
  urgent: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-medium',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
      ${palette[status] || palette.planning} ${className}`}>
      {readableStatus(status)}
    </span>
  );
}
