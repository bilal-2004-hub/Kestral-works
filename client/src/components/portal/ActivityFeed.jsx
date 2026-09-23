import React from 'react';

export default function ActivityFeed({ activities = [], className = '' }) {
  if (!activities || activities.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-white/15 bg-marine-900/40 p-6 text-center text-sm text-marine-100/60 ${className}`}>
        No live activity recorded yet. Updates will appear in real time.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-2xl backdrop-blur-md text-white ${className}`}>
      <h3 className="text-base font-semibold text-white mb-4">Live Activity & Progress Log</h3>
      <div className="flow-root">
        <ul className="-mb-6 divide-y divide-white/5">
          {activities.slice(0, 10).map((act, index) => (
            <li key={act._id || index} className="py-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  {act.reason || act.title || 'Progress updated'}
                </span>
                <span className="font-mono text-marine-100/50">
                  {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
              </div>
              {(act.previousProgress !== undefined && act.newProgress !== undefined) && (
                <div className="mt-1 flex items-center gap-2 text-xs font-mono text-marine-100/70">
                  <span>Progress shifted:</span>
                  <span className="text-marine-100/50">{act.previousProgress}%</span>
                  <span>→</span>
                  <span className="font-bold text-signal-400">{act.newProgress}%</span>
                </div>
              )}
              {act.changedBy?.name && (
                <div className="mt-0.5 text-xs text-marine-100/40">
                  By {act.changedBy.name}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
