import { readableStatus } from '../../utils/format.js';

/* Colour encodes state, but the label always carries the meaning on its own. */
const palette = {
  planning: 'bg-mist-100 text-mist-600 border-mist-200',
  in_progress: 'bg-marine-100 text-marine-800 border-marine-300',
  client_review: 'bg-signal-100 text-signal-600 border-signal-400',
  revision: 'bg-orange-50 text-state-warn border-orange-200',
  completed: 'bg-emerald-50 text-state-ok border-emerald-200',
  on_hold: 'bg-mist-100 text-mist-600 border-mist-200',
  pending: 'bg-mist-100 text-mist-600 border-mist-200',
  review: 'bg-signal-100 text-signal-600 border-signal-400',
  open: 'bg-marine-100 text-marine-800 border-marine-300',
  in_review: 'bg-signal-100 text-signal-600 border-signal-400',
  resolved: 'bg-emerald-50 text-state-ok border-emerald-200',
  approved: 'bg-emerald-50 text-state-ok border-emerald-200',
  rejected: 'bg-red-50 text-state-bad border-red-200',
  hidden: 'bg-mist-100 text-mist-600 border-mist-200',
  new: 'bg-signal-100 text-signal-600 border-signal-400',
  read: 'bg-mist-100 text-mist-600 border-mist-200',
  replied: 'bg-emerald-50 text-state-ok border-emerald-200',
  archived: 'bg-mist-100 text-mist-600 border-mist-200',
  urgent: 'bg-red-50 text-state-bad border-red-200',
  high: 'bg-orange-50 text-state-warn border-orange-200',
  medium: 'bg-mist-100 text-mist-600 border-mist-200',
  low: 'bg-mist-100 text-mist-600 border-mist-200',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
      ${palette[status] || palette.planning} ${className}`}>
      {readableStatus(status)}
    </span>
  );
}
