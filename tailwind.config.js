const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  prefix: 'tw-',
  content: [
    './views/**/*.{html, ejs}',
    './public/js/*.js'
  ],
  darkMode: 'media', // or 'class' or false
  theme: {
    extend: {
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
      }
    }
  },
  variants: {},
  plugins: [
    require("@tailwindcss/typography"),
    require("autoprefixer"),
    require("daisyui"),
  ],
  daisyui: {
    styled: true,
    themes: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "black",
  },
}
