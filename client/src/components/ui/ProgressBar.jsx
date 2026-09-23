import React from 'react';

export default function ProgressBar({
  value = 0,
  label,
  showPercentage = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  animated = true,
  colorScheme = 'auto', // 'auto' | 'marine' | 'emerald' | 'amber'
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size] || 'h-2.5';

  let barColor = 'bg-marine-600';
  if (colorScheme === 'auto') {
    if (clamped >= 100) {
      barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
    } else if (clamped >= 60) {
      barColor = 'bg-gradient-to-r from-marine-600 to-indigo-500';
    } else if (clamped >= 25) {
      barColor = 'bg-gradient-to-r from-amber-500 to-marine-600';
    } else {
      barColor = 'bg-gradient-to-r from-slate-400 to-marine-500';
    }
  } else if (colorScheme === 'emerald') {
    barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  } else if (colorScheme === 'amber') {
    barColor = 'bg-gradient-to-r from-amber-500 to-orange-400';
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-mist-700">
          <span>{label || 'Progress'}</span>
          {showPercentage && <span className="font-semibold">{clamped}%</span>}
        </div>
      )}
      <div
        className={`${sizeClasses} w-full overflow-hidden rounded-full bg-mist-100 shadow-inner`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${barColor} ${
            animated ? 'transition-all duration-700 ease-out' : ''
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
