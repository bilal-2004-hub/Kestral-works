import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import { COMPANY } from '../../utils/constants.js';

const NAV_LINKS = [
  { href: '/services', label: 'Services', hash: '#services' },
  { href: '/portfolio', label: 'Work', hash: '#work' },
  { href: '/about', label: 'About', hash: '#about' },
  { href: '/process', label: 'Process', hash: '#process' },
  { href: '/faq', label: 'FAQ', hash: '#faq' },
  { href: '/contact', label: 'Contact', hash: '#contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, isStaff, user } = useAuth();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      setScrolled(currentScrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const dashboardPath = isStaff ? '/admin' : '/portal';

  // Dynamic styling based on scroll state and current page
  const headerBg = scrolled
    ? 'bg-marine-950/90 backdrop-blur-xl border-white/10 shadow-xl shadow-marine-950/50'
    : isHomePage
    ? 'bg-transparent border-transparent'
    : 'bg-marine-950/95 backdrop-blur-md border-white/5';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out-expo border-b ${headerBg}`}
    >
      <div className="container-page flex h-20 items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3 font-display text-xl font-bold tracking-tight text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-signal-400 to-signal-500 text-marine-950 font-black text-base shadow-md shadow-signal-500/20 group-hover:scale-105 transition-transform">
            {COMPANY.name.charAt(0)}
          </span>
          <span className="tracking-tight group-hover:text-signal-300 transition-colors">
            {COMPANY.name}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (isHomePage && location.hash === link.hash);

            return (
              <Link
                key={link.label}
                to={link.href}
                className={`group relative text-sm font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-marine-100/70 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-signal-400 transition-all duration-300 ease-out-expo ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              <UserCheck size={14} className="text-signal-400" />
              <span>{isStaff ? 'Studio Admin' : 'Client Workspace'}</span>
              <ArrowUpRight size={13} className="text-white/60" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold uppercase tracking-wider text-marine-100/80 hover:text-white transition-colors px-2 py-1"
              >
                Client Sign In
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-lg shadow-signal-500/20 hover:bg-signal-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Start a Project</span>
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white backdrop-blur-md lg:hidden hover:bg-white/10 transition-colors"
          aria-label={open ? 'Close Menu' : 'Open Menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-x-0 top-20 bottom-0 bg-marine-950/98 backdrop-blur-2xl transition-all duration-300 lg:hidden overflow-y-auto border-t border-white/10 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="container-page py-10 flex flex-col justify-between min-h-[calc(100vh-5rem)]">
          <nav className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-marine-100/40">
              Navigation
            </p>
            <ul className="space-y-3">
              {NAV_LINKS.map((link, idx) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-2 text-2xl font-display font-bold text-white hover:text-signal-400 transition-colors border-b border-white/5"
                  >
                    <span>{link.label}</span>
                    <span className="font-mono text-xs text-white/30">0{idx + 1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pt-8 space-y-4 border-t border-white/10">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 p-3.5 text-sm font-bold text-white"
              >
                <UserCheck size={16} className="text-signal-400" />
                <span>Open {isStaff ? 'Studio Admin' : 'Client Workspace'}</span>
              </Link>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-white/20 p-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5"
                >
                  Client Sign In
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-signal-500 p-3.5 text-xs font-bold uppercase tracking-wider text-marine-950 shadow-lg shadow-signal-500/20"
                >
                  <span>Start a Project</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
            <p className="text-center text-xs text-marine-100/50">
              {COMPANY.tagline}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
