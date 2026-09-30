/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#2f6fed",
          600: "#2457c9",
          700: "#1c46a3",
        },
        urgent: "#e0523f",
        warn: "#e0a53f",
        ok: "#2f9e6b",
        ink: "#12172b",
        paper: "#f6f8fc",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,23,43,0.04), 0 1px 8px rgba(18,23,43,0.06)",
      },
    },
  },
  plugins: [],
}
