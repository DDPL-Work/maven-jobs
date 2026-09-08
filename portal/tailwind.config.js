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
          blue: "#143f86",
          teal: "#2ea9c4",
          lime: "#d6f33d",
          deep: "#0a244d",
        }
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        syne: ["Syne", "sans-serif"],
      }
    },
  },
  plugins: [],
}
