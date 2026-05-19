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
        dark: {
          950: '#0b0d12',
          900: '#0d0f15',
          800: '#13161e',
          700: '#171b26',
          600: '#1e2333',
        },
        gold: {
          300: '#e4cc8a',
          400: '#d4b86a',
          500: '#c9a84c',
          600: '#b8943a',
        },
        green:  { DEFAULT: '#4caf7d' },
        blue:   { DEFAULT: '#4a9eff' },
        red:    { DEFAULT: '#e05252' },
        amber:  { DEFAULT: '#e0993a' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #171b26 0%, #0b0d12 60%)',
        'card-gradient': 'linear-gradient(135deg, #13161e 0%, #0d0f15 100%)',
      },
    },
  },
  plugins: [],
};
