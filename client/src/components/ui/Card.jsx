export default function Card({ title, action, children, className = '', padded = true }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-marine-900/60 shadow-2xl backdrop-blur-md text-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {action}
        </header>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </section>
  );
}
