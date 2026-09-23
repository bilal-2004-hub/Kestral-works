import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, Film, Compass, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative overflow-hidden bg-marine-950 py-28 sm:py-36 text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-marine-600/15 blur-[160px]" />

      <div className="container-page relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="section-chip-dark mb-3">
              <Film size={13} className="text-signal-400" />
              <span>Cinematic Showreel · 2026</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white">
              Crafting The Future of <span className="text-signal-400">Interaction</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-marine-100/70 leading-relaxed">
            Watch how our cross-disciplinary team ideates, tests, and deploys high-impact digital experiences across web, mobile, and cloud environments.
          </p>
        </div>

        {/* Cinematic Video Viewport */}
        <div className="relative group overflow-hidden rounded-3xl border border-white/15 bg-marine-900/80 shadow-2xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            {/* HTML5 Video Element with Fallback Poster */}
            <video
              ref={videoRef}
              playsInline
              loop
              muted={isMuted}
              poster="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41551-large.mp4"
                type="video/mp4"
              />
            </video>

            {/* Dark gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-marine-950/80 via-marine-950/30 to-transparent transition-opacity duration-300 ${
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}
            />

            {/* Center Play/Pause Trigger */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause video showreel' : 'Play video showreel'}
                className="pointer-events-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-signal-500 text-marine-950 shadow-2xl shadow-signal-500/40 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={30} className="fill-marine-950" />
                ) : (
                  <Play size={30} className="fill-marine-950 ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-center justify-between text-xs text-white/90">
              <div className="flex items-center gap-3">
                <span className="font-mono uppercase tracking-widest text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                  Studio Reel 02:45
                </span>
                <span className="hidden sm:inline font-mono text-white/60">4K UHD Master</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting studio callout cards below video */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-signal-400" />
              High-Velocity Agile Sprints
            </h4>
            <p className="mt-2 text-xs sm:text-sm text-marine-100/70 leading-relaxed">
              Bi-weekly staging deployments with verifiable milestones and recorded video demo walkthroughs.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-signal-400" />
              Design Token Precision
            </h4>
            <p className="mt-2 text-xs sm:text-sm text-marine-100/70 leading-relaxed">
              Pixel-perfect Figma parity, fluid responsive grids, and clean component hierarchies.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Compass size={16} className="text-signal-400" />
              Architectural Scalability
            </h4>
            <p className="mt-2 text-xs sm:text-sm text-marine-100/70 leading-relaxed">
              Engineered for zero layout shift, extreme concurrency, and automated cloud CI/CD pipelines.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
