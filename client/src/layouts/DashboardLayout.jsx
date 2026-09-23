import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import NotificationBell from '../components/portal/NotificationBell.jsx';
import BackToTop from '../components/ui/BackToTop.jsx';
import { COMPANY } from '../utils/constants.js';

export default function DashboardLayout({ nav, basePath, area }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const NavItems = ({ onNavigate }) => (
    <ul className="space-y-1.5">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-signal-500 text-marine-950 font-bold shadow-md'
                  : 'text-marine-100/75 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-marine-950 text-white">
      <aside className="hidden w-64 shrink-0 flex-col bg-marine-900 border-r border-white/10 px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2 font-display text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-signal-500 text-marine-950 font-black text-sm">K</span>
          {COMPANY.name}
        </Link>
        <p className="mb-3 px-3 text-xs font-mono uppercase tracking-widest text-signal-400">{area}</p>
        <nav className="flex-1"><NavItems /></nav>
        <button
          onClick={signOut}
          className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-marine-100/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={17} /> Sign out
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-marine-950/80 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-marine-900 border-r border-white/10 px-4 py-6">
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="font-display text-lg font-bold text-white">{COMPANY.name}</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white hover:text-signal-400"><X size={20} /></button>
            </div>
            <nav className="flex-1"><NavItems onNavigate={() => setOpen(false)} /></nav>
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-marine-100/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={17} /> Sign out
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-marine-950">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-marine-900/90 backdrop-blur-xl px-4 sm:px-6">
          <button className="lg:hidden text-white" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <p className="hidden text-sm text-marine-100/70 lg:block font-medium">Welcome back, {user?.name?.split(' ')[0]}</p>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell basePath={basePath} />
            <Link to={`${basePath}/profile`} className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-white/5 transition-colors">
              <Avatar name={user?.name} src={user?.avatar} size={32} />
              <span className="hidden text-sm font-semibold text-white sm:block">{user?.name}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 bg-marine-950"><Outlet /></main>
        <BackToTop />
      </div>
    </div>
  );
}
