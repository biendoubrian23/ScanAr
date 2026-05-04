import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e2e1ff',
          200: '#cac8ff',
          300: '#a9a4ff',
          400: '#8b7bff',
          500: '#7c5bfa',
          600: '#6d3aef',
          700: '#5d2ad4',
          800: '#4d24ac',
          900: '#401f8a',
          950: '#26115e',
        },
        dark: {
          50:  '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b9c2',
          400: '#9192a0',
          500: '#747587',
          600: '#5e5f70',
          700: '#4d4d5b',
          800: '#42424e',
          900: '#3a3a43',
          950: '#0d0d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero':
          'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(109,58,239,0.35) 0%, transparent 70%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
