import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { accent: { DEFAULT: '#DB4C3F', hover: '#C4392D' }, text: '#202124', muted: '#5F6368', border: '#E8EAED', sidebar: '#FAFAFA', today: '#158A3C', overdue: '#D1453B', priority: { 1: '#D1453B', 2: '#EB8909', 3: '#246FE0' } }, fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] }, borderRadius: { input: '8px' } } },
  plugins: [],
};
export default config;
