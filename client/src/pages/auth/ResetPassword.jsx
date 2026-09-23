import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const { execute, pending, fieldErrors } = useAction(resetPassword);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirm) return setFormError('Both passwords need to match');
    try {
      const user = await execute({ token, email, password });
      toast.success('Password updated');
      navigate(user.role === 'client' ? '/portal' : '/admin', { replace: true });
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (!token || !email) {
    return (
      <AuthShell title="This reset link is incomplete" subtitle="Request a new one and open it directly from the email.">
        <Button as={Link} to="/forgot-password" size="lg" className="w-full">Request a new link</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle={`Resetting the password for ${email}.`}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-state-bad">{formError}</p>
        )}
        <Input name="password" type="password" label="New password" required autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter and a number."
          value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} />
        <Input name="confirm" type="password" label="Confirm new password" required autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" size="lg" loading={pending} className="w-full">Save new password</Button>
      </form>
    </AuthShell>
  );
}
