import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for DES Energy Monitor.
 * webServer boots Vite with dummy Supabase env — E2E uses ?e2eMock=1 so no real backend.
 */
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Dummy credentials so Vite builds; Realtime is never used in e2eMock mode
      VITE_SUPABASE_URL: 'https://e2e-mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-mock-anon-key',
    },
  },
})
