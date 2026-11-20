import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests, run against the production build served by `vite preview`.
 * `vite preview` has no functions, so `/api/contact` is missing unless a test
 * stands one in, which is exactly what the "unavailable" fallback needs.
 *
 *   npm run build && npm run test:e2e
 *
 * PW_CHROMIUM_ARGS passes extra switches to Chromium, for example
 * `--use-gl=disabled` on a machine without a GPU, where the 3D view would
 * otherwise hold every frame back.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: {
      args: (process.env.PW_CHROMIUM_ARGS ?? '').split(' ').filter(Boolean),
    },
  },
  webServer: {
    command: 'npm start -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
