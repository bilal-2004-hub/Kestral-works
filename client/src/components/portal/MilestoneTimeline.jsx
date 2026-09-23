import React from 'react';

export default function MilestoneTimeline({ milestones = [], className = '' }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-white/15 bg-marine-900/40 p-6 text-center text-sm text-marine-100/60 ${className}`}>
        No milestones defined for this project yet.
      </div>
    );
  }

  const sorted = [...milestones].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className={`rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-2xl backdrop-blur-md text-white ${className}`}>
      <h3 className="text-base font-semibold text-white mb-6">Milestones & Phases</h3>
      <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/15">
        {sorted.map((m, idx) => {
          const isDone = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';

          return (
            <div key={m._id || idx} className="relative mb-6 last:mb-0">
              {/* Node indicator */}
              <div
                className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-500 text-marine-950'
                    : isInProgress
                    ? 'border-signal-500 bg-marine-950 text-signal-400'
                    : 'border-white/20 bg-marine-950 text-transparent'
                }`}
              >
                {isDone ? (
                  <svg className="h-3 w-3 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`h-1.5 w-1.5 rounded-full ${isInProgress ? 'bg-signal-400 animate-pulse' : 'bg-transparent'}`} />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className={`text-sm font-semibold ${isDone ? 'text-marine-100/50 line-through' : 'text-white'}`}>
                  {m.name}
                </h4>
                <span
                  className={`rounded-lg px-2.5 py-0.5 text-xs font-mono font-bold capitalize ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isInProgress
                      ? 'bg-signal-500/20 text-signal-400 border border-signal-500/30'
                      : 'bg-white/10 text-white/60 border border-white/10'
                  }`}
                >
                  {m.status.replace('_', ' ')}
                </span>
              </div>

              {m.description && (
                <p className="mt-1 text-xs text-marine-100/70 leading-relaxed">{m.description}</p>
              )}

              {m.dueDate && (
                <div className="mt-2 text-xs font-mono text-marine-100/50">
                  Target: {new Date(m.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
