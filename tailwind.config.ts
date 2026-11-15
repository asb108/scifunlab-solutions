import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./engine/**/*.{ts,tsx}",
    "./kits/**/*.{ts,tsx}",
    "./books/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderWidth: {
        "3": "3px",
      },
      fontFamily: {
        comic: ["var(--font-comic)", "Bangers", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "neo-xs": "1.5px 1.5px 0 0 #0F172A",
        "neo-xl": "11px 11px 0 0 #0F172A",
        "neo-white": "4px 4px 0 0 #FFFFFF",
      },
      colors: {
        "comic-paper": "#FFFDF8",
        "comic-ink": "#0F172A",
        "comic-yellow": "#FFDE59",
        "comic-coral": "#FF6B6B",
        "comic-green": "#4ADE80",
        "comic-violet": "#5B50FF",
        "comic-cyan": "#00E5FF",
        "comic-amber": "#FF9F1C",
        "comic-dark": "#0B0E17",
      },
    },
  },
};

export default config;
