import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-10 text-center text-white backdrop-blur-md">
      <span className="rounded-xl bg-rose-500/20 p-2.5 text-rose-400">
        <AlertTriangle size={24} />
      </span>
      <p className="prose-measure text-sm font-medium text-rose-200 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-1 border-rose-500/30 text-rose-200 hover:bg-rose-500/20">
          Try again
        </Button>
      )}
    </div>
  );
}
