import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0E1116", 2: "#1A1F27" },
        bone: "#E8E2D0",
        brass: { DEFAULT: "#AD8536", light: "#D9AF63" },
        rise: "#3E6B57",
        fall: "#8C4A3B",
        slate: "#8A93A0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-plex)", "ui-monospace", "monospace"],
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: { ticker: "ticker 70s linear infinite" },
    },
  },
  plugins: [],
};

export default config;
