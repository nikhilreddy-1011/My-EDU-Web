import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E3A8C',
          dark: '#1F2861',
          tint: '#EEF0FB',
        },
        accent: {
          DEFAULT: '#FF6B4A',
          hover: '#e85e3f',
        },
        success: '#1FA97D',
        warning: '#E7A93B',
        background: '#F6F7FB',
        surface: '#FFFFFF',
        border: '#E4E7F0',
        text: {
          primary: '#12141F',
          muted: '#666B85',
          faint: '#9EA2B8',
        },
        // Dark mode surfaces
        dark: {
          bg: '#0F1117',
          surface: '#1A1D2E',
          surface2: '#232740',
          border: '#2D3154',
          text: '#E8EAF6',
          muted: '#9EA2B8',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sora: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        inter: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        xl2: '20px',
        xl3: '24px',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(46,58,140,0.07)',
        'card-hover': '0 8px 30px 0 rgba(46,58,140,0.12)',
        modal: '0 24px 64px 0 rgba(18,20,31,0.18)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'badge-pop': 'badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'counter': 'counter 1s ease-out',
        'progress-fill': 'progressFill 0.8s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '70%': { transform: 'scale(1.1) rotate(3deg)' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
      screens: {
        xs: '390px',
      },
    },
  },
  plugins: [],
}

export default config
