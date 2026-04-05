/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Keep for backward compat
        felt: {
          900: '#0a2e1a',
          800: '#0d3b22',
          700: '#11492b',
          600: '#165a36',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4a017',
          600: '#b8860b',
        },
        wood: {
          700: '#5c3a1e',
          800: '#4a2e17',
          900: '#3b2312',
        },
        // Midnight Luxe tokens
        midnight: {
          950: '#0e0e14',
          900: '#13131f',
          800: '#1a1a2c',
          700: '#22223a',
        },
        'antique-gold': {
          700: '#A8883A',
          600: '#C9A84C',
          500: '#D4A84C',
          400: '#E8C96B',
          300: '#F0DC9A',
        },
        jade: {
          950: '#0f2a1f',
          900: '#1a3d2e',
          800: '#224d3a',
          700: '#2d6a4f',
          600: '#3a8a66',
        },
        crimson: {
          950: '#2a0a0a',
          900: '#3d0f0f',
          700: '#C0392B',
          500: '#E74C3C',
          400: '#F06055',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.5)',
        glow: '0 0 18px rgba(201, 168, 76, 0.35)',
        'glow-jade': '0 0 16px rgba(45, 106, 79, 0.40)',
        panel: '0 4px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(201,168,76,0.08) inset',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
