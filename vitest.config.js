import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['www/__tests__/**/*.test.js'],
    environment: 'node',
    globals: true
  }
});
