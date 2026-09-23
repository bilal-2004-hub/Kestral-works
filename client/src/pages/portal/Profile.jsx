import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';
import { clientApi, authApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Profile() {
  const { user, updateUser, sessionPassword, updateSessionPassword } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || '', company: user?.company || '',
    phone: user?.phone || '', position: user?.position || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: sessionPassword || '',
    newPassword: '',
  });

  const saveProfile = useAction(clientApi.updateProfile);
  const savePassword = useAction(authApi.changePassword);

  const onProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await saveProfile.execute(profile);
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onPassword = async (e) => {
    e.preventDefault();
    try {
      await savePassword.execute(passwords);
      const updatedPass = passwords.newPassword;
      updateSessionPassword(updatedPass);
      setPasswords({ currentPassword: updatedPass, newPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Profile" description="Your details and sign-in settings." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your details">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={user?.name} src={user?.avatar} size={52} />
            <div>
              <p className="font-medium text-marine-900">{user?.email}</p>
              <p className="text-xs text-mist-600">{user?.role === 'client' ? 'Client account' : 'Studio account'}</p>
            </div>
          </div>
          <form onSubmit={onProfile} autoComplete="off" className="space-y-4">
            <Input name="name" label="Full name" value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} error={saveProfile.fieldErrors.name} />
            <Input name="company" label="Company" value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })} error={saveProfile.fieldErrors.company} />
            <Input name="phone" label="Phone" value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })} error={saveProfile.fieldErrors.phone} />
            <Input name="position" label="Job title" value={profile.position}
              onChange={(e) => setProfile({ ...profile, position: e.target.value })} />
            <Button type="submit" loading={saveProfile.pending}>Save changes</Button>
          </form>
        </Card>

        <Card title="Password">
          <form onSubmit={onPassword} autoComplete="off" className="space-y-4">
            <Input
              name="currentPassword"
              type="password"
              label="Current password"
              required
              autoComplete="new-password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              error={savePassword.fieldErrors.currentPassword}
            />
            <Input
              name="newPassword"
              type="password"
              label="New password"
              required
              autoComplete="new-password"
              hint="At least 8 characters, with an uppercase letter and a number."
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              error={savePassword.fieldErrors.newPassword}
            />
            <Button type="submit" loading={savePassword.pending}>Update password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
