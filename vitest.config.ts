import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    workspace: [
      'packages/shared',
      'packages/sdk',
      'apps/worker',
    ],
  },
});
