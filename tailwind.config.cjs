/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "Georgia", "serif"],
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ocean: {
          950: "#050a0f",
          900: "#070e18",
          800: "#0a1628",
          700: "#0d1f3c",
          600: "#102a50",
        },
        cyan: {
          400: "#22d3ee",
          300: "#67e8f9",
          200: "#a5f3fc",
        },
        wolf: {
          400: "#4fc3f7",
          300: "#81d4fa",
        },
      },
    },
  },
  plugins: [],
};
