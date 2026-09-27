import { defineConfig } from '@playwright/test';

// E2E_BASE_URL=http://localhost:3000 runs the suite against an already running dev server
// (Next.js allows only one `next dev` per project); otherwise Playwright starts its own on port 3100.
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: external ?? 'http://127.0.0.1:3100' },
  webServer: external ? undefined : { command: 'npm run dev -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 120000 },
});
