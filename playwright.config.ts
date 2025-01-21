import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'https://www.wildberries.ru',
    channel: 'chrome',
    headless: false,
    viewport: null,
    launchOptions: {
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    },
    navigationTimeout: 60000,
    actionTimeout: 15000
  },
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
        viewport: null,
        launchOptions: {
          args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      },
    },
  ],
}); 