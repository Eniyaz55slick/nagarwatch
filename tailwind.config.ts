import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: "#0a0f1e", secondary: "#0f172a", card: "#111827" },
        border:   { DEFAULT: "#1e293b", light: "#334155" },
        accent:   { DEFAULT: "#6366f1", hover: "#4f46e5", light: "#818cf8" },
        violet:   { DEFAULT: "#8b5cf6", light: "#a78bfa" },
        success:  { DEFAULT: "#10b981", light: "#34d399" },
        warning:  { DEFAULT: "#f59e0b", light: "#fbbf24" },
        danger:   { DEFAULT: "#ef4444", light: "#f87171" },
        text:     { DEFAULT: "#f8fafc", muted: "#94a3b8", subtle: "#64748b" },
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "grid": "32px 32px",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow":  "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" },                          "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
