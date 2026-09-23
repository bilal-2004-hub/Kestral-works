import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { authApi } from '../../services/endpoints.js';
import { useAction } from '../../hooks/useApi.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const { execute, pending, fieldErrors } = useAction(authApi.forgotPassword);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await execute(email);
      setSent(true);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we will send a reset link."
      footer={<Link to="/login" className="font-medium text-marine-700 hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-marine-900">
          If that email is registered, a reset link is on its way. The link works for 30 minutes.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-state-bad">{formError}</p>
          )}
          <Input name="email" type="email" label="Email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
          <Button type="submit" size="lg" loading={pending} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
