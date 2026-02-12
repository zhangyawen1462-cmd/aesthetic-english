import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* --- Synced with globals.css @theme --- */
      colors: {
        ecru: "#F2EFE5",
        "plum-wine": "#2D0F15",
        carbon: "#101211",
        "powder-blue": "#D8E3E7",
        sand: "#D6CBB9",
        "golden-sand": "#857861",
        "bone-white": "#D6CBB9",
      },
      fontFamily: {
        sans: ["Verdana", "-apple-system", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        serif: ["Didot", "Georgia", "Times New Roman", "Noto Serif", "Songti SC", "SimSun", "serif"],
        mono: ["SF Mono", "Menlo", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
