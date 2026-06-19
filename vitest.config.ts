import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://carwash:carwash@localhost:3306/carwash_test',
      JWT_SECRET: 'test-secret-key-not-for-production',
      JWT_EXPIRES_IN: '1h',
      BUSINESS_OPEN: '8',
      BUSINESS_CLOSE: '18',
    },
  },
});
