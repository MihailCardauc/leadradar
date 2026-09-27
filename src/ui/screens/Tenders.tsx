'use client';
import { useState } from 'react';
import type { Tender } from '../../domain/model';
import { useApp } from '../store';
import { Badge, Icon, Overlay, Search, Stat, useRevealOnChange } from '../components';
import { fmtDate, fmtMoney, initials, tenderView } from '../derive';

const NEXT: Record<string, 'met' | 'not_met' | 'unknown'> = { unknown: 'met', met: 'not_met', not_met: 'unknown' };

export function Tenders() {
  const { view, isAdmin } = useApp();
  const w = view.state; const all = w.tenders ?? [];
  const [q, setQ] = useState(''); const [sel, setSel] = useState<string | null>(null); const [importing, setImporting] = useState(false);
  const active = all.filter(t => t.status === 'active');
  const rows = all.filter(t => `${t.title} ${t.authority} ${t.cpv.join(' ')} ${t.procedureId}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || (tenderView(b).priority ?? 0) - (tenderView(a).priority ?? 0));
  const selected = all.find(t => t.id === sel);
  return <section className="screen" aria-labelledby="t-h">
    <div className="head"><div><h1 id="t-h">Tenders</h1><div className="muted" style={{ marginTop: 8 }}>SEAP/SICAP · MTender · TED — triaged against the configured services. Status beats score; nothing is ever submitted.</div></div>
      <div className="row"><Search value={q} onChange={setQ} placeholder="Search authority, CPV or procedure" />{isAdmin && <button className="btn attention" onClick={() => setImporting(true)}>Import notice</button>}</div></div>
    <div className="card" style={{ marginBottom: 'var(--s8)' }}><div className="row">
      <Stat label="Open tenders" value={active.length} />
      <Stat label="Bids due ≤ 15 days" value={active.filter(t => tenderView(t).urgent).length} tone="attention" />
      <Stat label="Go / No-Go pending" value={active.filter(t => t.relevantServiceIds.length && !t.goDecision).length} />
      <Stat label="Archived as irrelevant" value={all.filter(t => t.triage && !t.triage.relevant).length} sub={`${all.filter(t => t.status === 'expired').length} expired`} />
    </div></div>
    <div className={`sheet-wrap ${selected ? 'open' : ''}`}>
      <div className="panel"><div className="head" style={{ marginBottom: 'var(--s4)' }}><h2 style={{ fontWeight: 400 }}>Tender intelligence</h2><span className="small" style={{ color: 'var(--ink-inverse-muted)' }}>Presales priority T 0–100 · provisional while requirements are unknown</span></div>
        <div className="list">{rows.length ? rows.map(t => { const v = tenderView(t); return <button key={t.id} className="lrow" aria-current={(sel === t.id) || undefined} onClick={() => setSel(t.id)}>
          <span className="avatar sm">{initials(t.authority || t.title)}</span>
          <span><div className="t">{t.title}</div><div className="m">{t.authority || 'authority unknown'} · CPV {t.cpv.join(', ') || '—'} · {fmtMoney(t.estimatedValue, t.currency)}</div></span>
          <span className="st" style={v.urgent ? { color: 'var(--orange-ink)' } : undefined}>{t.status !== 'active' ? t.status : v.due !== null ? `Bids due in ${v.due} days` : 'deadline unknown'}{!t.relevantServiceIds.length ? ' · not relevant' : ''}</span>
          <span className="amt tnum">{v.priority ?? '—'}</span>
        </button>; }) : <div className="small" style={{ color: 'var(--ink-inverse-muted)' }}>No tender matches.</div>}</div></div>
      {selected && <TenderSheet t={selected} onClose={() => setSel(null)} />}
    </div>
    {importing && <ImportNotice onClose={() => setImporting(false)} onImported={id => { setImporting(false); setSel(id); }} />}
  </section>;
}

function TenderSheet({ t, onClose }: { t: Tender; onClose: () => void }) {
  const { view, isAdmin, run, call, busy } = useApp();
  const [decide, setDecide] = useState<'bid' | 'no_bid' | null>(null); const [reason, setReason] = useState('');
  const v = tenderView(t); const w = view.state;
  const services = t.relevantServiceIds.map(id => w.services.find(s => s.id === id)?.name ?? id);
  const authority = w.companies.find(c => c.id === t.authorityCompanyId);
  const sheet = useRevealOnChange<HTMLElement>(t.id);
  const toggle = (lotId: string, idx: number) => run('tender-update', { id: t.id, lots: t.lots.map(l => l.id !== lotId ? l : { ...l, requirements: l.requirements.map((r, i) => i === idx ? { ...r, status: NEXT[r.status] } : r) }) }, 'Requirement updated · T recalculated');
  return <aside ref={sheet} className="sheet" aria-live="polite" aria-label={`${t.title} tender card`}>
    <div className="head" style={{ marginBottom: 'var(--s3)' }}><div><div className="label">Tender intelligence card · {t.source.toUpperCase()} {t.procedureId}{t.synthetic ? ' · synthetic example' : ''}</div><h2 style={{ fontSize: 24, lineHeight: '30px', fontWeight: 400 }}>{t.title}</h2><div className="small muted">{t.authority || 'authority unknown'} · CPV {t.cpv.join(', ') || '—'} · {fmtMoney(t.estimatedValue, t.currency)}</div></div><button className="ibtn filled" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>
    <div className="row" style={{ marginBottom: 'var(--s5)' }}>
      <Stat label="Why now" value={t.status === 'active' && v.due !== null ? v.due : t.status} unit={t.status === 'active' && v.due !== null ? 'days to bid' : undefined} tone={v.urgent ? 'attention' : undefined} sub={`deadline ${fmtDate(t.deadline)} · ${t.timezone}`} />
      <Stat label="Presales priority T" value={v.priority ?? '—'} unit="/ 100" corner={v.provisional ? <Badge tone="orange">Provisional</Badge> : undefined} sub={t.T ? `0.5·fit ${Math.round(t.T.fit)} + 0.3·attr ${t.T.attractiveness} + 0.2·feas ${t.T.feasibility}` : 'not computed'} />
    </div>
    <div className="small muted" style={{ marginBottom: 'var(--s4)' }}>Relevant to: {services.length ? services.join(', ') : 'no configured service'} · triage {t.triage?.model ?? 'pending'}{t.triage ? ` — ${t.triage.reason}` : ''}. T is never compared with company priority P.</div>
    <div className="label" style={{ marginBottom: 'var(--s2)' }}>Requirements ({v.met}/{v.total} met · {v.unknown} unknown){isAdmin ? ' — click a status to change it' : ''}</div>
    <div style={{ marginBottom: 'var(--s5)' }}>{t.lots.length === 0 ? <p className="small muted">No lots extracted yet.</p> : t.lots.map(l => <div key={l.id}><div className="small" style={{ fontWeight: 500, margin: '8px 0 4px' }}>{l.name}</div>{l.requirements.map((r, i) => <div className="req" key={i}><span>{r.text}</span><button className={`badge status-${r.status}`} style={{ border: 0, cursor: isAdmin ? 'pointer' : 'default' }} disabled={!isAdmin || busy} onClick={() => toggle(l.id, i)}>{r.status.replace('_', ' ')}</button></div>)}</div>)}</div>
    <div className="label" style={{ marginBottom: 'var(--s3)' }}>Beneficiary context</div>
    <div className="evgrid" style={{ marginBottom: 'var(--s5)' }}>
      {authority && <div className="ev"><div className="small">Authority linked to confirmed company {authority.name}</div><div className="meta"><Badge tone="lime">Fact</Badge></div></div>}
      {(t.context ?? []).map((x, i) => <div className="ev" key={i}><div className="small">{x}</div><div className="meta"><Badge tone={t.synthetic ? 'outline' : 'lime'}>{t.synthetic ? 'Synthetic' : 'Fact'}</Badge></div></div>)}
      {!authority && !(t.context ?? []).length && <p className="small muted">No beneficiary context yet.</p>}
    </div>
    {t.historicalWinners.length > 0 && <><div className="label" style={{ marginBottom: 'var(--s2)' }}>Historical winners of this authority</div><div className="row" style={{ gap: 'var(--s2)', marginBottom: 'var(--s5)' }}>{t.historicalWinners.map(x => <span key={x} className="chip quiet" style={{ height: 32, fontSize: 13 }}>{x}</span>)}</div></>}
    <div className="card" style={{ background: 'var(--surface-200)', boxShadow: 'none', padding: 'var(--s4)', marginBottom: 'var(--s4)' }}>
      <h3 style={{ marginBottom: 8 }}>Presales account brief</h3>
      <div className="small"><strong>Critical requirements:</strong> {t.lots.flatMap(l => l.requirements).slice(0, 3).map(r => r.text).join('; ') || 'to extract'}.<br />
        <strong>Historical competitors:</strong> {t.historicalWinners.join(', ') || 'unknown'}.<br />
        <strong>Supplier strengths (public proof points only):</strong> {(w.supplier?.proofPoints ?? []).slice(0, 3).join(' · ') || 'none recorded'}.</div>
    </div>
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      {t.goDecision ? <Badge tone={t.goDecision.decision === 'bid' ? 'lime' : 'orange'}>{t.goDecision.decision === 'bid' ? 'Bid' : 'No-Bid'} · {t.goDecision.reason} · logged {fmtDate(t.goDecision.at)}</Badge>
        : !isAdmin ? <span className="small muted">An administrator records GO / NO-GO.</span>
        : decide ? <div className="inline-form" style={{ flex: '1 1 100%' }}>
          <label className="field"><span>{decide === 'bid' ? 'Why bid' : 'Why not'} (required)</span><input className="text" value={reason} onChange={e => setReason(e.target.value)} /></label>
          <div className="row" style={{ gap: 'var(--s2)' }}><button className="btn sm primary" disabled={busy || reason.trim().length < 3} onClick={async () => { if (await run('tender-decision', { id: t.id, decision: decide, reason }, decide === 'bid' ? 'Bid logged · account brief handed to Presales' : 'No-Bid logged')) setDecide(null); }}>Confirm</button><button className="btn sm" onClick={() => setDecide(null)}>Cancel</button></div>
        </div>
        : <>{view.mode === 'live' && <button className="btn" disabled={busy} onClick={() => call('/api/tender', { action: 'triage', id: t.id }, 'Triage requested')}>Re-triage</button>}
          <button className="btn inverse" onClick={() => setDecide('no_bid')}>No-Bid</button><button className="btn primary" disabled={t.status !== 'active'} title={t.status !== 'active' ? 'Only active procedures (or a verified official extension)' : undefined} onClick={() => setDecide('bid')}>Bid</button></>}
    </div>
    <div className="disc" style={{ marginTop: 'var(--s4)' }}>The flow never submits a bid and never bypasses the official channel. Expired tenders are excluded unless an official extension is verified.</div>
  </aside>;
}

function ImportNotice({ onClose, onImported }: { onClose: () => void; onImported: (id: string) => void }) {
  const { call, busy } = useApp();
  const [text, setText] = useState(''); const [source, setSource] = useState('email'); const [url, setUrl] = useState(''); const [authority, setAuthority] = useState('');
  return <Overlay title="Import a procurement notice" onClose={onClose}>
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>Paste the notice text (email alert, PDF text, SEAP/MTender/TED page). CPV codes, deadline, value and procedure ID are parsed deterministically; the text is treated as untrusted data.</p>
      <div className="row"><label className="field" style={{ flex: '1 1 160px' }}><span>Source</span><select className="text" value={source} onChange={e => setSource(e.target.value)}>{['email', 'seap', 'mtender', 'ted', 'manual'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label>
        <label className="field" style={{ flex: '2 1 240px' }}><span>Contracting authority (optional)</span><input className="text" value={authority} onChange={e => setAuthority(e.target.value)} /></label></div>
      <label className="field"><span>Source URL (optional)</span><input className="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://e-licitatie.ro/…" /></label>
      <label className="field"><span>Notice text</span><textarea className="text" value={text} onChange={e => setText(e.target.value)} placeholder="Anunț de participare … CPV 72222300-0 … Termen limită de depunere 15.10.2026 …" /></label>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={busy || text.trim().length < 20} onClick={async () => { const r = await call<{ result: Tender }>('/api/tender', { payload: { text, source, ...(url ? { sourceUrl: url } : {}), ...(authority ? { authority } : {}) } }, 'Notice imported and triaged'); if (r) onImported(r.result.id); }}>Import</button></div>
    </div>
  </Overlay>;
}
