import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ecru: "#E8E4D9",
        "plum-wine": "#48252F",
        carbon: "#101211",
        sand: "#D6CBB9",
        "golden-sand": "#857861",
      },
      fontFamily: {
        sans: ["Verdana", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;