import { Component } from 'react';
import Button from './Button.jsx';

/* Last line of defence: a render crash shows a recoverable screen, not a blank page. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error, info) { console.error('Render error:', error, info); }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold">This page stopped responding</h1>
        <p className="prose-measure text-sm text-mist-600">Reloading usually clears it. If it keeps happening, let us know what you were doing.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    );
  }
}
