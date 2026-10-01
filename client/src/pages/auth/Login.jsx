import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';

export default function Login() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const { execute, pending, fieldErrors } = useAction(login);

  if (status === 'authenticated') {
    return <Navigate to={user.role === 'client' ? '/portal' : '/admin'} replace />;
  }

  const update = (key) => (e) => {
    if (successMessage) setSuccessMessage('');
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const signedIn = await execute(form);
      const fallback = signedIn.role === 'client' ? '/portal' : '/admin';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Your workspace, your projects and everything waiting on you."
      footer={<>No account yet? <Link to="/register" className="font-medium text-marine-700 hover:underline">Create one</Link></>}
    >
      <form onSubmit={onSubmit} noValidate autoComplete="off" className="space-y-4">
        {successMessage && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {successMessage}
          </p>
        )}
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-state-bad">{formError}</p>
        )}
        <Input
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="off"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-marine-700 hover:underline">Forgot your password?</Link>
        </div>
        <Button type="submit" size="lg" loading={pending} className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  );
}
