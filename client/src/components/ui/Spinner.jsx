import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-mist-600" role="status">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
