import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const base = 'w-full rounded-xl border bg-marine-900/80 px-4 py-3 text-sm text-white placeholder:text-white/30 border-white/15 focus:border-signal-400 focus:bg-marine-900 focus:outline-none transition-all disabled:opacity-50 disabled:bg-marine-950';

function Wrapper({ label, error, hint, required, htmlFor, children }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      {label && (
        <span className="mb-2 block text-xs font-mono uppercase tracking-wider text-marine-100/80">
          {label}{required && <span className="text-rose-400"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-marine-100/50">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ label, error, hint, required, className = '', type, ...props }) {
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <Wrapper label={label} error={error} hint={hint} required={required} htmlFor={props.id || props.name}>
      <div className="relative">
        <input
          id={props.id || props.name}
          type={inputType}
          aria-invalid={Boolean(error)}
          className={`${base} ${isPassword ? 'pr-11' : ''} ${error ? 'border-rose-400' : 'border-white/15'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={0}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg p-1.5 text-marine-100/50 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-signal-400 transition-colors"
          >
            {showPassword ? (
              <EyeOff size={18} className="stroke-[2]" aria-hidden="true" />
            ) : (
              <Eye size={18} className="stroke-[2]" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </Wrapper>
  );
}

export function TextArea({ label, error, hint, required, rows = 4, className = '', ...props }) {
  return (
    <Wrapper label={label} error={error} hint={hint} required={required} htmlFor={props.id || props.name}>
      <textarea
        id={props.id || props.name}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`${base} ${error ? 'border-rose-400' : 'border-white/15'} ${className}`}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({ label, error, hint, required, options = [], className = '', ...props }) {
  return (
    <Wrapper label={label} error={error} hint={hint} required={required} htmlFor={props.id || props.name}>
      <select
        id={props.id || props.name}
        aria-invalid={Boolean(error)}
        className={`${base} ${error ? 'border-rose-400' : 'border-white/15'} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-marine-950 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
