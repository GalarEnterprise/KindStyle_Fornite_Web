import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/web/src/**/*.test.ts', 'packages/**/*.test.ts', 'workers/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@kindstyle/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@kindstyle/database': path.resolve(__dirname, 'packages/database/src'),
    },
  },
})
