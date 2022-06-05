const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  content: [
    './views/*.ejs',
    './public/**/*.{js, css, html}'
  ],
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
