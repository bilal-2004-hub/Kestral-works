import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-marine-900/40 px-6 py-14 text-center text-white">
      <span className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-signal-400">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {description && <p className="prose-measure text-sm text-marine-100/60 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
