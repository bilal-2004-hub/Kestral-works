import { useState, useEffect } from 'react';
import {
  User, ShieldCheck, Mail, Building, Phone, Briefcase, Lock,
  KeyRound, CheckCircle2, Calendar, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';
import { clientApi, authApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function Profile() {
  const { user, updateUser, sessionPassword, updateSessionPassword } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    company: user?.company || '',
    phone: user?.phone || '',
    position: user?.position || '',
    professionalField: user?.professionalField || '',
  });

  const userEmail = user?.email?.toLowerCase().trim();
  const currentStoredPass = sessionPassword ||
    (userEmail ? (function() {
      try {
        return localStorage.getItem(`client_portal_pass_${userEmail}`);
      } catch {
        return '';
      }
    })() : '') ||
    (function() {
      try {
        return localStorage.getItem('client_portal_last_pass');
      } catch {
        return '';
      }
    })() ||
    '';

  const [passwords, setPasswords] = useState({
    currentPassword: currentStoredPass || '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordMatchError, setPasswordMatchError] = useState('');

  useEffect(() => {
    if (currentStoredPass) {
      setPasswords((prev) => ({
        ...prev,
        currentPassword: currentStoredPass,
      }));
    }
  }, [currentStoredPass]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        company: user.company || '',
        phone: user.phone || '',
        position: user.position || '',
        professionalField: user.professionalField || '',
      });
    }
  }, [user]);

  const saveProfile = useAction(clientApi.updateProfile);
  const savePassword = useAction(authApi.changePassword);

  const onProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await saveProfile.execute(profile);
      if (res?.data) {
        updateUser(res.data);
      } else {
        updateUser(profile);
      }
      toast.success('Your profile has been updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const onPassword = async (e) => {
    e.preventDefault();
    setPasswordMatchError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMatchError('New password and confirmation do not match');
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordMatchError('Password must be at least 8 characters long');
      toast.error('Password too short');
      return;
    }

    try {
      await savePassword.execute({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      const updatedPass = passwords.newPassword;
      updateSessionPassword(updatedPass, user?.email);
      setPasswords({
        currentPassword: updatedPass,
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account profile details, contact information, and security preferences."
      />

      {/* Account Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={user?.avatar} size={64} className="border-2 border-signal-500/40 shadow-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white">{user?.name || 'Client Account'}</h2>
              <StatusBadge status={user?.role === 'client' ? 'Client' : 'Studio'} />
            </div>
            <p className="text-xs font-mono text-marine-100/70 mt-0.5">{user?.email}</p>
            {user?.company && (
              <p className="text-xs text-signal-400 font-medium mt-1">{user.company}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-mono text-marine-100/60">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-marine-100/40 block text-[10px] uppercase">Account Type</span>
            <span className="font-semibold text-white capitalize">{user?.role || 'Client'}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-marine-100/40 block text-[10px] uppercase">Account Status</span>
            <span className="font-semibold text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Details Form */}
        <Card title="Personal & Company Details">
          <form onSubmit={onProfile} autoComplete="off" className="space-y-4">
            <Input
              name="name"
              label="Full Name"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              error={saveProfile.fieldErrors.name}
            />

            <div>
              <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-marine-100/80">
                Email Address
              </label>
              <div className="rounded-xl border border-white/10 bg-marine-950/60 px-4 py-3 text-xs text-marine-100/50 font-mono">
                {user?.email} (Primary sign-in email)
              </div>
            </div>

            <Input
              name="company"
              label="Company Name"
              placeholder="e.g. Northwind Foods"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              error={saveProfile.fieldErrors.company}
            />

            <Input
              name="phone"
              label="Phone Number"
              placeholder="e.g. +1 (555) 000-0000"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              error={saveProfile.fieldErrors.phone}
            />

            <Input
              name="position"
              label="Job Title / Role"
              placeholder="e.g. Head of Product"
              value={profile.position}
              onChange={(e) => setProfile({ ...profile, position: e.target.value })}
            />

            <div>
              <label htmlFor="professionalField" className="mb-2 block text-xs font-mono uppercase tracking-wider text-marine-100/80">
                Professional Field / Expertise
              </label>
              <select
                id="professionalField"
                name="professionalField"
                value={profile.professionalField}
                onChange={(e) => setProfile({ ...profile, professionalField: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-marine-950/80 px-4 py-3 text-xs text-white focus:border-signal-400 focus:outline-none"
              >
                <option value="">Select your primary field…</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Software Development">Software Development</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="SEO">SEO</option>
                <option value="E-commerce Development">E-commerce Development</option>
                <option value="Content Writing">Content Writing</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Custom Software Solutions">Custom Software Solutions</option>
                <option value="Other">Other</option>
              </select>
              <p className="mt-1.5 text-[11px] text-marine-100/50">
                You will be automatically matched with new project requests in this field.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={saveProfile.pending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card title="Security & Password">
          <p className="text-xs text-marine-100/70 mb-4 leading-relaxed">
            Ensure your account is protected with a secure password containing at least 8 characters, an uppercase letter, and a number.
          </p>

          <form onSubmit={onPassword} autoComplete="off" className="space-y-4">
            <Input
              name="currentPassword"
              type="password"
              label="Current Password"
              required
              autoComplete="off"
              placeholder="Enter current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              error={savePassword.fieldErrors.currentPassword}
            />

            <Input
              name="newPassword"
              type="password"
              label="New Password"
              required
              autoComplete="new-password"
              placeholder="Enter new password"
              hint="Minimum 8 characters with at least one uppercase letter and one number."
              value={passwords.newPassword}
              onChange={(e) => {
                setPasswords({ ...passwords, newPassword: e.target.value });
                if (passwordMatchError) setPasswordMatchError('');
              }}
              error={savePassword.fieldErrors.newPassword || passwordMatchError}
            />

            <Input
              name="confirmPassword"
              type="password"
              label="Confirm New Password"
              required
              autoComplete="new-password"
              placeholder="Re-type new password"
              value={passwords.confirmPassword}
              onChange={(e) => {
                setPasswords({ ...passwords, confirmPassword: e.target.value });
                if (passwordMatchError) setPasswordMatchError('');
              }}
              error={passwordMatchError}
            />

            <div className="pt-2">
              <Button type="submit" loading={savePassword.pending}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
