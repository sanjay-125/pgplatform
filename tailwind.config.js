/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef3ff',
          100: '#dce6ff',
          200: '#bdd0fe',
          300: '#91b1fd',
          400: '#5e89fa',
          500: '#3b6cf6',
          600: '#254fe8',
          700: '#1d3cc8',
          800: '#1e33a1',
          900: '#17233b',
          950: '#101a2c',
        },
      },
    },
  },
  plugins: [],
}
