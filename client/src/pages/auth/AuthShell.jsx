import { Link } from 'react-router-dom';
import { COMPANY } from '../../utils/constants.js';

/* Split layout shared by all four credential screens. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-marine-950 p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-signal-500 text-marine-950">K</span>
          {COMPANY.name}
        </Link>
        <div>
          <p className="font-display text-3xl font-bold leading-tight">
            Your project, visible without asking.
          </p>
          <p className="prose-measure mt-4 text-marine-100/80">
            Progress, tasks, files and feedback in one place — updated by the people doing the work.
          </p>
        </div>
        <p className="text-xs text-marine-100/50">© {new Date().getFullYear()} {COMPANY.name}</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-lg font-bold text-marine-900 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-marine-900 text-signal-500">K</span>
            {COMPANY.name}
          </Link>
          <h1 className="font-display text-2xl font-bold text-marine-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-mist-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-mist-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
