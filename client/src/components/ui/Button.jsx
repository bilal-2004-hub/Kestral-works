import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-marine-800 text-white hover:bg-marine-700 disabled:bg-marine-300',
  accent: 'bg-signal-500 text-marine-950 hover:bg-signal-400 disabled:bg-signal-100',
  outline: 'border border-marine-800 text-marine-800 hover:bg-marine-100 disabled:opacity-50',
  ghost: 'text-marine-700 hover:bg-mist-100 disabled:opacity-50',
  danger: 'bg-state-bad text-white hover:opacity-90 disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export default function Button({
  as: Tag = 'button', variant = 'primary', size = 'md',
  loading = false, icon: Icon, children, className = '', ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150
        disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={Tag === 'button' ? loading || props.disabled : undefined}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </Tag>
  );
}
