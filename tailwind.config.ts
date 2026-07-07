import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Civic, trustworthy, not party-colored (deliberate: no party palette)
        primary: { DEFAULT: "#0f4c81", light: "#3b82c4", dark: "#0a3357" },
        verified: "#15803d",
        reopened: "#b91c1c",
        claimed: "#a16207",
      },
    },
  },
  plugins: [],
} satisfies Config;
