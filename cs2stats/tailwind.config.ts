import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0C0E",
        panel: "#12161A",
        panel2: "#171C21",
        line: "#232A30",
        line2: "#2E363D",
        ink: "#E7E6E1",
        muted: "#8B939A",
        dim: "#5B6469",
        t: "#D89A4E",
        tdim: "#8A6A3E",
        ct: "#5B9BC4",
        ctdim: "#3E6580",
        win: "#7FAE6A",
        loss: "#BD5C4E",
        gold: "#E8B94A"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(231,230,225,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(231,230,225,0.035) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "34px 34px"
      },
      letterSpacing: {
        widest2: "0.22em"
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        blip: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        sweep: "sweep 6s linear infinite",
        blip: "blip 2.4s ease-in-out infinite",
        rise: "rise 0.5s cubic-bezier(0.16,1,0.3,1) both"
      }
    }
  },
  plugins: []
};

export default config;
