import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-main)", "system-ui", "sans-serif"],
      },
      colors: {
        coffee: { DEFAULT: "#2b160b", 800: "#43230f" },
        brand: { DEFAULT: "#f08a24", dark: "#d9730f" },
        cream: "#fff7ee",
      },
    },
  },
  plugins: [],
};
export default config;
