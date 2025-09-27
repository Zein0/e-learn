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
          50: "#FEFBEA",
          100: "#F7F0D1",
          200: "#E9DFB0",
          300: "#D6C98A",
          400: "#C0B16C",
          500: "#A3904D",
          600: "#87743A",
          700: "#64542A",
          800: "#43371C",
          900: "#271F10",
        },
        emerald: {
          50: "#E0F2F2",
          100: "#B3DEDE",
          200: "#80C8C8",
          300: "#4DB2B2",
          400: "#269E9E",
          500: "#008080",
          600: "#006666",
          700: "#004D4D",
          800: "#003333",
          900: "#001A1A",
        },
        sand: "#FEFBEA",
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
