import { test, expect } from '@playwright/test';

test('boots to the welcome screen; health never claims connected dependencies', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Don.t find leads\. Find reasons to call\./ })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Explore the demo' })).toBeVisible();
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ status: 'ok', scope: 'application-process', dependenciesVerified: false });
  expect(await (await request.get('/api/session')).json()).toMatchObject({ signedIn: false });
});

test('API denies missing sessions, cross-origin writes and MCP demo cookies', async ({ request, page }) => {
  expect((await request.get('/api/workspace')).status()).toBe(401);
  expect((await page.request.post('/api/workspace', { headers: { origin: 'https://evil.example' }, data: { type: 'publish', payload: {} } })).status()).toBe(403);
  expect((await page.request.post('/api/mcp', { data: { jsonrpc: '2.0', method: 'tools/list', id: 1 } })).status()).toBe(401);
  expect((await request.post('/api/tender/inbound', { data: { text: 'x'.repeat(40) } })).status()).toBe(503); // not configured → refused
});
