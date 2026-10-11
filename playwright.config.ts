import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 6_000 },
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1920, height: 1000 }, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1000 },
        // Optional: reuse an already installed Chrome or Chromium instead of `npx playwright install chromium`.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
      },
    },
  ],
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true },
})
