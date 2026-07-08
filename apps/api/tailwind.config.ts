import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Civic, trustworthy, not party-colored (deliberate: no party palette)
        primary: { DEFAULT: "#0f4c81", light: "#3b82c4", dark: "#0a3357" },
        // Demand lifecycle states (dashboard map markers + badges)
        state: {
          claimed: "#f59e0b", // amber-500
          active: "#3b82f6", // blue-500 — validated_public, routed, in_progress
          reopened: "#ef4444", // red-500
          resolved: "#22c55e", // green-500 — resolved_verified
        },
        verified: "#22c55e",
        reopened: "#ef4444",
        claimed: "#f59e0b",
      },
    },
  },
  plugins: [],
} satisfies Config;
