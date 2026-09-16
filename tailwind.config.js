/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mirrors src/lib/constants.ts — keep the two in sync.
        primary: "#1D63ED",
        "primary-foreground": "#FFFFFF",
        "muted-foreground": "#9D9D9D",
        "mfp-bg": "#EEF1F5",
        "mfp-bg-top": "#E4EEFB",
        carbs: "#2BC4A6",
        fat: "#7A3FB3",
        protein: "#F5A623",
        "track-gray": "#E7E9EC",
        danger: "#E11D48",
      },
      fontFamily: {
        sans: ["Nunito", "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};
