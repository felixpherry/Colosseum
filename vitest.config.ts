import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@colosseum/db': path.resolve(__dirname, 'packages/db/src'),
      '@colosseum/lib': path.resolve(__dirname, 'packages/lib/src'),
      '@colosseum/trpc': path.resolve(__dirname, 'packages/trpc/src'),
      '@colosseum/types': path.resolve(__dirname, 'packages/types/src'),
    },
  },
});
