import type { Config } from 'tailwindcss';

/**
 * MedSlot Tailwind CSS configuration.
 *
 * Desktop-first breakpoint strategy (CLAUDE.md requirement):
 * Base (unprefixed) styles target 1280px+ (desktop).
 * Breakpoints use max-width to adapt downward to tablet and mobile.
 *
 * sm: ≤767px  — tablet and below
 * xs: ≤374px  — mobile only
 * md: ≤1279px — below desktop (between tablet and desktop)
 *
 * Do NOT use min-width breakpoints — this is intentional and non-negotiable.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Desktop-first: base styles are 1280px+
    // Breakpoints adapt downward via max-width
    screens: {
      xs: { max: '374px' },   // mobile only (≤374px)
      sm: { max: '767px' },   // tablet and below (≤767px)
      md: { max: '1279px' },  // below desktop (≤1279px)
      // No min breakpoint — base styles ARE the desktop (1280px+) target
    },
    extend: {
      colors: {
        // Design system tokens from DESIGN-SYSTEM.md
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
