'use client';
import { useMemo, useState, type ReactNode } from 'react';
import type { DecisionCase } from '../../domain/model';
import { useApp } from '../store';
import { Badge, ErrorBand, Icon, ReasonPicker, Stat, Tabs, useRevealOnChange } from '../components';
import { REJECT_REASONS, closedDecisionStates, decisionTypeLabel, fmtDate, initials, metrics, openDecisionStates, sentDecisionStates } from '../derive';

type Tab = 'draft' | 'sent' | 'rejected';
const bucket = (d: DecisionCase): Tab => openDecisionStates.includes(d.approvalStatus) ? 'draft' : sentDecisionStates.includes(d.approvalStatus) ? 'sent' : 'rejected';

/** Highlights evidence quotes that appear in the draft (plain React nodes; no HTML injection). */
function highlight(text: string, quotes: string[]): ReactNode[] {
  const qs = quotes.filter(q => q.length >= 8 && text.includes(q)).sort((a, b) => b.length - a.length);
  if (!qs.length) return [text];
  const out: ReactNode[] = []; let rest = text; let k = 0;
  while (rest) {
    const hit = qs.map(q => ({ q, i: rest.indexOf(q) })).filter(x => x.i >= 0).sort((a, b) => a.i - b.i)[0];
    if (!hit) { out.push(rest); break; }
    if (hit.i) out.push(rest.slice(0, hit.i));
    out.push(<mark key={k++}>{hit.q}</mark>); rest = rest.slice(hit.i + hit.q.length);
  }
  return out;
}

export function Actions() {
  const { view, selectedDecision, openDecision } = useApp();
  const w = view.state; const decisions = w.decisions ?? [];
  const [tab, setTab] = useState<Tab>(() => { const d = decisions.find(x => x.id === selectedDecision); return d ? bucket(d) : 'draft'; });
  const m = useMemo(() => metrics(w, view.priorities), [w, view.priorities]);
  const list = decisions.filter(d => bucket(d) === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = decisions.find(d => d.id === selectedDecision);
  const attention = view.summary.outboxAttention;
  const count = (t: Tab) => decisions.filter(d => bucket(d) === t).length;
  const name = (id: string) => w.companies.find(c => c.id === id)?.name ?? id;
  return <section className="screen" aria-labelledby="a-h">
    <div className="head"><div><h1 id="a-h">Actions</h1><div className="muted" style={{ marginTop: 8 }}>Drafts wait for a human. Nothing is sent from here: approval locks the exact content by hash, and the CRM task is the hand-off.</div></div></div>
    <div className="card" style={{ marginBottom: 'var(--s8)' }}><div className="row">
      <Stat label="Accepted" value={m.accepted} tone="positive" />
      <Stat label="Rejected" value={m.rejected} />
      <Stat label="Top rejection reason" value={<span style={{ fontSize: 20, lineHeight: '28px' }}>{m.topReason ?? '—'}</span>} />
    </div>{attention.length > 0 && <div style={{ marginTop: 'var(--s4)' }}><ErrorBand>{attention.length} CRM write(s) failed or have an uncertain result. Reconcile before any resend — a timeout may already have created the task.</ErrorBand></div>}</div>
    <div className="notch">
      <Tabs dark label="Decision cases" value={tab} onChange={t => { setTab(t); openDecision(null); }} items={[['draft', <>Drafts<span className="badge">{count('draft')}</span></>], ['sent', <>Sent<span className="badge">{count('sent')}</span></>], ['rejected', <>Rejected / expired<span className="badge">{count('rejected')}</span></>]]} />
      <div className={`sheet-wrap ${selected ? 'open' : ''}`}>
        <div className="panel"><div className="list">
          {list.length ? list.map(d => <button key={d.id} className="lrow" aria-current={(selectedDecision === d.id) || undefined} onClick={() => openDecision(d.id)}>
            <span className="avatar sm">{initials(name(d.companyId))}</span>
            <span><div className="t">{name(d.companyId)}</div><div className="m">{decisionTypeLabel[d.type]} · {w.services.find(s => s.id === d.serviceId)?.name ?? d.serviceId} · team {d.team}</div></span>
            <span className="st">{d.approvalStatus.replace('_', ' ')}</span><span className="amt" style={{ fontSize: 14 }}>{d.approvalStatus === 'delivered' ? '✓' : ''}</span>
          </button>) : <div className="small" style={{ color: 'var(--ink-inverse-muted)', padding: 'var(--s4) 0' }}>{tab === 'draft' ? 'No open case. Open a company on the Radar and choose “Review and approve”.' : 'Nothing here yet.'}</div>}
        </div></div>
        {selected && <DecisionSheet key={`${selected.id}:${selected.contentHash}:${selected.approvalStatus}`} d={selected} company={name(selected.companyId)} onClose={() => openDecision(null)} />}
      </div>
    </div>
  </section>;
}

type HsPreview = { previewHash: string; preview: { subject: string; body: string; companyName: string; writesEnabled: boolean; logical_action_key: string } };

function DecisionSheet({ d, company, onClose }: { d: DecisionCase; company: string; onClose: () => void }) {
  const { view, isAdmin, run, call, busy, toast } = useApp();
  const [mode, setMode] = useState<'idle' | 'edit' | 'reject'>('idle');
  const [text, setText] = useState(d.draft);
  const [hs, setHs] = useState<HsPreview | null>(null);
  const quotes = view.state.evidence.filter(e => d.evidenceIds.includes(e.id)).map(e => e.quote);
  const open = ['draft', 'review_required'].includes(d.approvalStatus);
  const outbox = (view.state.outbox ?? []).find(o => o.decisionId === d.id);
  const hubspot = view.mode === 'live' && view.integrations.hubspot?.startsWith('Configured');
  const sheet = useRevealOnChange<HTMLElement>(d.id);
  return <aside ref={sheet} className="sheet" aria-live="polite" aria-label={`Decision case for ${company}`}>
    <div className="head" style={{ marginBottom: 'var(--s3)' }}><div><div className="label">{decisionTypeLabel[d.type]} · team {d.team} · owner {d.owner}</div><h2 style={{ fontWeight: 400, fontSize: 24, lineHeight: '30px' }}>{company}</h2><div className="small muted">created {fmtDate(d.createdAt)} · due {fmtDate(d.dueAt)} · expires {fmtDate(d.expiresAt)} · {d.dataMode}</div></div>
      <div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="outline">{d.approvalStatus.replace('_', ' ')}</Badge><button className="ibtn filled" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div></div>
    {mode === 'edit' ? <div className="stack"><textarea className="edit" value={text} onChange={e => setText(e.target.value)} aria-label="Draft text" />
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => { setText(d.draft); setMode('idle'); }}>Cancel</button><button className="btn inverse" disabled={busy || text.trim().length < 10} onClick={async () => { if (await run('decision-edit', { id: d.id, draft: text }, 'Draft saved · new content hash; preview it before approving')) setMode('idle'); }}>Save draft</button></div></div>
      : <div className="draft" style={{ whiteSpace: 'pre-wrap' }}>{highlight(d.draft, quotes)}</div>}
    <div className="small muted" style={{ margin: 'var(--s3) 0 var(--s4)' }}>Highlighted phrases are verbatim evidence quotes. Drafts never assert intent, obligations or incidents. Content hash {d.contentHash.slice(0, 12)}.</div>
    {d.facts.length > 0 && <><div className="label" style={{ marginBottom: 'var(--s2)' }}>Facts</div><ul className="trace" style={{ marginBottom: 'var(--s4)' }}>{d.facts.map((f, i) => <li key={i}>{f}</li>)}</ul></>}
    <div className="label" style={{ marginBottom: 'var(--s2)' }}>Interpretation</div><p className="small" style={{ margin: '0 0 var(--s4)' }}>{d.interpretation}</p>
    {d.uncertainties.length > 0 && <><div className="label" style={{ marginBottom: 'var(--s2)' }}>Uncertainties</div><ul className="trace" style={{ marginBottom: 'var(--s4)' }}>{d.uncertainties.map((u, i) => <li key={i}>{u}</li>)}</ul></>}
    <dl className="kv" style={{ marginBottom: 'var(--s4)' }}><dt>Relationship</dt><dd>{d.relationship.status} · {d.relationship.provenance} · product ownership {d.relationship.productOwnership}</dd><dt>Reason</dt><dd>{d.reason}</dd>{d.approvedBy && <><dt>Approved</dt><dd>{d.approvedBy} · {fmtDate(d.approvedAt)}</dd></>}{outbox && <><dt>Outbox</dt><dd>{outbox.status} · attempts {outbox.attempts}{outbox.remoteId ? ` · ${outbox.remoteId}` : ''}</dd></>}</dl>
    <details style={{ marginBottom: 'var(--s4)' }}><summary className="small">Routing trace</summary><ol className="trace">{d.routingTrace.map((t, i) => <li key={i}>{t}</li>)}</ol></details>

    {hs && <div className="draft" style={{ marginBottom: 'var(--s4)' }}><div className="label" style={{ marginBottom: 8 }}>HubSpot preview · {hs.preview.companyName} · key {hs.preview.logical_action_key}</div><strong>{hs.preview.subject}</strong><div className="small" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{hs.preview.body}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--s3)' }}><button className="btn sm" onClick={() => setHs(null)}>Close preview</button>
        <button className="btn sm primary" disabled={busy || !hs.preview.writesEnabled} title={hs.preview.writesEnabled ? undefined : 'Test writes are disabled on the server'} onClick={async () => { const r = await call<{ status: string }>('/api/hubspot', { decisionId: d.id, confirm: true, previewHash: hs.previewHash }); if (r) { toast(`HubSpot: ${r.status}`); setHs(null); } }}>Commit to HubSpot</button></div></div>}

    <div className="row" style={{ justifyContent: 'flex-end' }}>
      {mode === 'reject' ? <ReasonPicker reasons={REJECT_REASONS} busy={busy} onBack={() => setMode('idle')} onPick={async r => { if (await run('decision-review', { id: d.id, decision: 'reject', reason: r }, 'Rejected · reason logged for recalibration')) setMode('idle'); }} />
        : open && mode === 'idle' ? <><button className="btn" onClick={() => setMode('reject')}>Reject</button><button className="btn inverse" onClick={() => setMode('edit')}>Edit</button>
          <button className="btn primary" disabled={busy} onClick={async () => { const ok = await run('decision-review', { id: d.id, decision: 'approve', reason: 'Approved after reviewing the evidence and draft', contentHash: d.contentHash }, 'Approved · content locked by hash'); if (ok && isAdmin) await run('decision-queue', { id: d.id }, view.mode === 'demo' ? 'Stored locally (demo) — no HubSpot request' : 'Queued in the CRM outbox'); }}>{isAdmin ? 'Approve and queue for CRM' : 'Approve'}</button></>
        : d.approvalStatus === 'approved' && isAdmin ? <button className="btn primary" disabled={busy} onClick={() => run('decision-queue', { id: d.id }, 'Queued for CRM')}>Queue for CRM</button>
        : null}
      {hubspot && isAdmin && ['queued', 'approved'].includes(d.approvalStatus) && !hs && <button className="btn" disabled={busy} onClick={async () => { const r = await call<HsPreview>('/api/hubspot', { decisionId: d.id }); if (r) setHs(r); }}>HubSpot preview</button>}
      {hubspot && isAdmin && d.approvalStatus === 'unknown_delivery' && <button className="btn attention" disabled={busy} onClick={() => call('/api/hubspot', { decisionId: d.id, reconcile: true }, 'Reconciled with HubSpot')}>Reconcile</button>}
      {closedDecisionStates.includes(d.approvalStatus) && <span className="small muted">Closed. Build a new case from the company card if the evidence changes.</span>}
    </div>
    <div className="disc" style={{ marginTop: 'var(--s4)' }}>{view.mode === 'demo' ? 'Demo: “queue” stores the CRM action locally; no request leaves LeadRadar.' : 'Live: writes happen only through the HubSpot preview → confirm flow with an idempotent logical key.'}</div>
  </aside>;
}
