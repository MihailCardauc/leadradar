import { z } from 'zod';
import { context, load, failure, assertOrigin, body, requireAdmin, mutate, AppError } from '../../../server/store';
import { audit } from '../../../server/service';
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    if (ctx.mode !== 'live' || process.env.HUBSPOT_TENANT_ID !== ctx.tenant || !process.env.HUBSPOT_ACCESS_TOKEN) throw new AppError(503,'HubSpot must be configured for this authenticated workspace');
    const p = z.object({ actionId: z.string(), companyRecordId: z.string().regex(/^\d+$/), confirm: z.boolean().default(false) }).parse(await body(request));
    const w = await load(ctx), action = w.actions.find(a => a.id === p.actionId), company = w.companies.find(c => c.id === action?.companyId);
    if (!action || !company || company.identity !== 'confirmed') throw new AppError(409,'A confirmed company and draft are required');
    const headers = { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${p.companyRecordId}?properties=name,domain`,{headers,signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new AppError(502,'HubSpot company read failed; check authorization');
    const record = await response.json();
    if (String(record.properties?.domain ?? '').toLowerCase().replace(/^www\./,'') !== company.domain.toLowerCase().replace(/^www\./,'')) throw new AppError(409,'CRM domain mismatch. Resolve identity before writing.');
    if (!p.confirm) return Response.json({ preview: { companyRecordId: p.companyRecordId, name: record.properties.name, body: action.body, status: action.status } });
    if (process.env.HUBSPOT_TEST_WRITES_ENABLED !== 'true') throw new AppError(403,'Test CRM writes are disabled until account and scopes are confirmed');
    const reservation = await mutate(ctx,w => { const a = w.actions.find(a => a.id === p.actionId)!;
      if (a.status === 'sent') return 'sent'; if (a.status !== 'draft') throw new AppError(409,'Write is pending or uncertain. Reconcile in HubSpot before retrying.');
      a.status = 'sending'; audit(w,ctx,'crm.reserved',a.id); return 'reserved'; });
    if (reservation.result === 'sent') return Response.json({ status: 'sent', alreadySent: true });
    try {
      const write = await fetch('https://api.hubapi.com/crm/v3/objects/notes',{method:'POST',headers,signal:AbortSignal.timeout(15000),body:JSON.stringify({ properties: { hs_timestamp: new Date().toISOString(), hs_note_body: action.body.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') + `\nLeadRadar action: ${action.id}` }, associations: [{ to: { id: p.companyRecordId }, types: [{ associationCategory:'HUBSPOT_DEFINED',associationTypeId:190 }] }] })});
      if (!write.ok) throw new Error('Write not confirmed'); const saved = await write.json();
      await mutate(ctx,w => { const a=w.actions.find(a=>a.id===p.actionId)!; a.status='sent'; a.remoteId=String(saved.id); audit(w,ctx,'crm.sent',a.id); });
      return Response.json({status:'sent'});
    } catch { await mutate(ctx,w=>{const a=w.actions.find(a=>a.id===p.actionId)!;a.status='uncertain';audit(w,ctx,'crm.uncertain','Reconcile before any retry');});throw new AppError(502,'CRM result is uncertain. Do not retry until reconciled.'); }
  } catch(e) { return failure(e); }
}
