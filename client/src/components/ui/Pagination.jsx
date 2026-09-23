import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onChange }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages, total } = meta;

  return (
    <nav className="flex items-center justify-between gap-3 pt-4 text-sm" aria-label="Pagination">
      <p className="text-mist-600">Page {page} of {pages} · {total} total</p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-mist-200 px-3 py-1.5 disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <button
          onClick={() => onChange(page + 1)} disabled={page >= pages}
          className="inline-flex items-center gap-1 rounded-lg border border-mist-200 px-3 py-1.5 disabled:opacity-40"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
