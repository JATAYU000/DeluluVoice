/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        orange: {
          400: '#ff8c42',
          500: '#ff5500', // vibrant neon orange
          600: '#e64d00',
          700: '#cc4400',
          900: '#4d1a00',
        },
        cream: {
          100: '#fdfbf7',
          200: '#f8f4e6',
        },
        dark: {
          900: '#000000', // true black
          800: '#0a0a0a', // almost black
          700: '#141414', // very dark gray
          600: '#1e1e1e', // dark gray
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #ff550033 0deg, #00000000 180deg, #ff550033 360deg)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(255, 85, 0, 0.5)',
        'neon-strong': '0 0 40px rgba(255, 85, 0, 0.7)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
