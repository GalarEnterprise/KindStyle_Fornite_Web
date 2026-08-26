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
      },
    },
  },
  plugins: [],
}

export default config
