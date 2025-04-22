/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage:{
        "home-bg": 'url("./src/assets/757572.jpg")',
        "home-bg-2": 'url("./src/assets/page2.jpg")',
      }
    },
  },
  plugins: [],
}

