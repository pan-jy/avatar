/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
  darkMode: 'selector',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        primary: colors.sky,
        test: colors.purple,
        bluegray: colors.slate,
        red: colors.rose,
        surface: colors.zinc,
        'surface-0': 'white'
      }
    }
  },
  plugins: []
}
