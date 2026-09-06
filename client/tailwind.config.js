/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      colors: {
        forest: {
          50: '#d8f3dc',
          100: '#b7e4c7',
          200: '#95d5b2',
          300: '#74c69d',
          400: '#52b788',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1b4332',
          800: '#081c15',
          900: '#020617',
        },
        charcoal: {
          50: '#f4f6f8',
          100: '#e5e7eb',
          800: '#1c1f24',
          900: '#141619',
          950: '#0d0e10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(0, 0, 0, 0.08)',
        glow: '0 8px 32px -8px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
};
