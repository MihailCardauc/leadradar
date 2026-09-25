import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await expect(page.getByRole('heading',{name:'Your opportunity radar'})).toBeVisible();});
test('research, evidence, feedback and idempotent draft flow',async({page})=>{
  await page.getByRole('button',{name:'Open Meridian Financial',exact:true}).click();
  const modal=page.getByRole('dialog');await expect(modal.getByText('Evidence & score contributions')).toBeVisible();
  await modal.locator('summary').first().click();await expect(modal.getByText('SYNTHETIC SOURCE').first()).toBeVisible();
  await modal.getByLabel('Review reason').fill('Relevant initiative; verify external support needs.');await modal.getByRole('button',{name:'Accept',exact:true}).click();await expect(modal.getByText('Acceptance recorded. No outreach sent.')).toBeVisible();
  await modal.getByRole('button',{name:'Draft next step'}).click();await modal.getByRole('button',{name:'Confirm demo action'}).click();await expect(modal.getByText('Demo action saved locally. No HubSpot request made.')).toBeVisible();
  await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await page.getByRole('button',{name:'Start research'}).click();await page.getByRole('button',{name:'Replay demo evidence'}).click();await expect(page.getByText('completed',{exact:true})).toBeVisible();
});
test('configuration simulation, publication, rollback and persistence',async({page})=>{
  await page.getByRole('button',{name:'Configure signals'}).click();const modal=page.getByRole('dialog');
  await modal.getByLabel('Question 1 weight',{exact:true}).fill('80');await expect(modal.getByRole('button',{name:'Publish version'})).toBeDisabled();
  await modal.getByRole('button',{name:'Simulate changes'}).click();await expect(modal.getByText('Impact preview · same evidence, new rules')).toBeVisible();await modal.getByRole('button',{name:'Publish version'}).click();
  await expect(page.getByText('Ranked for cybersecurity · rules v2')).toBeVisible();await page.reload();await expect(page.getByText('Ranked for cybersecurity · rules v2')).toBeVisible();
  await page.getByRole('button',{name:'Services & rules',exact:true}).click();await page.getByLabel('Restore an earlier rule set').selectOption('1');await expect(page.getByText('VERSION 3',{exact:true})).toBeVisible();
});
test('filters, unknown gates, accounting and narrow viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.setViewportSize({width:1280,height:720});
  await page.getByLabel('Search companies').fill('Nord');await page.getByRole('button',{name:'Open Nord Logistics',exact:true}).click();await expect(page.getByRole('button',{name:'Draft next step'})).toBeDisabled();await page.keyboard.press('Escape');await expect(page.getByLabel('Search companies')).toHaveValue('Nord');
  await page.getByRole('button',{name:'Integrations',exact:true}).click();await page.getByLabel('CSV preview').fill('invoice_id,legal_id,service_id,description,amount,currency,date\nDEMO-1,DEMO-RO-001,,IT services,1000,EUR,2026-09-01');await page.getByRole('button',{name:'Validate & import'}).click();await expect(page.getByText('Unknown / generic')).toBeVisible();
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.getByRole('button',{name:'Toggle menu'}).click();await expect(page.getByRole('button',{name:'Opportunities',exact:true})).toBeVisible();
});
test('API denies missing sessions, cross-origin and MCP demo cookies',async({request,page})=>{
  const unauth=await request.get('/api/workspace');expect(unauth.status()).toBe(401);
  const forbidden=await page.request.post('/api/workspace',{headers:{origin:'https://evil.example'},data:{type:'publish',payload:{}}});expect(forbidden.status()).toBe(403);
  const mcp=await page.request.post('/api/mcp',{data:{jsonrpc:'2.0',method:'tools/list',id:1}});expect(mcp.status()).toBe(401);
});
