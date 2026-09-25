import { test, expect } from '@playwright/test';
test('application boots and health endpoint does not claim connected dependencies', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /The right company.*The right moment/ })).toBeVisible({timeout:15000});
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: 'ok', scope: 'application-process', dependenciesVerified: false });
});
