import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Tests need sequential execution for multi-player scenarios
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid port conflicts with dev server
  reporter: 'html',
  use: {
    // Use IPv4 loopback to avoid IPv6 binding issues in some environments
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: process.env.CI ? 'yarn start' : 'yarn dev',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      env: {
        // Ensure the app points to the same PartyKit host/port the tests start below
        NEXT_PUBLIC_PARTYKIT_HOST: '127.0.0.1:1999',
      },
    },
    {
      // Force PartyKit to bind to the expected port so the client can connect
      command: 'yarn dev:party -- -p 1999',
      // PartyKit is a WebSocket server - no HTTP endpoint to poll
      // Detect readiness from stdout "Ready on" message instead
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      env: {
        NEXT_PUBLIC_PARTYKIT_HOST: '127.0.0.1:1999',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
