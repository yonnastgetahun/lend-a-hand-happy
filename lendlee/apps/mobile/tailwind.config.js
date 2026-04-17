import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6B8F71",
        "primary-light": "#8AAD91",
        "primary-dark": "#4A6B4F",
        accent: "#C49A87",
        "accent-light": "#D4B5A6",
        "accent-dark": "#A67B68",
        earth: "#403633",
        "earth-light": "#6B5D5A",
        cream: "#FAF8F5",
        "warm-white": "#F5F2EB",
      },
    },
  },
  plugins: [],
} satisfies Config;
