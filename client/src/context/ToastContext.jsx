import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
const tones = {
  success: 'border-emerald-500/40 bg-marine-900/95 text-white shadow-2xl backdrop-blur-xl',
  error: 'border-rose-500/40 bg-marine-900/95 text-white shadow-2xl backdrop-blur-xl',
  info: 'border-signal-500/40 bg-marine-900/95 text-white shadow-2xl backdrop-blur-xl',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback((message, tone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((all) => [...all, { id, message, tone }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const value = useMemo(() => ({
    toast: push,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3" role="status" aria-live="polite">
        {toasts.map(({ id, message, tone }) => {
          const Icon = icons[tone];
          return (
            <div key={id} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-5 py-4 ${tones[tone]}`}>
              <Icon size={20} className="mt-0.5 shrink-0 text-signal-400" />
              <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
              <button onClick={() => dismiss(id)} aria-label="Dismiss" className="text-marine-100/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
