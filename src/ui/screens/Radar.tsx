'use client';
import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { Badge, CountUp, ErrorBand, Stat, Tabs } from '../components';
import { bandBadge, companyLine, decisionQueue, initials, kindOf, metrics, qualified, round, sourceBars, statusLabel, tenderView } from '../derive';
import { CompanySheet } from './CompanySheet';
import { ImportSheet } from './ImportSheet';

type Filter = 'all' | 'new' | 'upsell' | 'tender';

export function Radar() {
  const { view, serviceId, isAdmin, run, refresh, toast, busy, selectedCompany, openCompany, go } = useApp();
  const w = view.state; const rows = view.priorities; const service = w.services.find(s => s.id === serviceId);
  const [filter, setFilter] = useState<Filter>('all');
  const [importing, setImporting] = useState(false);
  const m = useMemo(() => metrics(w, rows), [w, rows]);
  const queue = decisionQueue(rows);
  const tenders = (w.tenders ?? []).filter(t => t.status === 'active' && t.relevantServiceIds.includes(serviceId));
  const urgent = tenders.filter(t => tenderView(t).urgent).length;
  const bars = sourceBars(w.sources ?? []);
  const failing = bars.filter(b => b.tone === 'stale');
  const list = rows.filter(r => filter === 'all' || kindOf(r) === filter);
  const byId = new Map(w.companies.map(c => [c.id, c]));

  return <section className="screen" aria-labelledby="radar-h">
    <div className="head">
      <div><h1 id="radar-h">Radar</h1><div className="muted" style={{ marginTop: 8, maxWidth: '64ch' }}>Public signals scored for <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{w.supplier?.name ?? 'your offer'} · {service?.name}</strong>. Read the pipeline left to right, then decide on the companies in the queue.</div></div>
      <div className="row">{isAdmin && <button className="btn" onClick={() => setImporting(true)}>Import companies</button>}
        <button className="btn primary" disabled={busy} onClick={() => isAdmin ? run('recalculate', undefined, 'Radar recalculated · recency decay, momentum and case expiry refreshed') : refresh().then(() => toast('Radar refreshed'))}>{busy ? 'Running…' : 'Run radar'}</button></div>
    </div>

    <div className="pipe card" aria-label="Pipeline">
      <PStep n={m.itemsRead} label="Public sources read" sub="pages · notices · reports" />
      <Arrow /><PStep n={m.evidenceExtracted} label="Evidence extracted" sub="claim + quote + source + date" />
      <Arrow /><PStep n={m.companiesScored} label="Companies scored" sub={`white-box formula · ${service ? `${service.id} v${service.version}` : ''}`} tone="g" />
      <Arrow /><div className="pstep hot" role="button" tabIndex={0} onClick={() => queue[0] && openCompany(queue[0].companyId)} onKeyDown={e => { if (e.key === 'Enter' && queue[0]) openCompany(queue[0].companyId); }}><div className="pn o"><b><CountUp to={queue.length} /></b></div><div className="pl">Need your decision</div><div className="ps">approve, edit or reject</div></div>
      <Arrow /><PStep n={m.inCrm} label={view.mode === 'demo' ? 'Delivered (demo)' : 'In HubSpot'} sub="one record each, evidence attached" />
    </div>

    <div className="grid2">
      <div className="card">
        <div className="head" style={{ marginBottom: 'var(--s4)' }}><h2><span className="num">1</span>What the radar found</h2><Badge tone="outline">{view.mode === 'demo' ? 'Demo data' : 'Live'}</Badge></div>
        <div className="row">
          <Stat label="Qualified leads" value={qualified(rows).length} tone="positive" sub={`${rows.filter(r => r.band === 'hot').length} hot · ${rows.filter(r => r.band === 'warm').length} warm`} />
          <Stat label="Tenders open" value={tenders.length} tone="orange" sub={`${urgent} bid(s) due ≤ 15 days`} />
          <Stat label="Time saved" value={m.timeSavedHours} unit="h" corner={<Badge tone="orange">Hypothesis</Badge>} sub={`${m.reviewedCompanies} reviewed × 17 min`} />
          <Stat label="Evidence verified" value={`${m.evidenceVerified} / ${m.evidenceExtracted}`} sub={view.summary.evidenceToReview ? `${view.summary.evidenceToReview} waiting for review` : 'all reviewed'} />
        </div>
        <div className="label" style={{ margin: 'var(--s6) 0 var(--s3)' }}>Source coverage</div>
        <div className="row">{bars.map(b => <div key={b.id} className={`prog ${b.tone === 'stale' ? 'stale' : ''}`}><div className="label">{b.name} · {b.note}</div><div className="track"><div className={`fill ${b.tone === 'o' ? 'o' : ''}`} style={{ width: `${b.value}%` }} /></div></div>)}</div>
        {failing.length > 0 && <div style={{ marginTop: 'var(--s4)' }}><ErrorBand>{failing.map(f => `${f.name}: ${f.note}`).join(' · ')}. Signals from these sources may be stale until the next successful run.</ErrorBand></div>}
      </div>
      <div className="card">
        <div className="head" style={{ marginBottom: 'var(--s4)' }}><h2><span className="num o">2</span>Your decision</h2><Badge tone="orange">{queue.length} waiting</Badge></div>
        <p className="small muted" style={{ margin: '0 0 var(--s3)' }}>Open a company, check the evidence, approve the draft or reject with a reason.</p>
        <div className="stack">
          {queue.slice(0, 3).map(r => <button key={r.companyId} className="ev hover-lift" style={{ textAlign: 'left', border: 0, cursor: 'pointer', color: 'inherit' }} onClick={() => openCompany(r.companyId)}>
            <div className="row" style={{ justifyContent: 'space-between' }}><h3>{r.company}</h3><span className={`badge ${bandBadge(r.band)}`}>{round(r.P)}</span></div>
            <div className="small muted">{r.mainReason}</div>
            <div className="small"><span className="badge orange" style={{ marginRight: 6 }}>Why now</span>{r.stageReason}{r.window ? ` · window ${r.window.minDays}–${r.window.maxDays} d (uncalibrated)` : ''}</div>
          </button>)}
          {queue.length === 0 && <p className="small muted">Nothing waits for a decision. Qualified accounts appear here as evidence arrives.</p>}
        </div>
        <button className="btn primary" style={{ marginTop: 'var(--s5)', width: '100%' }} disabled={!queue.length} onClick={() => queue[0] && openCompany(queue[0].companyId)}>Review queue</button>
      </div>
    </div>

    <div className="notch">
      <Tabs dark label="Filter scored companies" value={filter} onChange={setFilter} items={[['all', 'All'], ['new', 'New business'], ['upsell', 'Upsell'], ['tender', 'Tender']]} />
      <div className={`sheet-wrap ${selectedCompany ? 'open' : ''}`}>
        <div className="panel">
          <div className="head" style={{ marginBottom: 'var(--s4)' }}><h2 style={{ fontWeight: 400 }}><span className="num">3</span>Scored companies</h2><span className="small" style={{ color: 'var(--ink-inverse-muted)' }}>Click a row to see why it scored that way · priority, not purchase probability</span></div>
          <div className="list">
            {list.length ? list.map(r => { const c = byId.get(r.companyId)!; return <button key={r.companyId} className="lrow" aria-current={(selectedCompany === r.companyId) || undefined} onClick={() => openCompany(r.companyId)}>
              <span className="avatar sm">{initials(r.company)}</span>
              <span><div className="t">{r.company}{r.researchInProgress && <span className="spin" style={{ marginLeft: 8 }} aria-label="research in progress" />}</div><div className="m">{companyLine(c)}{r.stale ? ' · stale' : ''}{r.gates.length ? ` · gate: ${r.gates[0].code.replace('_', ' ')}` : ''}</div></span>
              <span className="st">{statusLabel(r)}</span><span className="amt tnum">{round(r.P)}</span>
            </button>; })
              : <div className="small" style={{ color: 'var(--ink-inverse-muted)', padding: 'var(--s4) 0' }}>{filter === 'tender' ? <>No account routes to a tender for this service. Tender dossiers live on the <button className="linkish" onClick={() => go('tenders')}>Tenders</button> screen.</> : 'No company in this group.'}</div>}
          </div>
        </div>
        {selectedCompany && <CompanySheet companyId={selectedCompany} onClose={() => openCompany(null)} />}
      </div>
    </div>
    {importing && <ImportSheet onClose={() => setImporting(false)} />}
  </section>;
}

const Arrow = () => <div className="parrow" aria-hidden="true">→</div>;
function PStep({ n, label, sub, tone }: { n: number; label: string; sub: string; tone?: 'g' | 'o' }) {
  return <div className="pstep"><div className={`pn ${tone ?? ''}`}><b><CountUp to={n} /></b></div><div className="pl">{label}</div><div className="ps">{sub}</div></div>;
}
