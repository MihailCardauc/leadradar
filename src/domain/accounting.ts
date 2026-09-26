import { z } from 'zod';
import type { Company, Invoice, Service } from './model';

/** Fictitious accounting CSV in demo; authorised export in pilot. Generic descriptions keep the product unknown. */
export function parseCsv(text: string): string[][] {
  if (text.length > 250000) throw new Error('CSV exceeds 250 KB');
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (c === '\n' && !quoted) { row.push(cell.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  row.push(cell.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row);
  if (rows.length > 501) throw new Error('Import at most 500 invoices');
  return rows;
}
const amount = z.string().min(1).transform(v => Number(v)).pipe(z.number().finite().nonnegative());
const rowSchema = z.object({ invoice_id: z.string().min(1).max(80), legal_id: z.string().min(1).max(80), service_id: z.string().max(100), description: z.string().min(1).max(500), amount, currency: z.string().regex(/^[A-Z]{3}$/), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), 'Calendar date does not exist') });
export const invoiceHeaders = 'invoice_id,legal_id,service_id,description,amount,currency,date';
export function importInvoices(csv: string, companies: Company[], services: Service[], importHash: string, synthetic: boolean): Invoice[] {
  const [headers, ...rows] = parseCsv(csv.replace(/^﻿/, ''));
  if (!headers || headers.join(',') !== invoiceHeaders) throw new Error(`Expected headers: ${invoiceHeaders}`);
  const seen = new Set<string>();
  return rows.map((r, index) => {
    if (r.length !== headers.length) throw new Error(`Row ${index + 2}: wrong column count`);
    const parsed = rowSchema.safeParse(Object.fromEntries(headers.map((h, i) => [h, r[i].trim()])));
    if (!parsed.success) throw new Error(`Row ${index + 2}: ${parsed.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join('; ')}`);
    const v = parsed.data;
    if (seen.has(v.invoice_id)) throw new Error(`Duplicate invoice ID: ${v.invoice_id}`); seen.add(v.invoice_id);
    // Only a confirmed identity may be associated with accounting data; ambiguous companies never merge.
    const matches = companies.filter(c => c.identity === 'confirmed' && c.legalId === v.legal_id);
    if (v.service_id && !services.some(s => s.id === v.service_id)) throw new Error(`Unknown service ID at row ${index + 2}`);
    return { invoiceId: v.invoice_id, legalId: v.legal_id, companyId: matches.length === 1 ? matches[0].id : null, serviceId: v.service_id || null, description: v.description, amount: v.amount, currency: v.currency, date: v.date, importedAt: new Date().toISOString(), importHash, synthetic };
  });
}
