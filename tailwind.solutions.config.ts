import type { Config } from "tailwindcss";

import baseConfig from "./tailwind.config";

const solutionsConfig: Config = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./engine/**/*.{ts,tsx}",
    "./kits/**/*.{ts,tsx}",
    "./books/**/*.{ts,tsx}",
  ],
};

export default solutionsConfig;
