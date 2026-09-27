import { test, expect, type Page } from '@playwright/test';

/** End-to-end flows on an isolated demo workspace (synthetic data; no web, AI or CRM requests). */
async function openDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: 'Radar', exact: true })).toBeVisible({ timeout: 20000 });
}
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('tab', { name, exact: true }).click();
const card = (page: Page) => page.locator('aside.sheet');

test.beforeEach(async ({ page }) => { await openDemo(page); });

test('radar: real scores, explainable card, counterfactual and approve → queue (demo, local only)', async ({ page }) => {
  await expect(page.locator('.lrow')).toHaveCount(13);
  await page.locator('.lrow', { hasText: 'Danubia Energy SA' }).click();
  await expect(card(page).getByText('Company intelligence card')).toBeVisible();
  await expect(card(page).getByText('Priority, not purchase probability.', { exact: false })).toBeVisible();
  await expect(card(page).getByText('căutăm Information Security Officer', { exact: false })).toBeVisible();
  await card(page).getByRole('button', { name: 'What if wrong?' }).first().click();
  await expect(card(page).getByText(/Without this signal: P \d+ → \d+/)).toBeVisible();
  await card(page).getByRole('button', { name: 'Review and approve' }).click();
  await expect(card(page).getByText(/content hash [0-9a-f]{12}/)).toBeVisible();
  await card(page).getByRole('button', { name: 'Approve and queue for CRM' }).click();
  await expect(card(page).getByText('Delivered (demo, stored locally)')).toBeVisible();
  const outbox = await (await page.request.get('/api/jobs')).json() as { outbox: { status: string; remoteId: string }[] };
  expect(outbox.outbox).toEqual([expect.objectContaining({ status: 'delivered', remoteId: 'demo:local-only' })]);
});

test('reject needs a reason and feeds recalibration; gated accounts cannot be approved', async ({ page }) => {
  await page.locator('.lrow', { hasText: 'Cobalt Software' }).click();
  await expect(card(page).getByText(/Gated:/)).toBeVisible();
  await expect(card(page).getByRole('button', { name: /Review and approve|Review research task/ })).toBeDisabled();
  await card(page).getByRole('button', { name: 'Close' }).click();
  await page.locator('.lrow', { hasText: 'Meridian Financial' }).click();
  await card(page).getByRole('button', { name: 'Reject' }).click();
  await card(page).getByRole('button', { name: 'Expired signal' }).click();
  await nav(page, 'Actions');
  await expect(page.getByText('Expired signal')).toBeVisible();
});

test('tenders: CPV triage, requirement status updates T, Bid needs a reason and is logged', async ({ page }) => {
  await nav(page, 'Tenders');
  await expect(page.locator('.lrow', { hasText: 'Rețea SD-WAN' })).toContainText('not relevant');
  await page.locator('.lrow', { hasText: 'consultanță și audit NIS2' }).click();
  const sheet = card(page);
  await expect(sheet.getByText('Provisional')).toBeVisible();
  const before = await sheet.locator('.stat').nth(1).locator('.val span').first().innerText();
  await sheet.locator('.req button').first().click(); // unknown → met
  await expect(sheet.locator('.req button').first()).toHaveText('met');
  await expect(sheet.locator('.stat').nth(1).locator('.val span').first()).not.toHaveText(before);
  await sheet.getByRole('button', { name: 'Bid', exact: true }).click();
  await sheet.getByLabel(/Why bid/).fill('Strong local references and fit');
  await sheet.getByRole('button', { name: 'Confirm' }).click();
  await expect(sheet.getByText(/Bid · Strong local references and fit/)).toBeVisible();
});

test('signal builder: weight change simulates live, publish creates v2, rollback keeps history', async ({ page }) => {
  await nav(page, 'Signal Builder');
  await expect(page.getByText('Same companies, same evidence, same time')).toBeVisible();
  await expect(page.locator('.stack .seg-track').first()).toBeVisible({ timeout: 15000 });
  const weight = page.getByLabel(/^Weight for Is the company hiring GRC/);
  await weight.fill('60');
  await expect(page.locator('.delta').first()).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Save as reviewed version' }).click();
  await expect(page.getByText(/Published SCUT Consultanță NIS2 v2/)).toBeVisible();
  await page.getByRole('button', { name: 'v1', exact: true }).click();
  await expect(page.getByText('Restored v1 as a new version; history kept')).toBeVisible();
  await expect(page.locator('.tile[aria-pressed="true"]')).toContainText('v3');
});

test('actions: edit gives a new content hash, approval uses it; sent tab shows the case', async ({ page }) => {
  await page.locator('.lrow', { hasText: 'Atlas Manufacturing' }).click();
  await card(page).getByRole('button', { name: 'Edit draft' }).click();
  await expect(page.getByRole('heading', { name: 'Actions', exact: true })).toBeVisible();
  const sheet = card(page);
  const hash = await sheet.getByText(/Content hash [0-9a-f]{12}/).innerText();
  await sheet.getByRole('button', { name: 'Edit', exact: true }).click();
  await sheet.getByLabel('Draft text').fill('Internal note for the account owner: verify current services before any approach.');
  await sheet.getByRole('button', { name: 'Save draft' }).click();
  await expect(sheet.getByText(/Content hash [0-9a-f]{12}/)).not.toHaveText(hash);
  await sheet.getByRole('button', { name: 'Approve and queue for CRM' }).click();
  await page.getByRole('tab', { name: /Sent/ }).click();
  await expect(page.locator('.lrow', { hasText: 'Atlas Manufacturing' })).toBeVisible();
});

test('import: CSV companies arrive as identity candidates; real-company seed arrives for review', async ({ page }) => {
  await page.getByRole('button', { name: 'Import companies' }).click();
  await page.getByLabel('Or paste CSV').fill('name,domain,country,industry,employees\nNova Energy SRL,nova-energy.example,Romania,Energy,300');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await expect(page.getByText('1 added as identity candidates')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await nav(page, 'Companies');
  await page.getByPlaceholder(/Search name/).fill('Nova');
  await expect(page.locator('.co', { hasText: 'Nova Energy SRL' })).toContainText('Identity candidate');
  await nav(page, 'Radar');
  await page.getByRole('button', { name: 'Import companies' }).click();
  await page.getByRole('button', { name: 'Add real-company seed (review rows)' }).click();
  await expect(page.getByText(/Seed added · \d+ evidence rows waiting for review/)).toBeVisible();
});

test('metrics, how it works and theme toggle render from workspace data', async ({ page }) => {
  await nav(page, 'Metrics');
  await expect(page.getByText('Not enough graded decisions yet')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Hypothesis').first()).toBeVisible();
  await nav(page, 'How it works');
  await expect(page.getByRole('heading', { name: /Find reasons to call/ })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle light or dark theme' }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toMatch(/light|dark/);
});

test('narrow viewport has no horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const s of ['Radar', 'Companies', 'Tenders', 'Signal Builder', 'Actions', 'Metrics']) {
    await nav(page, s);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), s).toBe(true);
  }
});
