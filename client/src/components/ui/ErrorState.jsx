import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-red-200 bg-red-50/60 px-6 py-10 text-center">
      <AlertTriangle size={22} className="text-state-bad" />
      <p className="prose-measure text-sm text-marine-900">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
