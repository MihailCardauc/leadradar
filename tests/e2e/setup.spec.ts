import { test, expect } from '@playwright/test';

test('landing page: hero, header buttons, and See the demo opens the app without sign-in', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Finding one client is easy/ })).toBeVisible({ timeout: 20000 });
  const header = page.locator('header.nav');
  await expect(header.getByRole('link', { name: 'See GitHub' })).toHaveAttribute('href', 'https://github.com/MihailCardauc/leadradar');
  await expect(header.getByRole('link', { name: 'See GitHub' })).toHaveAttribute('target', '_blank');
  await expect(header.getByRole('link', { name: 'See presentation' })).toHaveAttribute('href', 'presentation.html');
  await page.locator('.cta').getByRole('link', { name: 'See the demo' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Radar', exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.pill-note')).toHaveText('Demo');
  await expect(page.getByText('Sign in')).toHaveCount(0);
  const health = await request.get('/api/health');
  expect(await health.json()).toMatchObject({ status: 'ok', scope: 'application-process', dependenciesVerified: false });
});

test('landing subpages and the presentation placeholder resolve', async ({ page }) => {
  for (const path of ['/legal/privacy.html', '/blog/challenge-coverage.html', '/presentation.html']) {
    const r = await page.goto(path); expect(r?.status(), path).toBe(200);
  }
  await page.goto('/legal/privacy.html');
  await page.locator('a[href="../index.html"]').first().click();
  await expect(page.getByRole('heading', { level: 1, name: /Finding one client is easy/ })).toBeVisible();
});

test('API still denies missing sessions, cross-origin writes and MCP demo cookies', async ({ request, page }) => {
  expect((await request.get('/api/workspace')).status()).toBe(401);
  expect((await page.request.post('/api/workspace', { headers: { origin: 'https://evil.example' }, data: { type: 'publish', payload: {} } })).status()).toBe(403);
  expect((await page.request.post('/api/mcp', { data: { jsonrpc: '2.0', method: 'tools/list', id: 1 } })).status()).toBe(401);
  expect((await request.post('/api/tender/inbound', { data: { text: 'x'.repeat(40) } })).status()).toBe(503); // not configured → refused
});
