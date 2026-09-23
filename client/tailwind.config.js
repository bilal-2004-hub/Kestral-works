/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        marine: {
          950: '#03181F', 900: '#062730', 800: '#0A3A46', 700: '#0F5261',
          600: '#166B7C', 500: '#2A8797', 400: '#4DA5B5', 300: '#7FB9C4', 200: '#ACD5DC', 100: '#D6E7EA', 50: '#F0F6F7',
        },
        signal: { 600: '#C99700', 500: '#EBB61F', 400: '#F7D35E', 300: '#FCE088', 100: '#FDF2D0' },
        mist: { 50: '#F7F9F8', 100: '#EEF2F1', 200: '#DFE6E4', 300: '#CCD7D4', 400: '#9AA9A6', 500: '#788986', 600: '#5B6B68', 700: '#44514F' },
        state: { ok: '#1F7A55', warn: '#B45309', bad: '#B42318', info: '#155E9C' },
        accent: {
          primary: '#0F5261',
          light: '#7FB9C4',
          gold: '#EBB61F',
          500: '#EBB61F',
        },
      },
      fontSize: {
        '2xs': '0.6875rem',
        'display-2xl': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-md': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(6,39,48,.06), 0 12px 32px -18px rgba(6,39,48,.35)',
        lift: '0 18px 40px -24px rgba(6,39,48,.55)',
        glow: '0 0 40px -8px rgba(235,182,31,.45)',
        'glow-marine': '0 0 40px -8px rgba(42,135,151,.35)',
        subtle: '0 2px 8px -2px rgba(3,24,31,.05), 0 8px 24px -4px rgba(3,24,31,.08)',
        elevated: '0 20px 40px -15px rgba(3,24,31,.12), 0 0 1px rgba(3,24,31,.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(42,135,151,.18) 0%, transparent 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 50%)',
        'dark-noise': 'radial-gradient(circle at 50% 50%, rgba(22,107,124,0.15) 0%, transparent 60%)',
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem', xl4: '2.25rem' },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(.16,1,.3,1)',
        'in-out-quart': 'cubic-bezier(.76,0,.24,1)',
      },
      keyframes: {
        riseIn: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        riseInFast: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        pulse2: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(.92)' }, '100%': { opacity: 1, transform: 'none' } },
        slideRight: { '0%': { opacity: 0, transform: 'translateX(-20px)' }, '100%': { opacity: 1, transform: 'none' } },
        slideLeft: { '0%': { opacity: 0, transform: 'translateX(20px)' }, '100%': { opacity: 1, transform: 'none' } },
        progressLine: { '0%': { width: '0%' }, '100%': { width: '100%' } },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        riseIn: 'riseIn .6s cubic-bezier(.22,1,.36,1) both',
        riseInFast: 'riseInFast .4s cubic-bezier(.22,1,.36,1) both',
        float: 'float 4s ease-in-out infinite',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        pulse2: 'pulse2 2.5s ease-in-out infinite',
        scaleIn: 'scaleIn .5s cubic-bezier(.22,1,.36,1) both',
        slideRight: 'slideRight .5s cubic-bezier(.22,1,.36,1) both',
        slideLeft: 'slideLeft .5s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};
