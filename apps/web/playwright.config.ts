import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const apiPort = Number(process.env['E2E_API_PORT'] ?? 3100);
const webPort = Number(process.env['E2E_WEB_PORT'] ?? 3101);
const apiURL = `http://localhost:${apiPort}`;
const webURL = `http://localhost:${webPort}`;
const repoRoot = path.resolve(import.meta.dirname, '../..');
const ci = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  reporter: ci ? 'github' : 'list',
  use: {
    baseURL: webURL,
    locale: 'pl-PL',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'pnpm turbo run build --filter=@building-management/contracts --ui=stream' +
        ' && pnpm --filter server exec nest start',
      cwd: repoRoot,
      url: `${apiURL}/api/health`,
      env: { PORT: String(apiPort), BETTER_AUTH_URL: apiURL, WEB_URL: webURL },
      reuseExistingServer: !ci,
      timeout: 120_000,
      stdout: 'pipe',
    },
    {
      command: `pnpm exec next dev --port ${webPort}`,
      url: webURL,
      env: { API_URL: apiURL },
      reuseExistingServer: !ci,
      timeout: 120_000,
      stdout: 'pipe',
    },
  ],
});
