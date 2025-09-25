import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          50: "#F5F1E8",
          100: "#E9DEC7",
          200: "#DAC7A3",
          300: "#C9AE7C",
          400: "#B7915A",
          500: "#9C7640",
          600: "#7C5B2F",
          700: "#604422",
          800: "#422F17",
          900: "#261B0D",
        },
        emerald: {
          500: "#3E8467",
          600: "#326A52",
        },
        sand: "#F5EAD8",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", ...fontFamily.sans],
        display: ["var(--font-baloo)", ...fontFamily.sans],
      },
      borderRadius: {
        xl: "1.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
