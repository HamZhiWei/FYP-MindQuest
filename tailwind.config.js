/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'chalk-green': {
          DEFAULT: '#1e4a2a',
          dark: '#122e19',
          light: '#2a6038',
        },
        'chalk-white': '#f0ece0',
        'wood-brown': '#5c3317',
        parchment: {
          DEFAULT: '#d4b896',
          dark: '#b8956e',
          light: '#e8d4b8',
        },
      },
      fontFamily: {
        chalk: ['"Patrick Hand"', '"League Spartan"', 'cursive', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

