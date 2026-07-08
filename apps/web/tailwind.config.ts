import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
        colors: {
        primary: { DEFAULT: "#006d5b", light: "#00897b", dark: "#004d40" },
        accent: { DEFAULT: "#e65100", light: "#ff7043", dark: "#bf360c" },
        janavaani: {
          primary: "#00695C",
          accent: "#E85D04",
          teal: "#00796B",
          secondary: "#26A69A",
        },
        surface: { DEFAULT: "#f4f6f8", card: "#ffffff" },
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
