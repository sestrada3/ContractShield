/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1628',
          900: '#0F1F38',
          800: '#1E293B',
          700: '#263548',
          600: '#334155',
        },
        gold: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #1E293B 0%, #0A1628 60%)',
        'card-gradient': 'linear-gradient(135deg, #1E293B 0%, #0F1F38 100%)',
      },
    },
  },
  plugins: [],
};
