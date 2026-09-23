import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { COMPANY, SERVICES } from '../../utils/constants.js';

export default function Footer() {
  return (
    <footer className="relative bg-marine-950 text-white overflow-hidden border-t border-white/10">
      <div className="container-page py-20 sm:py-28">
        {/* Large Statement Headline */}
        <div className="border-b border-white/10 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal-400">
                Next-Gen Product Studio
              </span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-[0.98]">
                Let's build something <br />
                <span className="text-signal-400">worth talking about.</span>
              </h2>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 rounded-full bg-signal-500 px-8 py-4 text-xs font-bold uppercase tracking-wider text-marine-950 hover:bg-signal-400 transition-all shadow-xl shadow-signal-500/20 shrink-0"
            >
              <span>Get in Touch With Us</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* 4-Column Navigation Layout */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3 font-display text-2xl font-bold text-white tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500 text-marine-950 font-black text-sm">
                {COMPANY.name.charAt(0)}
              </span>
              <span>{COMPANY.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-marine-100/70 max-w-sm">
              {COMPANY.tagline}. High-fidelity web engineering, digital platforms, and design systems with live real-time client collaboration.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-signal-500 hover:text-marine-950 transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-signal-500 hover:text-marine-950 transition-colors"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-signal-500 hover:text-marine-950 transition-colors"
              >
                <Github size={16} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-signal-500 hover:text-marine-950 transition-colors"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="lg:col-span-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-signal-400">
              Core Capabilities
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-marine-100/75">
              {SERVICES.slice(0, 5).map((s) => (
                <li key={s.name}>
                  <Link to="/services" className="hover:text-white transition-colors">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company Navigation */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-signal-400">
              Navigation
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-marine-100/75">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Studio
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-white transition-colors">
                  Selected Work
                </Link>
              </li>
              <li>
                <Link to="/process" className="hover:text-white transition-colors">
                  Process
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Client Portal & Studio Contacts */}
          <div className="lg:col-span-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-signal-400">
              Client Portal
            </h4>
            <div className="mt-5 space-y-3 text-sm">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors"
              >
                <span>Access Workspace</span>
                <ArrowUpRight size={14} />
              </Link>
              <div className="pt-2 text-xs space-y-2.5 text-marine-100/70 font-mono">
                <p>{COMPANY.email}</p>
                <p>{COMPANY.phone}</p>
                <p>{COMPANY.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Operational Status & Copyright */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-marine-100/50">
          <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span>Security & IP Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
