'use client';
import { useState } from 'react';
import { useApp } from '../store';
import { Badge, Empty, Search } from '../components';
import { bandBadge, companyLine, initials, kindOf, round, statusLabel } from '../derive';
import { ImportSheet } from './ImportSheet';

type Chip = 'all' | 'new' | 'upsell' | 'high' | 'gated' | 'identity';
const CHIPS: [Chip, string][] = [['all', 'All'], ['new', 'New prospects'], ['upsell', 'Customers'], ['high', 'Score ≥ 70'], ['gated', 'Gated'], ['identity', 'Identity to verify']];

export function Companies() {
  const { view, isAdmin, openCompany } = useApp();
  const [q, setQ] = useState(''); const [chip, setChip] = useState<Chip>('all'); const [importing, setImporting] = useState(false);
  const byId = new Map(view.state.companies.map(c => [c.id, c]));
  const rows = view.priorities.filter(r => { const c = byId.get(r.companyId)!; return `${c.name} ${c.industry ?? ''} ${c.region ?? ''} ${c.country ?? ''} ${c.domain}`.toLowerCase().includes(q.toLowerCase()); })
    .filter(r => chip === 'all' || (chip === 'high' ? r.P >= 70 : chip === 'gated' ? r.gates.length > 0 : chip === 'identity' ? r.identity !== 'confirmed' : kindOf(r) === chip));
  return <section className="screen" aria-labelledby="co-h">
    <div className="head"><div><h1 id="co-h">Companies</h1><div className="muted" style={{ marginTop: 8 }}>Every company the radar has seen, with its current score for the selected service and its CRM state.</div></div>
      <div className="row"><Search value={q} onChange={setQ} placeholder="Search name, sector, county or domain" />{isAdmin && <button className="btn" onClick={() => setImporting(true)}>Import</button>}</div></div>
    <div className="row" style={{ gap: 'var(--s2)', marginBottom: 'var(--s6)' }}>{CHIPS.map(([k, l]) => <button key={k} className="chip" aria-pressed={chip === k} onClick={() => setChip(k)}>{l}</button>)}</div>
    <div className="card">
      {rows.length ? <div className="grid-co">{rows.map(r => { const c = byId.get(r.companyId)!; return <button key={r.companyId} className="co" onClick={() => openCompany(r.companyId)}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--s2)' }}><span className="avatar sm">{initials(c.name)}</span><span className={`badge ${r.gates.length ? 'orange' : bandBadge(r.band)}`} title="Priority, not purchase probability">{round(r.P)}</span></div>
        <h3>{c.name}</h3><div className="small muted">{companyLine(c)}</div>
        <div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="outline">{statusLabel(r)}</Badge>{c.relationship === 'customer' && <Badge tone="lime">Customer</Badge>}{r.gates.length > 0 && <Badge tone="orange">Gated</Badge>}{c.identity !== 'confirmed' && <Badge>Identity {c.identity}</Badge>}{c.dataMode !== 'live' && <Badge tone="outline">{c.dataMode === 'synthetic' ? 'Synthetic' : 'Reference'}</Badge>}</div>
      </button>; })}</div>
        : <Empty title="Don't find leads. Find reasons to call." action={isAdmin ? <button className="btn primary" onClick={() => setImporting(true)}>Import companies</button> : undefined}>No company matches. Import a list or widen the filter.</Empty>}
    </div>
    {importing && <ImportSheet onClose={() => setImporting(false)} />}
  </section>;
}
