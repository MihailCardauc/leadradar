import { createHash } from 'node:crypto';
import type { Company, Evidence, Question, Service } from './model';
import { normalizeDomain, normalizeName } from './identity';

/**
 * Deterministic candidate extractor (no language model). Used for live research when no LLM is configured.
 * It proposes, per question, the single best sentence of a scraped page as a *candidate* quote:
 *   - the quote is an exact substring of the stored page text,
 *   - negated, vendor-side or unnamed-company sentences are skipped (unknown stays unknown),
 *   - dates are taken only when written explicitly next to the sentence,
 *   - every candidate arrives with status `review`: a human validates it before it can score.
 * Nothing here decides intent; it narrows a page down to sentences worth a reviewer's minute.
 */
export const RULES_EXTRACTION_VERSION = 'rules-extractor-v1';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

const STOP = new Set(('the a an and or of for to in on at by with from is are was were be been has have had does do did its it this that these those as into over under than then there their our your any which what who whom whose will would should could may might can company companies organisation organization announced announce publicly reported recent recently itself last months month year years new such same other about more most such own '
  + 'este sunt care pentru prin din sau și si cu la de pe al ale ai unei unui într intr este fost').split(/\s+/));

/** Bilingual (EN/RO) cue words per signal category; stems match by prefix. */
export const CATEGORY_CUES: Record<Question['category'], string[]> = {
  strategic: ['strateg', 'programme', 'program', 'efficien', 'eficien', 'transform', 'digitali', 'moderni', 'invest', 'roadmap', 'plan', 'cost reduc', 'reducere'],
  financial: ['budget', 'buget', 'revenue', 'results', 'rezultat', 'profit', 'invest', 'capex', 'cifra de afaceri'],
  hiring: ['hiring', 'recruit', 'career', 'vacan', 'angajăm', 'angajam', 'recrut', 'cariere', 'we are looking for', 'join our team', 'apply now', 'căutăm', 'cautam', 'open position', 'job opening'],
  procurement: ['tender', 'licitat', 'rfq', 'rfp', 'request for proposal', 'procurement', 'achizi', 'seap', 'sicap', 'contract', 'anunț de participare', 'anunt de participare'],
  technology: ['platform', 'automat', 'ai ', 'artificial intelligence', 'inteligen', 'cloud', 'rpa', 'agentic', 'process mining', 'software', 'system', 'sistem', 'migrat'],
  risk_compliance: ['nis2', 'nis 2', 'dora', 'iso 27001', 'complian', 'conformitate', 'audit', 'security', 'securitate', 'cyber', 'cibernetic', 'incident', 'gdpr', 'risc', 'risk'],
  organisational: ['shared service', 'consolid', 'centrali', 'reorgani', 'expansion', 'extindere', 'new site', 'deschide', 'opening', 'merger', 'fuziune', 'acquisition', 'achiziți'],
  leadership: ['appointed', 'appoints', 'joins', 'named', 'numit', 'numire', 'new cio', 'new ciso', 'new coo', 'chief', 'director', 'head of'],
  relational: ['partner', 'parteneriat', 'customer', 'client'],
  other: [],
};
const NEGATION = /\b(no plans?|not (?:planning|currently|yet)|does not|do not|did not|won't|will not|without|never|nu (?:are|avem|intenționează|intentioneaza|planifică|planifica)|fără|fara|niciun|nicio)\b/i;
const VENDOR = /\b(we offer|our (?:services|solutions|products|clients|customers)|oferim|serviciile noastre|soluțiile noastre|solutiile noastre|clienții noștri|clientii nostri|contact us|request a (?:demo|quote)|solicită o ofertă)\b/i;
const PLAN = /\b(will|plans?|planned|aims?|intends?|by 20\d\d|target(?:s|ing)?|urmează|urmeaza|va |vor |planific|își propune|isi propune|până în 20\d\d|pana in 20\d\d)\b/i;
const ACRONYM = /\b[A-Z][A-Z0-9]{1,6}\b/g;
/** Sentences that contradict a category even when its words appear (job cuts are not hiring). */
const CATEGORY_BLOCK: Partial<Record<Question['category'], RegExp>> = {
  hiring: /\b(reduc\w*|cut(?:s|ting)?|layoffs?|redundanc\w*|concedi\w*|disponibiliz\w*|job losses)\b/i,
};

const MONTHS: Record<string, number> = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  ianuarie: 1, februarie: 2, martie: 3, aprilie: 4, mai: 5, iunie: 6, iulie: 7, septembrie: 9, octombrie: 10, noiembrie: 11, decembrie: 12 };

/**
 * Romanian stems for English question stems (7-char prefixes after diacritic folding), so Romanian pages match the
 * same questions. Generic vocabulary only; never tuned to a specific page.
 */
export const RO_STEMS: Record<string, string[]> = {
  tender: ['licitat', 'achizit', 'procedur', 'caiet de sarcini'], procure: ['achizit', 'licitat'], investm: ['investit', 'invest'], invest: ['investit'],
  budget: ['buget'], announc: ['anunt'], complia: ['conformi'], program: ['program'], efficie: ['eficien'], reducti: ['reduce', 'reducer'],
  hiring: ['angaj', 'recrut'], recruit: ['recrut'], appoint: ['numit', 'numire'], consoli: ['consolid'], centre: ['centru'], center: ['centru'],
  intelli: ['intelig'], artific: ['artific'], infrast: ['infrastr'], moderni: ['moderniz'], transfo: ['transfor'], digital: ['digitaliz'],
  migrati: ['migrar'], securit: ['securit'], cyberse: ['cibernet'], incident: ['incident', 'atac'], attack: ['atac'], reporte: ['raportat'],
  mainten: ['mentenan'], applica: ['aplicat'], platfor: ['platform'], operati: ['operati', 'operatiun'], certifi: ['certific'],
  commit: ['angajament'], contrac: ['contract'], service: ['servici'], opening: ['deschid'], sites: ['sedii', 'puncte de lucru'], growin: ['crestere'],
};
/** Acronyms often written out in full. */
export const ACRONYM_EXPANSIONS: Record<string, string[]> = {
  soc: ['security operations', 'centru de operatiuni de securitate'], ciso: ['chief information security'], cio: ['chief information officer', 'director it'],
  coo: ['chief operating officer', 'director operational'], rpa: ['robotic process'], ai: ['artificial intelligence', 'inteligenta artificiala'],
  erp: ['sap ', 'enterprise resource'], isms: ['information security management'], grc: ['governance, risk', 'guvernanta'], rfq: ['request for quotation', 'cerere de oferta'],
  it: ['tehnologia informatiei'],
};

export function keywordsFor(q: Question): { terms: string[]; acronyms: string[] } {
  const source = [q.text, ...q.positiveExamples, q.sourceHint].join(' ');
  const acronyms = [...new Set((source.match(ACRONYM) ?? []).map(a => a.toLowerCase()))];
  const base = [...new Set(source.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 5 && !STOP.has(w)).map(w => w.slice(0, 7)))];
  const translated = base.flatMap(t => RO_STEMS[t] ?? Object.entries(RO_STEMS).filter(([k]) => t.startsWith(k)).flatMap(([, v]) => v));
  return { terms: [...new Set([...base, ...translated])], acronyms };
}
const acronymHit = (a: string, s: string, folded: string) => new RegExp(`\\b${a}\\b`, 'i').test(s) || (ACRONYM_EXPANSIONS[a] ?? []).some(x => folded.includes(x));

/** Sentences as exact substrings of `text` (never rewritten), with their offset. Markdown links/images are skipped. */
export function sentences(text: string): { s: string; at: number }[] {
  const out: { s: string; at: number }[] = [];
  const re = /[^\n.!?]+(?:[.!?](?=\s|$)|(?=\n)|$)/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0]; const lead = raw.length - raw.trimStart().length; const s = raw.trim().replace(/^[#>*\-\s|]+/, '');
    const offset = (m.index ?? 0) + lead + (raw.trim().length - s.length);
    if (s.length < 40 || s.length > 450 || s.includes('](') || s.includes('![') || (s.match(/\|/g)?.length ?? 0) > 2) continue;
    if (text.slice(offset, offset + s.length) !== s) continue;
    out.push({ s, at: offset });
  }
  return out;
}

/** Explicit calendar dates in a window of text: ISO, dd.mm.yyyy, "12 March 2026", "12 martie 2026". Month-only dates are ignored. */
export function explicitDate(window: string, at: string): string | null {
  const now = Date.parse(at); const found: string[] = [];
  const push = (y: number, m: number, d: number) => { const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const t = Date.parse(`${iso}T00:00:00Z`); if (Number.isFinite(t) && new Date(t).toISOString().startsWith(iso) && t <= now && y >= 2000) found.push(iso); };
  for (const m of window.matchAll(/\b(20\d\d)-(\d{2})-(\d{2})\b/g)) push(+m[1], +m[2], +m[3]);
  for (const m of window.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](20\d\d)\b/g)) push(+m[3], +m[2], +m[1]);
  for (const m of window.toLowerCase().matchAll(/\b(\d{1,2})\s+([a-zăâîșţț]+)\s+(20\d\d)\b/g)) { const mo = MONTHS[m[2].normalize('NFD').replace(/[̀-ͯ]/g, '')]; if (mo) push(+m[3], mo, +m[1]); }
  for (const m of window.toLowerCase().matchAll(/\b([a-z]+)\s+(\d{1,2}),\s+(20\d\d)\b/g)) { const mo = MONTHS[m[1]]; if (mo) push(+m[3], mo, +m[2]); }
  return found.sort().at(-1) ?? null;
}

export function sourceTypeFor(url: string, companyDomain: string): NonNullable<Evidence['sourceType']> {
  const u = url.toLowerCase(); const own = normalizeDomain(new URL(url).hostname).endsWith(normalizeDomain(companyDomain));
  if (/e-licitatie|sicap|seap|ted\.europa|mtender/.test(u)) return 'procurement';
  if (/ejobs|bestjobs|hipo\.ro|rabota|joblist|jobs?\./.test(u)) return 'job_board';
  if (/career|cariere|jobs|job-|vacanc/.test(u)) return own ? 'career_page' : 'job_board';
  if (/annual-report|raport-anual|investor|investitori|\.pdf$/.test(u)) return 'report';
  if (/news|press|media|comunicat|newsroom|stiri|noutati/.test(u)) return own ? 'newsroom' : 'news';
  return own ? 'newsroom' : 'news';
}

export function companyNamed(company: Company, text: string, url: string) {
  const host = normalizeDomain(new URL(url).hostname);
  if (company.domain && host.endsWith(normalizeDomain(company.domain))) return true;
  const hay = normalizeName(text);
  return [company.name, ...company.aliases].map(normalizeName).filter(n => n.length >= 3).some(n => hay.includes(n));
}

const BASE_QUALITY: Record<string, number> = { procurement: 1, registry: 1, newsroom: 0.9, report: 0.9, career_page: 0.85, advisory: 0.85, news: 0.8, job_board: 0.75, other: 0.6 };

export type Candidate = { questionId: string; score: number; sentence: string };

/** Best candidate sentence per enabled question. Thresholds favour precision: a missed signal stays unknown. */
export function candidates(service: Service, text: string): Candidate[] {
  const sents = sentences(text);
  const out: Candidate[] = [];
  for (const q of service.questions.filter(q => q.enabled)) {
    const { terms, acronyms } = keywordsFor(q); const cues = CATEGORY_CUES[q.category] ?? [];
    let best: Candidate | null = null;
    for (const { s } of sents) {
      if (NEGATION.test(s) || (q.kind === 'positive' && VENDOR.test(s)) || CATEGORY_BLOCK[q.category]?.test(s)) continue;
      const lower = s.toLowerCase(), folded = lower.normalize('NFD').replace(/[̀-ͯ]/g, '');
      const termHits = terms.filter(t => folded.includes(t)).length;
      const acronymHits = acronyms.filter(a => acronymHit(a, s, folded)).length;
      const cueHits = cues.filter(c => lower.includes(c) || folded.includes(c)).length;
      const score = termHits + 2 * acronymHits + Math.min(cueHits, 3);
      // Penalties and exclusions lower or block a score, so they need stronger evidence than positive signals.
      const strict = q.kind !== 'positive';
      const passes = strict ? termHits + acronymHits >= 3 && cueHits >= 1 && score >= 6 : (termHits + acronymHits >= 2 && cueHits >= 1) || score >= 5;
      if (passes && (!best || score > best.score)) best = { questionId: q.id, score, sentence: s };
    }
    if (best) out.push(best);
  }
  return out;
}

/** Turns candidates into review-only evidence rows with verified quotes, explicit dates and a rubric quality. */
export function extractByRules(company: Company, service: Service, text: string, url: string, at: string): Evidence[] {
  if (!companyNamed(company, text, url)) return [];
  const textHash = sha(text); const sourceType = sourceTypeFor(url, company.domain); const host = new URL(url).hostname;
  // A date in the page header is a publication date, not the event date: recorded separately for the reviewer.
  const publishedAt = explicitDate(text.slice(0, 800), at);
  return candidates(service, text).map(c => {
    const q = service.questions.find(q => q.id === c.questionId)!;
    const pos = text.indexOf(c.sentence);
    const eventDate = explicitDate(text.slice(Math.max(0, pos - 200), pos + c.sentence.length + 200), at);
    const claimType = PLAN.test(c.sentence) ? 'plan' as const : 'fact' as const;
    const quality = Math.round(Math.max(0, (BASE_QUALITY[sourceType] ?? 0.6) - (eventDate ? 0 : 0.1) - 0.1) * 100) / 100; // −0.1: rules, not a reading model
    return {
      id: sha(`rules:${company.id}:${service.id}:${q.id}:${q.text}:${textHash}`).slice(0, 32), companyId: company.id, serviceId: service.id, questionId: q.id, questionText: q.text,
      answer: 'yes' as const, quote: c.sentence, text, url, title: host, eventDate, retrievedAt: at, hash: textHash,
      eventKey: sha(`${company.id}:${host}${new URL(url).pathname}:${eventDate ?? 'unknown'}:${q.group}`), quality, status: 'review' as const, synthetic: false,
      model: 'rules', extractionVersion: RULES_EXTRACTION_VERSION, ruleVersion: service.version,
      reason: `Keyword candidate (score ${c.score}); a reviewer must confirm the sentence answers the question for ${company.name}.`,
      publishedAt, publisher: host, sourceType, polarity: q.kind === 'positive' ? 'positive' as const : 'negative' as const, claimType, category: q.category,
      uncertainty: eventDate ? undefined : publishedAt ? `No explicit event date next to the sentence; page published ${publishedAt}. Confirm the event date on review or the unknown-date factor applies` : 'No explicit event date next to the sentence; unknown-date factor applies',
    };
  });
}
