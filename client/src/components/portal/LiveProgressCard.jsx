import React from 'react';
import ProgressBar from '../ui/ProgressBar.jsx';
import ConnectionStatus from '../ui/ConnectionStatus.jsx';
import { useAnimatedProgress } from '../../hooks/useAnimatedProgress.js';

export default function LiveProgressCard({
  progress = 0,
  status = 'in_progress',
  tasks = [],
  lastProgressAt,
  lastReason,
  className = '',
}) {
  const animatedProgress = useAnimatedProgress(progress);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'review').length;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-2xl backdrop-blur-md text-white ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-marine-100/60">
            Overall Project Progress
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {animatedProgress}%
            </span>
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${
                status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : status === 'in_progress'
                  ? 'bg-signal-500/20 text-signal-400 border border-signal-500/30'
                  : 'bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <ConnectionStatus />
      </div>

      <div className="mt-5">
        <ProgressBar value={animatedProgress} size="lg" showPercentage={false} />
      </div>

      {/* Task statistics breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <span className="text-xs font-mono uppercase text-marine-100/60">Total Tasks</span>
          <p className="mt-1 text-xl font-bold text-white">{totalTasks}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
          <span className="text-xs font-mono uppercase text-emerald-400">Completed</span>
          <p className="mt-1 text-xl font-bold text-emerald-300">{completedTasks}</p>
        </div>
        <div className="rounded-xl border border-signal-500/20 bg-signal-500/10 p-3.5">
          <span className="text-xs font-mono uppercase text-signal-400">In Progress</span>
          <p className="mt-1 text-xl font-bold text-signal-300">{inProgressTasks}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <span className="text-xs font-mono uppercase text-marine-100/60">Pending</span>
          <p className="mt-1 text-xl font-bold text-marine-100/90">{pendingTasks}</p>
        </div>
      </div>

      {/* Real-time audit subtitle */}
      {(lastReason || lastProgressAt) && (
        <div className="mt-5 flex items-center justify-between text-xs text-marine-100/50 border-t border-white/10 pt-3.5 font-mono">
          <span>{lastReason ? `Latest update: ${lastReason}` : 'Live auto-tracking active'}</span>
          {lastProgressAt && (
            <span>{new Date(lastProgressAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}
    </div>
  );
}
