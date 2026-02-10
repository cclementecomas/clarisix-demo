/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cx: {
          50: '#E6F3FA',
          100: '#D0E8F5',
          200: '#A8D4EC',
          300: '#4B9DCC',
          400: '#3889B8',
          500: '#0E5A8A',
          600: '#0C4F79',
          700: '#0B4B72',
          800: '#083D5E',
          900: '#052E4A',
        },
        navy: {
          800: '#1F2937',
          900: '#0B1220',
          950: '#060D19',
        },
      },
    },
  },
  plugins: [],
};
