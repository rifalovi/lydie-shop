import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: "#F8C8D4",
          light: "#FDE8EE",
          dark: "#E8A0B4",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8D08A",
          dark: "#9A7A2E",
        },
        cream: "#FFF9F5",
        ink: {
          DEFAULT: "#3D2B35",
          muted: "#8A6B76",
        },
        borderSoft: "#F0D0DC",
      },
      fontFamily: {
        script: ['"Great Vibes"', "cursive"],
        serif: ['"Cormorant Garamond"', "serif"],
        sans: ['"Nunito"', "system-ui", "sans-serif"],
        ui: ['"Raleway"', "system-ui", "sans-serif"],
        num: ['"Montserrat"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        soft: "16px",
        luxe: "24px",
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(232, 160, 180, 0.35)",
        gold: "0 10px 28px -10px rgba(201, 168, 76, 0.45)",
        lift: "0 20px 44px -16px rgba(61, 43, 53, 0.18)",
      },
      backgroundImage: {
        "gradient-royal":
          "linear-gradient(135deg, #F8C8D4 0%, #E8A0B4 40%, #C9A84C 100%)",
        "gradient-gold":
          "linear-gradient(135deg, #E8D08A 0%, #C9A84C 55%, #9A7A2E 100%)",
        "gradient-rose-soft":
          "linear-gradient(180deg, #FFF9F5 0%, #FDE8EE 100%)",
      },
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        sparkle: "sparkle 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
