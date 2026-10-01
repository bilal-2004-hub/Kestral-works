import { useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ExternalLink, Github, ArrowUpRight, Sparkles, Layers } from 'lucide-react';
import { useFetch } from '../../hooks/useApi.js';
import { projectApi } from '../../services/endpoints.js';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'All Work',
  'Web Architecture',
  'Mobile Apps',
  'UI / UX & Systems',
  'SaaS Platforms',
  'E-Commerce',
];

const CURATED_PORTFOLIO = [
  {
    _id: 'p1',
    name: 'Vanguard Global Wealth Dashboard',
    tagline: 'Institutional Asset Intelligence & Real-time Trading Engine',
    category: 'SaaS Platforms',
    description:
      'Engineered an enterprise wealth telemetry platform capable of processing millions of tick updates per second with sub-millisecond chart rendering and biometric multi-factor authentication.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    tags: ['React', 'Node.js', 'Firebase', 'WebSockets', 'TailwindCSS'],
    liveUrl: 'https://example.com/vanguard',
    repoUrl: 'https://github.com/example/vanguard',
    stats: { metric: '< 80ms', label: 'Telemetry Latency' },
  },
  {
    _id: 'p2',
    name: 'Luminary Bio-Cosmetics Flagship',
    tagline: 'Omnichannel Luxury E-Commerce & Interactive 3D Product Customizer',
    category: 'E-Commerce',
    description:
      'Designed and deployed a global headless shopping flagship with real-time 3D product customization, custom Stripe checkout routing, and automated fulfillment integrations.',
    coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80',
    tags: ['Next.js', 'Three.js', 'Shopify Plus', 'Stripe', 'GSAP'],
    liveUrl: 'https://example.com/luminary',
    stats: { metric: '+64%', label: 'Conversion Lift' },
  },
  {
    _id: 'p3',
    name: 'Pulse Health Biometric Companion',
    tagline: 'Cross-Platform Patient Monitoring & Telehealth Mobile Ecosystem',
    category: 'Mobile Apps',
    description:
      'A HIPAA-compliant mobile application connecting continuous glucose sensors and wearable telemetry with on-demand specialist video consultations and prescription fulfillment.',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    tags: ['React Native', 'Firebase Cloud Firestore', 'WebRTC', 'TypeScript'],
    liveUrl: 'https://example.com/pulse',
    repoUrl: 'https://github.com/example/pulse',
    stats: { metric: '250k+', label: 'Active Users' },
  },
  {
    _id: 'p4',
    name: 'Aetheria Spatial Design System',
    tagline: 'Enterprise Multi-Brand Design Token Architecture & Component Kit',
    category: 'UI / UX & Systems',
    description:
      'Architected a multi-brand tokenized design ecosystem and automated Storybook pipeline adopted across 14 product squads, slashing frontend release cycles by 45%.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    tags: ['Figma Tokens', 'Storybook', 'React', 'CSS Architecture'],
    liveUrl: 'https://example.com/aetheria',
    stats: { metric: '45%', label: 'Faster Sprints' },
  },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All Work');
  const { data: dbProjects } = useFetch(() => projectApi.publicPortfolio({ limit: 10 }), []);

  const projects = useMemo(() => {
    const list = dbProjects && dbProjects.length > 0 ? dbProjects : CURATED_PORTFOLIO;
    if (activeCategory === 'All Work') return list;
    return list.filter((p) => {
      if (p.category === activeCategory) return true;
      if (activeCategory === 'Web Architecture' && p.category?.includes('Web')) return true;
      if (activeCategory === 'Mobile Apps' && (p.category?.includes('Mobile') || p.category?.includes('App'))) return true;
      if (activeCategory === 'UI / UX & Systems' && (p.category?.includes('UI') || p.category?.includes('Design'))) return true;
      if (activeCategory === 'SaaS Platforms' && (p.category?.includes('SaaS') || p.category?.includes('Software'))) return true;
      if (activeCategory === 'E-Commerce' && p.category?.includes('Commerce')) return true;
      return false;
    });
  }, [dbProjects, activeCategory]);

  return (
    <section id="work" className="relative scroll-mt-24 bg-marine-950 py-28 sm:py-36 text-white">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-10">
          <div>
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Selected Case Studies</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white">
              Work That <span className="text-signal-400">Defines</span> Markets
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-marine-100/75 leading-relaxed">
            Every project represents a deep engineering collaboration. Explore our recent digital flagships, cloud platforms, and mobile apps.
          </p>
        </div>

        {/* Category Pill Navigation */}
        <div className="mt-8 flex flex-wrap items-center gap-2 overflow-x-auto pb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`relative rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isSelected
                    ? 'bg-signal-500 text-marine-950 shadow-md font-bold'
                    : 'bg-white/5 border border-white/10 text-marine-100/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Large Alternating Case Study Showcases */}
        <LayoutGroup>
          <div className="mt-14 space-y-24 sm:space-y-32">
            <AnimatePresence mode="popLayout">
              {projects.map((project, idx) => {
                const isEven = idx % 2 === 0;
                const projectNum = idx + 1 < 10 ? `0${idx + 1}` : idx + 1;

                return (
                  <motion.article
                    key={project._id || project.name}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`grid gap-10 lg:grid-cols-12 items-center ${
                      isEven ? '' : 'lg:grid-flow-dense'
                    }`}
                  >
                    {/* Visual Media Showcase */}
                    <div
                      className={`relative group overflow-hidden rounded-3xl bg-marine-900/60 border border-white/15 shadow-2xl ${
                        isEven ? 'lg:col-span-7' : 'lg:col-span-7 lg:col-start-6'
                      }`}
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={project.coverImage || project.thumbnail || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200'}
                          alt={project.name}
                          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out-expo group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Project Index Overlay Tag */}
                      <div className="absolute top-5 left-5 rounded-full bg-marine-950/90 backdrop-blur-md px-3.5 py-1 text-xs font-mono font-bold text-white border border-white/15">
                        CASE {projectNum}
                      </div>

                      {/* Live Metric Badge */}
                      {project.stats && (
                        <div className="absolute bottom-5 right-5 rounded-2xl bg-marine-900/95 backdrop-blur-md p-4 shadow-2xl border border-white/15">
                          <p className="font-display text-xl font-black text-signal-400">{project.stats.metric}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-marine-100/60">{project.stats.label}</p>
                        </div>
                      )}
                    </div>

                    {/* Editorial Content */}
                    <div
                      className={`flex flex-col justify-center ${
                        isEven ? 'lg:col-span-5' : 'lg:col-span-5 lg:col-start-1'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs font-mono font-semibold uppercase tracking-widest text-signal-400">
                        <span>{project.category || 'Product Engineering'}</span>
                        <span>·</span>
                        <span>Full Production</span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                        {project.name}
                      </h3>

                      {project.tagline && (
                        <p className="mt-2 text-sm font-semibold text-marine-100/80">
                          {project.tagline}
                        </p>
                      )}

                      <p className="mt-4 text-sm sm:text-base leading-relaxed text-marine-100/70">
                        {project.description || project.summary}
                      </p>

                      {/* Technology Tag Badges */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        {(project.tags || ['React', 'Node.js', 'Firebase', 'TailwindCSS']).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Links Action Row */}
                      <div className="mt-8 flex items-center gap-4">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marine-950 hover:bg-signal-400 transition-all shadow-sm"
                          >
                            <span>Live Launch</span>
                            <ArrowUpRight size={14} />
                          </a>
                        )}

                        {project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                          >
                            <Github size={14} />
                            <span>Repository</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </LayoutGroup>

        {/* Bottom Portfolio CTA */}
        <div className="mt-24 text-center border-t border-white/10 pt-12">
          <p className="text-sm font-medium text-marine-100/60">Want to see our comprehensive private client archives?</p>
          <div className="mt-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-signal-400 hover:text-white transition-colors link-underline"
            >
              <span>Request Full Confidential Portfolio Deck</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
