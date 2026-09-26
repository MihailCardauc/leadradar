import { z } from 'zod';
import { companySchema, type Company } from './model';
import { parseCsv } from './accounting';
import { normalizeDomain, identifierKind } from './identity';

/**
 * Company list import (CSV). Domain is the primary key for deduplication; a legal identifier is stored but never
 * confirms identity on its own: rows arrive as `candidate` until verified (ANAF for a CUI) or confirmed with a reason.
 * Required header: name,domain. Optional: legal_id,country,region,industry,employees,revenue,owner.
 */
export const companyImportHeaders = ['name', 'domain', 'legal_id', 'country', 'region', 'industry', 'employees', 'revenue', 'owner'] as const;
const num = z.string().optional().transform(v => !v?.trim() ? null : Number(v.replace(/[\s,]/g, ''))).pipe(z.number().finite().nonnegative().nullable());
const rowSchema = z.object({
  name: z.string().trim().min(2).max(160), domain: z.string().trim().min(3).max(200),
  legal_id: z.string().trim().max(80).default(''), country: z.string().trim().max(80).default(''), region: z.string().trim().max(80).default(''),
  industry: z.string().trim().max(100).default(''), employees: num, revenue: num, owner: z.string().trim().max(100).default(''),
});

export const slugId = (name: string) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'company';

export type CompanyImport = { companies: Company[]; skipped: { row: number; name: string; reason: string }[] };

export function importCompanies(csv: string, existing: Company[], live: boolean): CompanyImport {
  const [headerRow, ...rows] = parseCsv(csv.replace(/^﻿/, ''));
  const headers = (headerRow ?? []).map(h => h.trim().toLowerCase());
  if (!headers.includes('name') || !headers.includes('domain')) throw new Error(`CSV needs at least the headers name,domain (optional: ${companyImportHeaders.slice(2).join(',')})`);
  const unknown = headers.filter(h => !(companyImportHeaders as readonly string[]).includes(h));
  if (unknown.length) throw new Error(`Unknown column(s): ${unknown.join(', ')}`);
  if (rows.length > 200) throw new Error('Import at most 200 companies at a time');
  const out: Company[] = []; const skipped: CompanyImport['skipped'] = [];
  const takenIds = new Set(existing.map(c => c.id)), takenDomains = new Set(existing.map(c => normalizeDomain(c.domain))), takenLegal = new Set(existing.map(c => c.legalId).filter(Boolean));
  rows.forEach((r, i) => {
    const line = i + 2;
    if (r.length !== headers.length) { skipped.push({ row: line, name: r[0] ?? '', reason: 'wrong column count' }); return; }
    const parsed = rowSchema.safeParse(Object.fromEntries(headers.map((h, j) => [h, r[j]])));
    if (!parsed.success) { skipped.push({ row: line, name: r[0] ?? '', reason: parsed.error.issues.map(x => `${x.path.join('.')} ${x.message}`).join('; ') }); return; }
    const v = parsed.data; const domain = normalizeDomain(v.domain);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) { skipped.push({ row: line, name: v.name, reason: 'invalid domain' }); return; }
    if (takenDomains.has(domain)) { skipped.push({ row: line, name: v.name, reason: 'domain already in the workspace' }); return; }
    if (v.legal_id && identifierKind(v.legal_id) === 'invalid') { skipped.push({ row: line, name: v.name, reason: 'invalid legal identifier' }); return; }
    if (v.legal_id && takenLegal.has(v.legal_id)) { skipped.push({ row: line, name: v.name, reason: 'legal identifier already in the workspace' }); return; }
    let id = slugId(v.name); for (let n = 2; takenIds.has(id); n++) id = `${slugId(v.name).slice(0, 55)}-${n}`;
    const company = companySchema.parse({
      id, name: v.name, domain, legalId: v.legal_id, country: v.country || null, region: v.region || undefined, industry: v.industry || null,
      employees: v.employees === null ? null : Math.round(v.employees), revenue: v.revenue, identity: 'candidate', owner: v.owner || 'Unassigned', relationship: 'unknown',
      synthetic: !live, dataMode: live ? 'live' : 'synthetic', firmographicsSource: 'CSV import (unverified)', firmographicsAsOf: new Date().toISOString().slice(0, 7),
    });
    takenIds.add(id); takenDomains.add(domain); if (v.legal_id) takenLegal.add(v.legal_id);
    out.push(company);
  });
  return { companies: out, skipped };
}
