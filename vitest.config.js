import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'android/**',
        '**/*.test.js',
        '**/*.spec.js',
        'vitest.config.js'
      ]
    }
  }
});