/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#6d28d9',
          600: '#5b21b6',
        },
        accent: {
          500: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
