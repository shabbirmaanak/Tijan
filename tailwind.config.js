/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf5',
          100: '#f9f5e6',
          200: '#f2e7bf',
          300: '#ebd692',
          400: '#e3be5c',
          500: '#d4af37', // Classic Kasab Gold
          600: '#b89228',
          700: '#947220',
          800: '#795b20',
          900: '#674d20',
        },
        bohra: {
          cream: '#FAF8F5',
          paper: '#F5F2EB',
          border: '#E3DDD2',
          text: '#2C2824',
          muted: '#7A7369',
          kasab: '#D4AF37',
          maroon: '#781D22',
          green: '#1B4D3E',
          navy: '#132B45',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
