import { z } from 'zod';
import { AppError } from './store';
import { isValidCui } from '../domain/identity';

/**
 * Legal-identity registry connector: ANAF public taxpayer registry (Romania, no authentication).
 * Used to *verify* a CUI an analyst proposes; a match is never confirmed from name similarity alone.
 * ANAF allows at most one request per second per client; this adapter sends a single CUI per call.
 * Moldova (IDNO) has no free registry API here: those identities are confirmed manually with a documented reason.
 */
const ANAF_URL = 'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva';

const anafResponse = z.object({
  cod: z.number().optional(), message: z.string().optional(),
  found: z.array(z.object({ date_generale: z.object({
    cui: z.union([z.number(), z.string()]), denumire: z.string().default(''), adresa: z.string().default(''), nrRegCom: z.string().default(''),
    stare_inregistrare: z.string().default(''), cod_CAEN: z.string().default(''), forma_juridica: z.string().default(''),
  }).passthrough() }).passthrough()).default([]),
  notFound: z.array(z.union([z.number(), z.string()])).default([]),
});

export type RegistryRecord = { found: true; cui: string; name: string; address: string; tradeRegister: string; status: string; caen: string; legalForm: string; checkedAt: string; source: 'anaf' } | { found: false; cui: string; checkedAt: string; source: 'anaf' };

let lastCall = 0;
async function politeDelay() {
  const wait = lastCall + 1100 - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
}

export async function lookupCui(input: string, fetcher: typeof fetch = fetch, now = new Date()): Promise<RegistryRecord> {
  if (!isValidCui(input)) throw new AppError(400, 'A Romanian CUI has 2-10 digits (optional RO prefix)');
  const cui = input.trim().replace(/^RO/i, '');
  const checkedAt = now.toISOString();
  await politeDelay();
  const response = await fetcher(ANAF_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([{ cui: Number(cui), data: checkedAt.slice(0, 10) }]), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new AppError(502, 'ANAF registry unavailable; confirm identity manually or retry later');
  const parsed = anafResponse.safeParse(await response.json());
  if (!parsed.success) throw new AppError(502, 'ANAF registry returned an unexpected response');
  const hit = parsed.data.found.find(f => String(f.date_generale.cui) === cui);
  if (!hit) return { found: false, cui, checkedAt, source: 'anaf' };
  const g = hit.date_generale;
  return { found: true, cui, name: g.denumire, address: g.adresa, tradeRegister: g.nrRegCom, status: g.stare_inregistrare, caen: g.cod_CAEN, legalForm: g.forma_juridica, checkedAt, source: 'anaf' };
}
