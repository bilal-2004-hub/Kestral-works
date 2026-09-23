import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-display text-6xl font-bold text-marine-900">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">This page does not exist</h1>
        <p className="prose-measure mx-auto mt-2 text-sm text-mist-600">
          The link may be out of date. The homepage and your workspace are both still there.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button as={Link} to="/">Go to homepage</Button>
          <Button as={Link} to="/portal" variant="outline">Open workspace</Button>
        </div>
      </div>
    </div>
  );
}
