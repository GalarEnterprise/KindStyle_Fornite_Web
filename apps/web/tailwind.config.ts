import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fortnite: {
          purple: '#8A2BE2',
          dark: '#1A1A2E',
          blue: '#16213E',
          accent: '#0F3460',
        },
        'fortnite-purple': {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
        },
      },
    },
  },
  plugins: [],
}

export default config
