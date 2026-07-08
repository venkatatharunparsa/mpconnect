import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
        colors: {
        primary: { DEFAULT: "#006d5b", light: "#00897b", dark: "#004d40", container: "#0b6e6e" },
        accent: { DEFAULT: "#e65100", light: "#ff7043", dark: "#bf360c" },
        secondary: { DEFAULT: "#4b41e1", container: "#645efb" },
        tertiary: { DEFAULT: "#7E22CE", container: "#8830d8" },
        "authority-indigo": "#4F46E5",
        "on-surface": "#131b2e",
        "on-surface-variant": "#3e4948",
        "outline-variant": "#bec9c8",
        outline: "#6e7979",
        "surface-container-low": "#f2f3ff",
        "surface-container-high": "#e2e7ff",
        janavaani: {
          primary: "#00695C",
          accent: "#E85D04",
          teal: "#00796B",
          secondary: "#26A69A",
        },
        surface: { DEFAULT: "#faf8ff", card: "#ffffff" },
        state: {
          claimed: "#f59e0b",
          active: "#00897b",
          reopened: "#ef4444",
          resolved: "#22c55e",
        },
        verified: "#22c55e",
        reopened: "#ef4444",
        claimed: "#f59e0b",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 45, 38, 0.08)",
        fab: "0 4px 20px rgba(230, 81, 0, 0.45)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
