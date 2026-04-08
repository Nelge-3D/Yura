import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        yura: {
          deep: "#1a2e1a",
          forest: "#2d5a27",
          sage: "#4a7c59",
          mint: "#7fb89a",
          cream: "#f5f0e8",
          gold: "#c9935a",
          amber: "#e8a84a",
        },
      },
      animation: {
        "spin-slow": "spin 10s linear infinite",
        "bounce-dot": "bounce 1s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;