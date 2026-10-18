import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Stone Neutrals (warm paper & ink)
        stone: {
          25: '#FDFCFA',
          50: '#FAF9F6',
          100: '#F3F1EC',
          200: '#E7E4DC',
          300: '#D3CFC4',
          400: '#A8A398',
          500: '#7D786D',
          600: '#5C584F',
          700: '#433F38',
          800: '#2B2824',
          900: '#1A1815',
          950: '#100F0D',
        },
        // Marina Teal (brand primary)
        marina: {
          50: '#ECF6F5',
          100: '#D3EBE8',
          200: '#A8D6D1',
          300: '#74BCB5',
          400: '#3F9C94',
          500: '#1C807A',
          600: '#0E6B66', // Primary buttons, links, active
          700: '#0B5753',
          800: '#0A4542',
          900: '#083533',
        },
        // Turmeric (signal highlight, used sparingly)
        turmeric: {
          50: '#FFF8E5',
          100: '#FFEFC2',
          300: '#FFD566',
          500: '#F4B000', // Single highlight per screen
          700: '#8A5A00',
        },
        // Status Colors (strictly separate from brand)
        status: {
          open: '#1B7F45',
          'open-bg': '#E8F5EC',
          'open-border': '#BFE3CB',
          closed: '#C2412D',
          'closed-bg': '#FCEDEA',
          'closed-border': '#F2C4BC',
          break: '#8A5A00',
          'break-bg': '#FFF3D6',
          'break-border': '#F5D78A',
          stale: '#7D786D',
          'stale-bg': '#F3F1EC',
          'stale-border': '#D3CFC4',
          info: '#2F5FD0',
          'info-bg': '#EAF0FD',
          'info-border': '#C3D4F6',
          danger: '#B3261E',
          'danger-bg': '#FDECEA',
          'danger-border': '#F5C2BD',
        },
        // Backward-compatible aliases
        brand: {
          50: '#ECF6F5',
          100: '#D3EBE8',
          200: '#A8D6D1',
          300: '#74BCB5',
          400: '#3F9C94',
          500: '#1C807A',
          600: '#0E6B66',
          700: '#0B5753',
          800: '#0A4542',
          900: '#083533',
        },
        surface: {
          50: '#FAF9F6',
          100: '#F3F1EC',
          200: '#E7E4DC',
          300: '#D3CFC4',
          800: '#2B2824',
          900: '#1A1815',
          950: '#100F0D',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-tamil-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'var(--font-tamil-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        tamil: ['var(--font-tamil-sans)', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 1px 2px 0 rgba(26, 24, 21, 0.05)',
        'paper-md': '0 4px 6px -1px rgba(26, 24, 21, 0.07), 0 2px 4px -2px rgba(26, 24, 21, 0.05)',
        'paper-lg': '0 10px 15px -3px rgba(26, 24, 21, 0.08), 0 4px 6px -4px rgba(26, 24, 21, 0.04)',
        card: '0 1px 3px 0 rgba(26, 24, 21, 0.06), 0 1px 2px -1px rgba(26, 24, 21, 0.06)',
        elevated: '0 10px 25px -5px rgba(26, 24, 21, 0.08), 0 8px 10px -6px rgba(26, 24, 21, 0.04)',
        glow: '0 0 20px -3px rgba(14, 107, 102, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
