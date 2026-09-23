import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Smartphone, Layout, Palette, ShoppingCart, TrendingUp, Search,
  Film, ArrowUpRight, Plus, Minus, CheckCircle2, Sparkles, Code2, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICES_DATA = [
  {
    num: '01',
    id: 'web-development',
    title: 'Website Design & Development',
    tagline: 'High-performance web applications and digital flagships engineered for speed.',
    desc: 'We architect responsive, fluid, and scalable web solutions using modern React, Next.js, Node.js, and headless CMS frameworks. Every site is optimized for sub-second load times, technical SEO, and fluid 60fps micro-interactions.',
    deliverables: ['Custom Web Applications', 'Headless CMS Architecture', 'Responsive Design Systems', 'Interactive Micro-animations', 'Performance & CWV Tuning'],
    technologies: ['React', 'Next.js', 'Node.js', 'TailwindCSS', 'GSAP', 'TypeScript'],
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '02',
    id: 'mobile-development',
    title: 'Mobile App Development',
    tagline: 'Cross-platform iOS and Android applications delivering native-level fluidity.',
    desc: 'From initial MVP conception to App Store and Google Play deployment, we build robust mobile experiences utilizing React Native and Flutter, with real-time Firebase backend synchronization and offline-first persistence.',
    deliverables: ['Native & Cross-Platform Apps', 'Real-time Push Notification Engines', 'In-App Subscriptions & Billing', 'Offline Data Synchronization', 'App Store Deployment & CI/CD'],
    technologies: ['React Native', 'Flutter', 'Firebase', 'GraphQL', 'Swift', 'Kotlin'],
    previewImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '03',
    id: 'ui-ux-design',
    title: 'UI / UX Design & Design Systems',
    tagline: 'Intuitive user journeys, design tokens, and pixel-perfect interactive prototypes.',
    desc: 'We transform complex user workflows into clean, effortless digital interactions. Our process spans user research, wireframing, high-fidelity Figma components, interactive prototyping, and comprehensive design system tokens.',
    deliverables: ['Design Systems & Token Architecture', 'Wireframes & Interactive Prototypes', 'User Journey Mapping & Testing', 'Micro-interaction Specifications', 'Figma to Code Handover'],
    technologies: ['Figma', 'Storybook', 'Design Tokens', 'Framer', 'Protopie'],
    previewImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '04',
    id: 'branding-identity',
    title: 'Branding & Visual Identity',
    tagline: 'Distinctive brand identities crafted to command authority and foster trust.',
    desc: 'We shape cohesive brand identities that resonate across every digital touchpoint. From logotypes and custom typography to color theory, brand guidelines, and spatial marketing assets.',
    deliverables: ['Logomarks & Visual Systems', 'Brand Strategy & Voice Guidelines', 'Typography & Palette Definition', 'Digital & Print Collateral', 'Social Media Asset Kits'],
    technologies: ['Vector Design', 'Typography', 'Color Theory', 'Brand Guidelines'],
    previewImage: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '05',
    id: 'ecommerce-development',
    title: 'E-Commerce Engineering',
    tagline: 'High-converting custom storefronts and omnichannel commerce integrations.',
    desc: 'We build frictionless shopping experiences optimized for maximum checkout conversion, high concurrency inventory management, international localization, and automated CRM pipelines.',
    deliverables: ['Custom Storefronts & Checkouts', 'Payment Gateway Integrations (Stripe)', 'Inventory & Order Automation', 'Conversion Rate Optimization (CRO)', 'Global Localization & Multi-Currency'],
    technologies: ['Shopify Plus', 'Stripe', 'Next.js Commerce', 'PostgreSQL', 'Redis'],
    previewImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '06',
    id: 'digital-marketing',
    title: 'Digital Marketing & Growth',
    tagline: 'Data-driven acquisition, conversion funnels, and performance marketing.',
    desc: 'Strategic campaign execution targeting high-intent users. We build full-funnel growth architectures encompassing multi-channel ad management, analytics attribution, and marketing automation.',
    deliverables: ['Full-Funnel Campaign Strategy', 'Performance Ad Creative & Copy', 'Attribution Tracking & GA4', 'Landing Page A/B Testing', 'Retention Email Automations'],
    technologies: ['Google Ads', 'Meta Ads', 'GA4', 'HubSpot', 'Klaviyo'],
    previewImage: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '07',
    id: 'seo-optimization',
    title: 'Search Engine Optimization',
    tagline: 'Organic dominance through deep technical audits and strategic content architecture.',
    desc: 'We build organic search moats for competitive keywords. Our audits correct rendering bottlenecks, structure rich JSON-LD data, optimize Core Web Vitals, and build scalable content clusters.',
    deliverables: ['Technical SEO & CWV Audits', 'Structured Data & Schema Markup', 'Keyword Strategy & Clustering', 'Competitor Gap Analysis', 'Continuous Ranking Dashboards'],
    technologies: ['Schema.org', 'Lighthouse', 'Ahrefs', 'Search Console'],
    previewImage: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?w=600&auto=format&fit=crop&q=80',
  },
  {
    num: '08',
    id: 'video-motion',
    title: 'Video & Motion Design',
    tagline: 'Cinematic storytelling, 3D animations, and high-impact visual graphics.',
    desc: 'We produce captivating video reels, product walkthroughs, animated explainers, and interactive web motion graphics that elevate brand prestige and communicate complex value propositions effortlessly.',
    deliverables: ['Product Launch Showcases', '3D Motion Graphics & Animation', 'Interactive Web Animations (Lottie/GSAP)', 'UI Feature Walkthroughs', 'Social Video Campaigns'],
    technologies: ['After Effects', 'Blender', 'Premiere Pro', 'GSAP Motion', 'Lottie'],
    previewImage: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80',
  },
];

export default function Services() {
  const [activeService, setActiveService] = useState(0);

  const toggle = (idx) => {
    setActiveService(activeService === idx ? -1 : idx);
  };

  return (
    <section id="services" className="relative scroll-mt-24 bg-marine-900/40 py-28 sm:py-36 text-white border-y border-white/5">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-10">
          <div>
            <div className="section-chip mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Our Capabilities</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase">
              Services <span className="text-signal-400">&</span> Expertise
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-marine-100/75 leading-relaxed">
            We operate as an autonomous product engineering unit, delivering full-lifecycle digital craftsmanship from conception to deployment.
          </p>
        </div>

        {/* Large Editorial Interactive Service Rows */}
        <div className="mt-8 divide-y divide-white/10">
          {SERVICES_DATA.map((service, idx) => {
            const isOpen = activeService === idx;

            return (
              <div
                key={service.id}
                className={`group transition-all duration-300 ${
                  isOpen
                    ? 'bg-marine-900/90 rounded-2xl shadow-2xl my-4 border border-white/15'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Clickable Header Row */}
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between gap-6 py-8 px-4 sm:px-8 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-baseline gap-6 sm:gap-12 min-w-0">
                    <span className="font-mono text-sm sm:text-base font-bold text-signal-400 tracking-wider">
                      {service.num}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white group-hover:text-signal-400 transition-colors">
                        {service.title}
                      </h3>
                      {!isOpen && (
                        <p className="hidden sm:block mt-1 text-xs sm:text-sm text-marine-100/60 truncate max-w-xl">
                          {service.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="hidden md:inline-flex items-center text-xs font-mono uppercase tracking-widest text-marine-100/50 group-hover:text-white">
                      {isOpen ? 'Close View' : 'Explore Capabilities'}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen
                          ? 'bg-signal-500 text-marine-950 rotate-45'
                          : 'bg-white/10 text-white group-hover:bg-signal-500 group-hover:text-marine-950'
                      }`}
                    >
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </button>

                {/* Expanded Editorial Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/10 px-4 sm:px-8 pb-10 pt-8">
                        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
                          {/* Left: Deep Overview & Deliverables */}
                          <div>
                            <p className="text-base sm:text-lg leading-relaxed text-marine-100/85">
                              {service.desc}
                            </p>

                            <div className="mt-8">
                              <h4 className="text-xs font-semibold uppercase tracking-widest text-signal-400 font-mono mb-4">
                                Key Deliverables & Scope
                              </h4>
                              <div className="grid gap-2.5 sm:grid-cols-2">
                                {service.deliverables.map((item, dIdx) => (
                                  <div key={dIdx} className="flex items-center gap-2.5 text-sm text-marine-100/80">
                                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-8">
                              <h4 className="text-xs font-semibold uppercase tracking-widest text-signal-400 font-mono mb-3">
                                Technologies & Tools
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {service.technologies.map((tech, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                              <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-marine-950 hover:bg-signal-400 transition-all shadow-md"
                              >
                                <span>Inquire About {service.title}</span>
                                <ArrowUpRight size={14} />
                              </Link>
                            </div>
                          </div>

                          {/* Right: Visual Showcase preview */}
                          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-marine-950 border border-white/15 shadow-2xl">
                            <img
                              src={service.previewImage}
                              alt={service.title}
                              className="h-full w-full object-cover object-center"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-marine-950/80 via-transparent to-transparent flex items-end p-6">
                              <span className="text-xs font-mono text-white/90">
                                Benchmark Production Standard · {service.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
