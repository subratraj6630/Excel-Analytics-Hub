/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enables dark mode via class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all files in src/
  ],
  theme: {
    extend: {
      dropShadow: {
        glow: '0 0 8px rgba(255, 255, 255, 0.4)', // Used for hover/glow effects
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-scale': 'fadeInScale 0.5s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
