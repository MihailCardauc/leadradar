'use client';
import { useEffect, useMemo, useState } from 'react';
import type { CalibrationProposal } from '../../domain/calibration';
import { useApp } from '../store';
import { Badge, Stat } from '../components';
import { ASSISTED_MINUTES, MANUAL_MINUTES, metrics } from '../derive';

/** Jury-facing, read-only metrics computed from the workspace. Hypotheses are labelled; nothing is estimated silently. */
export function Metrics() {
  const { view, serviceId, isAdmin, query, go } = useApp();
  const m = useMemo(() => metrics(view.state, view.priorities), [view.state, view.priorities]);
  const [cal, setCal] = useState<CalibrationProposal | null>(null);
  useEffect(() => { if (!isAdmin) return; let live = true; query<CalibrationProposal>('calibration-propose', { serviceId }).then(r => { if (live) setCal(r); }); return () => { live = false; }; }, [serviceId, isAdmin, query, view.state.revision]);
  const changes = cal?.questions.filter(q => Math.abs(q.proposedWeight - q.currentWeight) >= 0.5) ?? [];
  return <section className="screen" aria-labelledby="m-h">
    <div className="head"><div><h1 id="m-h">Metrics</h1><div className="muted" style={{ marginTop: 8 }}>Visible to the jury. Read-only, computed from this workspace ({view.mode === 'demo' ? 'demo data' : 'live data'}).</div></div></div>
    <div className="card" style={{ marginBottom: 'var(--s8)' }}><div className="row">
      <Stat large label="Time saved" value={m.timeSavedHours} unit="h" corner={<Badge tone="orange">Hypothesis</Badge>} />
      <Stat large label="Evidence verified" value={`${m.evidenceVerified} / ${m.evidenceExtracted}`} />
      <Stat large label="Precision" value={m.precision ?? '—'} unit={m.precision === null ? undefined : '%'} tone="positive" sub="accepted ÷ (accepted + rejected)" />
      <Stat large label="Closed won" value={m.won} sub="from recorded outcomes" />
    </div><div className="disc" style={{ marginTop: 'var(--s5)' }}>Time saved is the team&apos;s hypothesis (≈{MANUAL_MINUTES} min manual → ≈{ASSISTED_MINUTES} min assisted per reviewed company, {m.reviewedCompanies} reviewed); it stays labelled until the four-week pilot measures it. Precision needs graded decisions: it shows “—” until the first accept or reject.</div></div>
    <div className="grid2">
      <div className="card"><h2 style={{ marginBottom: 'var(--s4)' }}>Funnel</h2><div className="funnel">
        {m.funnel.map(f => <div className="prog" key={f.label}><div className="label">{f.label}</div><div className="track"><div className="fill" style={{ width: `${Math.max(0, Math.min(100, f.pct))}%` }} /></div><div className="small muted">{f.note}</div></div>)}
      </div></div>
      <div className="card"><h2 style={{ marginBottom: 'var(--s4)' }}>Weight proposals awaiting review</h2>
        {!isAdmin ? <p className="small muted">Available to administrators.</p> : !cal ? <p className="small muted">Computing…</p> : cal.status === 'insufficient_data' ? <div className="ev"><div>Not enough graded decisions yet</div><q>{cal.explanation}</q><div className="meta"><Badge tone="outline">{cal.labelled} labelled</Badge><span>rules {cal.rulesVersion}</span></div></div>
          : <div className="stack">{changes.length ? changes.map(q => <div className="ev" key={q.questionId}><div>{q.proposedWeight > q.currentWeight ? 'Raise' : 'Lower'} “{q.question}” from {q.currentWeight} → {q.proposedWeight}</div><q>{q.note}</q><div className="meta"><Badge tone="outline">Proposal</Badge><span>from {cal.labelled} graded decisions</span></div></div>) : <p className="small muted">{cal.explanation}</p>}</div>}
        <p className="disc" style={{ marginTop: 'var(--s4)' }}>Proposals are applied as reviewed versions in the <button className="linkish" onClick={() => go('builder')}>Signal Builder</button>, never automatically.</p></div>
    </div>
  </section>;
}
