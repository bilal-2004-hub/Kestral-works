import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-marine-950/80 backdrop-blur-md p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" aria-label="Close dialog" onClick={onClose} tabIndex={-1} />
      <div className={`relative flex max-h-[92vh] w-full ${widths[size]} flex-col rounded-t-2xl bg-marine-900 text-white border border-white/15 shadow-2xl sm:rounded-2xl`}>
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-marine-100/60 hover:bg-white/10 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-marine-100/80">{children}</div>
        {footer && <footer className="flex justify-end gap-3 border-t border-white/10 px-6 py-4 bg-marine-950/40 rounded-b-2xl">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
