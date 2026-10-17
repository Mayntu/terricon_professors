import { defineConfig } from '@playwright/test'

const production = process.env.PITCH_BUILD === '1'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: [['list'], ['json', { outputFile: 'artifacts/test-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5182',
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.PITCH_EXTERNAL_SERVER === '1' ? undefined : {
    command: `node node_modules/vite/bin/vite.js ${production ? 'preview ' : ''}--host 127.0.0.1 --port 5182 --strictPort`,
    url: 'http://127.0.0.1:5182',
    reuseExistingServer: false,
  },
})
