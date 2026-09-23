import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 18, label }) {
  const interactive = typeof onChange === 'function';
  return (
    <div className="flex items-center gap-1" role={interactive ? 'radiogroup' : 'img'} aria-label={label || `${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const Icon = (
          <Star
            size={size}
            className={filled ? 'fill-signal-500 text-signal-500' : 'text-mist-400'}
          />
        );
        return interactive ? (
          <button key={star} type="button" role="radio" aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`} onClick={() => onChange(star)} className="rounded">
            {Icon}
          </button>
        ) : (
          <span key={star}>{Icon}</span>
        );
      })}
    </div>
  );
}
