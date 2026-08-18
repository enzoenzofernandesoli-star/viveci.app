import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0E1A",
        surface: "#121826",
        border: "#1E2637",
        action: "#2D6BFF",
        "action-dim": "#1E4FCC",
        ink: "#F2F5FA",
        muted: "#8A94A8",
        success: "#22C55E",
        warn: "#F59E0B",
      },
      fontFamily: {
        sora: ["var(--font-sora)"],
        display: ["var(--font-display)"],
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
