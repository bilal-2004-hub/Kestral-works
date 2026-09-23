import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Quote, ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';
import { useFetch } from '../../hooks/useApi.js';
import { reviewApi } from '../../services/endpoints.js';
import Avatar from '../ui/Avatar.jsx';

const CURATED_REVIEWS = [
  {
    _id: 'r1',
    title: 'Flawless execution from concept to deployment',
    body: 'The real-time client workspace made collaboration effortless. We monitored each milestone as it was built, approved deliverables directly, and launched 2 weeks ahead of our scheduled investor demo day.',
    rating: 5,
    client: {
      name: 'Alexander Wright',
      company: 'Vanguard FinTech Group',
      role: 'Head of Product Engineering',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    project: { name: 'Institutional Wealth Dashboard' },
  },
  {
    _id: 'r2',
    title: 'Our conversion rates surged by 68%',
    body: 'The design systems and interaction velocity they created set a new industry benchmark for us. The site is buttery smooth, blindingly fast, and our conversion rate jumped dramatically within 30 days of launch.',
    rating: 5,
    client: {
      name: 'Sophia Chen',
      company: 'Luminary Bio-Cosmetics',
      role: 'VP Brand & Growth',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    project: { name: 'E-Commerce Flagship' },
  },
  {
    _id: 'r3',
    title: 'Uncompromising engineering discipline',
    body: 'Their engineering discipline is remarkable. From clean TypeScript code to sub-millisecond Firebase queries and zero layout shifts, the application handles over 100k daily active users without breaking a sweat.',
    rating: 5,
    client: {
      name: 'Marcus Thorne',
      company: 'HyperScale Distributed Systems',
      role: 'Chief Technology Officer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    project: { name: 'Telemetry Infrastructure' },
  },
  {
    _id: 'r4',
    title: 'True product strategists and craftspeople',
    body: 'Not just developers—they are true product strategists. They challenged our assumptions, refined our user journeys, and delivered a world-class digital flagship that won multiple design recognitions.',
    rating: 5,
    client: {
      name: 'Elena Rostova',
      company: 'Studio Luminary Global',
      role: 'Managing Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    project: { name: 'Brand Flagship & Store' },
  },
];

export default function Testimonials() {
  const { data: dbReviews, loading } = useFetch(() => reviewApi.listPublic({ limit: 10 }), []);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const reviews = dbReviews && dbReviews.length > 0 ? dbReviews : CURATED_REVIEWS;

  return (
    <section className="relative overflow-hidden bg-marine-950 py-28 sm:py-36 text-white">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-marine-600/15 blur-[160px]" />

      <div className="container-page relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-10">
          <div>
            <div className="section-chip-dark mb-3">
              <Sparkles size={13} className="text-signal-400" />
              <span>Verified Client Testimonials</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white">
              Client <span className="text-signal-400">Endorsements</span>
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              ref={prevRef}
              aria-label="Previous testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15 active:scale-95 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              ref={nextRef}
              aria-label="Next testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15 active:scale-95 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Editorial Carousel */}
        <div className="mt-14">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={32}
            slidesPerView={1}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            autoplay={{ delay: 7000, disableOnInteraction: false }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1200: { slidesPerView: 2.5 },
            }}
            className="!pb-12"
          >
            {reviews.map((review) => (
              <SwiperSlide key={review._id} className="h-auto">
                <div className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                  <div>
                    {/* Star Rating & Quote Symbol */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-signal-400 text-signal-400" />
                        ))}
                      </div>
                      <Quote size={32} className="text-white/15" />
                    </div>

                    {/* Quotation Headline */}
                    {review.title && (
                      <h3 className="mt-6 font-display text-xl sm:text-2xl font-bold text-white leading-snug">
                        "{review.title}"
                      </h3>
                    )}

                    {/* Quotation Body */}
                    <p className="mt-4 text-sm sm:text-base leading-relaxed text-marine-100/75">
                      {review.body}
                    </p>
                  </div>

                  {/* Client Author Info */}
                  <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                    <Avatar
                      name={review.client?.name}
                      src={review.client?.avatar}
                      size={48}
                      className="ring-2 ring-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-white">
                        {review.client?.name}
                      </p>
                      <p className="truncate text-xs text-marine-100/60 font-medium">
                        {review.client?.role ? `${review.client.role} · ` : ''}
                        {review.client?.company || 'Verified Enterprise Client'}
                      </p>
                      {review.project?.name && (
                        <p className="truncate text-[11px] font-mono text-signal-400 mt-0.5">
                          Project: {review.project.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
