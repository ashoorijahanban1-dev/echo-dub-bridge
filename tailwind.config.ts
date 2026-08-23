import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        surface: "#0F172A",
        surfaceLight: "#1E293B",
        primary: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          glow: "rgba(6, 182, 212, 0.35)",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          glow: "rgba(139, 92, 246, 0.35)",
        },
        emerald: {
          DEFAULT: "#10B981",
          hover: "#059669",
        }
      },
      fontFamily: {
        sans: ["Vazirmatn", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(6, 182, 212, 0.4)",
        glowPurple: "0 0 25px -5px rgba(139, 92, 246, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};
export default config;
