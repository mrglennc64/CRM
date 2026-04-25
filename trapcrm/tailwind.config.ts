import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Style C palette
        bg: '#0D0F12',
        surface: '#15181C',
        line: '#252830',
        ink: '#FFFFFF',
        sub: '#A1A1AA',
        indigo: '#4F46E5',
        cyan: '#22D3EE',
        // Brand chips
        'b-heyroya': '#22D3EE',
        'b-trp-pro': '#6366F1',
        'b-verseiq': '#73BCA8',
        'b-traproyalties': '#5E6DFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
