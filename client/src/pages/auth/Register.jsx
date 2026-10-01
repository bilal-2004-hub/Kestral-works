import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';

const PROFESSIONAL_FIELDS = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Graphic Design',
  'Software Development',
  'Digital Marketing',
  'SEO',
  'E-commerce Development',
  'Content Writing',
  'Video Editing',
  'Custom Software Solutions',
  'Other',
];

export default function Register() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    professionalField: '',
  });
  const [formError, setFormError] = useState('');
  const { execute, pending, fieldErrors } = useAction(register);

  if (status === 'authenticated') return <Navigate to="/portal" replace />;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      try {
        if (form.email && form.password) {
          localStorage.setItem(`client_portal_pass_${form.email.toLowerCase().trim()}`, form.password);
          localStorage.setItem('client_portal_last_pass', form.password);
        }
      } catch {}
      await execute(form);
      navigate('/login', {
        replace: true,
        state: {
          message: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up access, then we will connect your projects to it."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-marine-700 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate autoComplete="off" className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-state-bad">{formError}</p>
        )}
        <Input name="name" label="Full name" required autoComplete="name" value={form.name} onChange={update('name')} error={fieldErrors.name} />
        <Input name="email" type="email" label="Work email" required autoComplete="email" value={form.email} onChange={update('email')} error={fieldErrors.email} />
        <Input name="company" label="Company (optional)" autoComplete="organization" value={form.company} onChange={update('company')} error={fieldErrors.company} />
        <Input name="phone" label="Phone (optional)" autoComplete="tel" value={form.phone} onChange={update('phone')} error={fieldErrors.phone} />

        <Select
          name="professionalField"
          label="Professional Field"
          required
          value={form.professionalField}
          onChange={update('professionalField')}
          error={fieldErrors.professionalField}
          hint="Determines which incoming project requests you'll be matched with."
          options={[
            { value: '', label: 'Select your primary expertise…' },
            ...PROFESSIONAL_FIELDS.map((f) => ({ value: f, label: f })),
          ]}
        />

        <Input
          name="password" type="password" label="Password" required autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter and a number."
          value={form.password} onChange={update('password')} error={fieldErrors.password}
        />
        <Button type="submit" size="lg" loading={pending} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
