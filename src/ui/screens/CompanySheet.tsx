'use client';
import { useMemo, useState } from 'react';
import type { DecisionCase, Evidence, Question } from '../../domain/model';
import { confirmingQuestions } from '../../domain/prediction';
import { useApp } from '../store';
import { Badge, Icon, ReasonPicker, useRevealOnChange } from '../components';
import { REJECT_REASONS, bandLabel, cardEvidence, decisionTypeLabel, evidenceTag, fmtDate, hostOf, importance, meterSegments, round, sizeLine } from '../derive';

type Mode = { kind: 'idle' } | { kind: 'preview'; decision: DecisionCase } | { kind: 'reject' } | { kind: 'identity' };

export function CompanySheet({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const { view, serviceId, isAdmin, run, call, query, busy, openDecision } = useApp();
  const w = view.state;
  const company = w.companies.find(c => c.id === companyId);
  const service = w.services.find(s => s.id === serviceId);
  const evaluation = w.evaluations.find(e => e.companyId === companyId && e.serviceId === serviceId);
  const prediction = w.predictions?.find(p => p.evaluationId === evaluation?.id);
  const row = view.priorities.find(r => r.companyId === companyId);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [cf, setCf] = useState<Record<string, string>>({});
  const evidence = useMemo(() => cardEvidence(w.evidence, companyId, serviceId), [w.evidence, companyId, serviceId]);
  const sheet = useRevealOnChange<HTMLElement>(companyId);
  if (!company || !service || !evaluation) return <aside className="sheet" aria-live="polite"><p className="muted">This company has no evaluation for the selected service.</p><button className="btn" onClick={onClose}>Close</button></aside>;

  const segs = meterSegments(evaluation, service);
  const positiveTotal = segs.filter(s => s.value > 0).reduce((n, s) => n + s.value, 0) || 1;
  const invoices = w.invoices.filter(i => i.companyId === company.id);
  const openCase = w.decisions?.find(d => d.companyId === company.id && d.serviceId === serviceId && ['draft', 'review_required', 'approved', 'queued', 'delivered', 'unknown_delivery', 'failed'].includes(d.approvalStatus));
  const crossSell = w.evaluations.filter(e => e.companyId === company.id && e.serviceId !== serviceId && (e.band === 'hot' || e.band === 'warm')).map(e => w.services.find(s => s.id === e.serviceId)?.name).filter(Boolean) as string[];
  const confirm = confirmingQuestions(evaluation, service).slice(0, 3);
  const blocked = evaluation.status === 'excluded';
  const needsResearch = evaluation.status === 'review';
  const relBadge = company.relationship === 'customer' ? <Badge tone="lime">Customer</Badge> : company.relationship === 'prospect' ? <Badge tone="orange">In CRM · prospect</Badge> : <Badge>New prospect</Badge>;

  async function build() {
    const d = await run<DecisionCase>('decision', { companyId, serviceId });
    if (d) setMode({ kind: 'preview', decision: d });
  }
  async function approve(d: DecisionCase) {
    const approved = await run<DecisionCase>('decision-review', { id: d.id, decision: 'approve', reason: 'Evidence checked on the company card', contentHash: d.contentHash }, 'Approved · the exact previewed content is locked by its hash');
    if (!approved) return;
    if (isAdmin) await run('decision-queue', { id: d.id }, view.mode === 'demo' ? 'Queued · demo stores it locally, no HubSpot request is made' : 'Queued in the CRM outbox · confirm the HubSpot preview in Actions');
    setMode({ kind: 'idle' });
  }
  async function reject(reason: string) {
    const d = openCase && ['draft', 'review_required'].includes(openCase.approvalStatus) ? openCase : null;
    const ok = d ? await run('decision-review', { id: d.id, decision: 'reject', reason }, 'Rejected · reason logged for recalibration')
      : await run('feedback', { companyId, serviceId, decision: 'rejected', reason }, 'Rejected · reason logged for recalibration');
    if (ok !== null) setMode({ kind: 'idle' });
  }
  async function research() {
    if (view.mode === 'demo') await run('demo-research', { companyId, serviceId }, 'Demo replay done · stored synthetic evidence only, no web or AI request');
    else await call('/api/research', { companyId, serviceId }, 'Research queued · the worker reads public pages; candidates arrive for review');
  }
  async function whatIf(e: Evidence) {
    const r = await query<{ rows: { evidenceId: string; before: number; after: number; bandBefore: string; bandAfter: string }[] }>('counterfactual', { companyId, serviceId, evidenceId: e.id });
    const x = r?.rows[0]; if (x) setCf(c => ({ ...c, [e.id]: `Without this signal: P ${round(x.before)} → ${round(x.after)}${x.bandBefore !== x.bandAfter ? ` (${bandLabel(x.bandBefore)} → ${bandLabel(x.bandAfter)})` : ''}` }));
  }

  return <aside ref={sheet} className="sheet" aria-live="polite" aria-label={`${company.name} intelligence card`}>
    <div className="head" style={{ marginBottom: 'var(--s3)' }}>
      <div><div className="label">Company intelligence card · {service.name}</div><h2 style={{ fontSize: 28, lineHeight: '34px', fontWeight: 400 }}>{company.name}</h2>
        <div className="small muted">{company.legalId || 'no legal identifier'} · identity {company.identity} · {sizeLine(company)}</div></div>
      <div className="row" style={{ gap: 'var(--s2)' }}>{relBadge}{company.dataMode !== 'live' && <Badge tone="outline">{company.dataMode === 'synthetic' ? 'Synthetic demo' : 'Reference pack'}</Badge>}<button className="ibtn filled" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>
    </div>

    <div className="meter" style={{ margin: 'var(--s4) 0' }}>
      <div className="total tnum" title="Priority, not purchase probability">{round(evaluation.P)}</div>
      <div className="segs">
        <div className="seg-track" role="img" aria-label={`Priority ${round(evaluation.P)} of 100: ${segs.map(s => `${s.label} ${s.value >= 0 ? '+' : ''}${s.value.toFixed(1)}`).join(', ')}`}>
          {segs.map((s, i) => <div key={i} className={`seg ${s.kind === 'penalty' ? 'pen' : ''}`} style={{ width: `${Math.abs(s.value) / Math.max(100, positiveTotal) * 100}%`, opacity: s.kind === 'fit' ? 0.65 : 1 }} title={`${s.label} ${s.value >= 0 ? '+' : ''}${s.value.toFixed(1)}`} />)}
        </div>
        <div className="legend">{segs.map((s, i) => <span key={i} className={s.kind === 'penalty' ? 'pen' : ''}>{s.label} {s.value >= 0 ? '+' : ''}{s.value.toFixed(1)}</span>)}</div>
      </div>
      <Badge tone="outline" title="P = fitWeight·F + relevanceWeight·R − N; a priority, not a purchase probability">{evaluation.rulesVersion ?? `v${evaluation.version}`} · {bandLabel(evaluation.band)}</Badge>
    </div>
    <div className="small muted" style={{ marginBottom: 'var(--s4)' }}>F {round(evaluation.F)} (range {round(evaluation.fitRange?.min ?? evaluation.F)}–{round(evaluation.fitRange?.max ?? evaluation.F)}) · R {evaluation.R.toFixed(1)} · N {evaluation.N.toFixed(1)} · coverage K {round(evaluation.K)}% · C {round(evaluation.C)}%. Priority, not purchase probability.</div>

    {(evaluation.gates ?? []).length > 0 && <div className="gate" style={{ marginBottom: 'var(--s4)' }}><span aria-hidden>⚑</span><div><b>Gated:</b> {(evaluation.gates ?? []).map(g => `${g.code.replace('_', ' ')} — ${g.detail}`).join(' · ')}</div></div>}

    {prediction && <div className="row" style={{ marginBottom: 'var(--s5)' }}>
      <div className="stat"><div className="lbl">Buying stage</div><div className="val" style={{ fontSize: 20, lineHeight: '26px' }}><span style={{ textTransform: 'capitalize' }}>{prediction.stage}</span></div><div className="sub">{prediction.stageReason}</div></div>
      <div className="stat"><div className="lbl">Momentum</div><div className="val" style={{ fontSize: 20, lineHeight: '26px' }}><span>{prediction.momentum.replace('_', ' ')}</span></div><div className="sub">ΔR {prediction.momentumDelta >= 0 ? '+' : ''}{prediction.momentumDelta}</div></div>
      <div className="stat"><div className="lbl">Opportunity window</div><div className="val" style={{ fontSize: 20, lineHeight: '26px' }}><span>{prediction.window ? `${prediction.window.minDays}–${prediction.window.maxDays} d` : '—'}</span></div><span className="corner badge orange">Uncalibrated</span><div className="sub">{prediction.window?.sequenceName ?? 'No expert sequence matched yet'}</div></div>
    </div>}

    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--s3)' }}><div className="label">Public signals · {evidence.length}</div>
      {isAdmin && <button className="btn sm" disabled={busy || row?.researchInProgress} onClick={research}>{row?.researchInProgress ? <><span className="spin" /> Research in progress</> : view.mode === 'demo' ? 'Replay research (demo)' : 'Research this company'}</button>}</div>
    {evidence.length === 0 ? <p className="small muted">No evidence yet for this service. Unknown is not negative: run research or add evidence.</p> :
      <div className="evgrid" style={{ marginBottom: 'var(--s5)' }}>{evidence.map(e => <EvidenceCard key={e.id} e={e} q={service.questions.find(q => q.id === e.questionId)} onWhatIf={() => whatIf(e)} whatIf={cf[e.id]} />)}</div>}

    {confirm.length > 0 && <><div className="label" style={{ margin: 'var(--s2) 0' }}>Would move the score if confirmed (research list)</div>
      <ul className="trace" style={{ marginBottom: 'var(--s5)' }}>{confirm.map(q => <li key={q.questionId}>{q.question} <span className="tnum">(+{q.potentialPoints.toFixed(1)}{q.wouldReachHot ? ', would reach Hot' : ''})</span></li>)}</ul></>}

    <div className="label" style={{ marginBottom: 'var(--s3)' }}>Internal context</div>
    <div className="row" style={{ marginBottom: 'var(--s5)' }}>
      <div className="stat"><div className="lbl">Accounting</div><div className="val" style={{ fontSize: 15, lineHeight: '22px' }}><span>{invoices.length ? `${invoices.length} invoice(s) · ${[...new Set(invoices.map(i => w.services.find(s => s.id === i.serviceId)?.name ?? 'product unknown'))].join(', ')}` : 'No association — new prospect'}</span></div>{invoices.length > 0 && <div className="sub">last {fmtDate(invoices.map(i => i.date).sort().at(-1))}{invoices.some(i => i.synthetic) ? ' · fictitious import' : ''}</div>}</div>
      <div className="stat"><div className="lbl">CRM</div><div className="val" style={{ fontSize: 15, lineHeight: '22px' }}><span>{company.crmRecordId ? `HubSpot company ${company.crmRecordId}` : company.relationship === 'unknown' ? 'No record matched' : company.relationship}</span></div><div className="sub">Owner: {company.owner}{row ? ` · next step: ${decisionTypeLabel[row.nextStep as DecisionCase['type']] ?? row.nextStep}` : ''}</div></div>
    </div>

    <div className="label" style={{ marginBottom: 'var(--s2)' }}>Recommended offer</div>
    <div style={{ marginBottom: 'var(--s3)' }}>{blocked ? 'Not recommended while an exclusion applies.' : service.recommendedOffer || service.name}</div>
    <div className="row" style={{ gap: 'var(--s2)', marginBottom: 'var(--s5)' }}>
      {crossSell.map(x => <span key={x} className="chip quiet" style={{ height: 32, fontSize: 13 }}>{x}</span>)}
      {service.buyingRoles.map(r => <Badge key={r.role} tone="outline">{r.role} · {r.purpose.replace('_', ' ')}</Badge>)}
    </div>

    {company.identity !== 'confirmed' && isAdmin && <IdentityPanel companyId={company.id} open={mode.kind === 'identity'} onOpen={() => setMode({ kind: 'identity' })} onDone={() => setMode({ kind: 'idle' })} />}

    <div className="row" style={{ justifyContent: 'flex-end' }}>
      {openCase && ['queued', 'delivered'].includes(openCase.approvalStatus) ? <><Badge tone="lime">{openCase.approvalStatus === 'delivered' ? `Delivered${openCase.remoteId?.startsWith('demo:') ? ' (demo, stored locally)' : ` · ${openCase.remoteId}`}` : 'Queued for CRM'}</Badge><button className="btn sm" onClick={() => openDecision(openCase.id)}>Open case</button></>
        : mode.kind === 'reject' ? <ReasonPicker reasons={REJECT_REASONS} busy={busy} onPick={reject} onBack={() => setMode({ kind: 'idle' })} />
        : mode.kind === 'preview' ? <DecisionPreview d={mode.decision} busy={busy} isAdmin={isAdmin} onBack={() => setMode({ kind: 'idle' })} onApprove={() => approve(mode.decision)} onEdit={() => openDecision(mode.decision.id)} />
        : <>
          <button className="btn" disabled={busy} onClick={() => setMode({ kind: 'reject' })}>Reject</button>
          <button className="btn inverse" disabled={busy} onClick={async () => { const d = openCase ?? await run<DecisionCase>('decision', { companyId, serviceId }); if (d) openDecision(d.id); }}>Edit draft</button>
          <button className="btn primary" disabled={busy || blocked} title={blocked ? 'An exclusion applies' : needsResearch ? 'Gates open: the case will be a research task' : undefined} onClick={openCase ? () => setMode({ kind: 'preview', decision: openCase }) : build}>{needsResearch ? 'Review research task' : 'Review and approve'}</button>
        </>}
    </div>
    {openCase?.approvalStatus === 'approved' && isAdmin && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--s3)' }}><button className="btn primary sm" disabled={busy} onClick={() => run('decision-queue', { id: openCase.id }, 'Queued for CRM')}>Queue approved case for CRM</button></div>}
    <div className="disc" style={{ marginTop: 'var(--s4)' }}>This score is generated by a deterministic, versioned formula from public evidence; drafts are AI-free templates filled with approved facts. Every signal links to its source for human verification. {company.dataMode === 'synthetic' ? 'Fictional company (demo data).' : ''}</div>
  </aside>;
}

function EvidenceCard({ e, q, onWhatIf, whatIf }: { e: Evidence; q: Question | undefined; onWhatIf: () => void; whatIf?: string }) {
  const { isAdmin, run, busy } = useApp();
  const [review, setReview] = useState(false);
  const [reason, setReason] = useState('Quote checked against the source');
  const [date, setDate] = useState(e.eventDate ?? '');
  const tag = evidenceTag(e); const imp = importance(q);
  const pending = e.status === 'review';
  return <div className="ev">
    <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--s2)' }}>
      <span className={`badge ${imp === 'High' ? 'lime' : imp === 'Medium' ? '' : 'outline'}`}>{imp}</span>
      <span className="row" style={{ gap: 6 }}>{e.answer === 'no' && <Badge tone="outline">Explicit no</Badge>}{q?.kind === 'penalty' && e.answer === 'yes' && <Badge tone="orange">Penalty</Badge>}{pending && <Badge tone="orange">Needs review</Badge>}</span>
    </div>
    <div>{e.questionText.replace(/\?$/, '')}</div>
    {e.quote ? <q>{e.quote}</q> : <span className="small muted">No quote: {e.reason}</span>}
    <div className="meta"><span className={`badge ${tag.tone}`}>{tag.label}</span><span>{e.publisher || hostOf(e.url)}</span><span>·</span><span>{fmtDate(e.eventDate)}</span>{e.synthetic && <span>· synthetic</span>}</div>
    {e.uncertainty && <div className="small muted">{e.uncertainty}</div>}
    {whatIf && <div className="small" style={{ color: 'var(--orange-ink)' }}>{whatIf}</div>}
    <div className="row" style={{ gap: 'var(--s2)' }}>
      <a className="btn sm" href={e.url} target="_blank" rel="noopener noreferrer">Open source</a>
      {e.answer === 'yes' && e.status === 'validated' && <button className="btn sm" onClick={onWhatIf}>What if wrong?</button>}
      {pending && isAdmin && (e.answer === 'yes' || e.answer === 'no') && !review && <button className="btn sm" onClick={() => setReview(true)}>Review</button>}
    </div>
    {review && <div className="inline-form">
      <label className="field"><span>Reason</span><input className="text" value={reason} onChange={x => setReason(x.target.value)} /></label>
      <label className="field"><span>Event date read in the source (optional)</span><input className="text" type="date" value={date} onChange={x => setDate(x.target.value)} /></label>
      <div className="row" style={{ gap: 'var(--s2)' }}>
        <button className="btn sm primary" disabled={busy || reason.trim().length < 8} onClick={async () => { await run('evidence-review', { id: e.id, decision: 'validate', reason, ...(date && date !== e.eventDate ? { eventDate: date } : {}) }, 'Evidence validated · it now counts in the score'); setReview(false); }}>Validate</button>
        <button className="btn sm danger" disabled={busy || reason.trim().length < 8} onClick={async () => { await run('evidence-review', { id: e.id, decision: 'reject', reason }, 'Evidence rejected'); setReview(false); }}>Reject</button>
        <button className="btn sm" onClick={() => setReview(false)}>Cancel</button>
      </div>
    </div>}
  </div>;
}

function DecisionPreview({ d, busy, isAdmin, onBack, onApprove, onEdit }: { d: DecisionCase; busy: boolean; isAdmin: boolean; onBack: () => void; onApprove: () => void; onEdit: () => void }) {
  const canApprove = d.approvalStatus === 'review_required' || d.approvalStatus === 'draft';
  return <div className="stack" style={{ flex: '1 1 100%' }}>
    <div className="draft">
      <div className="label" style={{ marginBottom: 8 }}>Preview · {decisionTypeLabel[d.type]} · team {d.team} · due {fmtDate(d.dueAt)}</div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{d.draft}</div>
      <div className="small muted" style={{ marginTop: 8 }}>{d.evidenceIds.length} evidence item(s) attached · content hash {d.contentHash.slice(0, 12)} · expires {fmtDate(d.expiresAt)}</div>
    </div>
    {d.uncertainties.length > 0 && <div className="small muted">Uncertainties: {d.uncertainties.join(' · ')}</div>}
    <details><summary className="small">Routing trace</summary><ol className="trace">{d.routingTrace.map((t, i) => <li key={i}>{t}</li>)}</ol></details>
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      <button className="btn" onClick={onBack}>Back</button>
      <button className="btn inverse" onClick={onEdit}>Edit draft</button>
      {canApprove ? <button className="btn primary" disabled={busy} onClick={onApprove}>{isAdmin ? 'Approve and queue for CRM' : 'Approve'}</button> : <Badge tone="outline">{d.approvalStatus}</Badge>}
    </div>
  </div>;
}

function IdentityPanel({ companyId, open, onOpen, onDone }: { companyId: string; open: boolean; onOpen: () => void; onDone: () => void }) {
  const { call, run, busy, toast } = useApp();
  const [legalId, setLegalId] = useState(''); const [reason, setReason] = useState('');
  if (!open) return <div className="gate" style={{ marginBottom: 'var(--s4)', justifyContent: 'space-between' }}><span>Identity is not confirmed: CRM, accounting and outreach stay blocked.</span><button className="btn sm" onClick={onOpen}>Verify identity</button></div>;
  return <div className="inline-form" style={{ marginBottom: 'var(--s4)' }}>
    <label className="field"><span>Legal identifier (Romanian CUI is checked in the public ANAF registry)</span><input className="text" value={legalId} onChange={e => setLegalId(e.target.value)} placeholder="e.g. RO12345678" /></label>
    <div className="row" style={{ gap: 'var(--s2)' }}>
      <button className="btn sm primary" disabled={busy || legalId.trim().length < 2} onClick={async () => { const r = await call<{ result: { confirmed: boolean; reason: string } }>('/api/identity', { action: 'verify', companyId, legalId: legalId.trim() }); if (r) { toast(r.result.confirmed ? `Confirmed · ${r.result.reason}` : `Not confirmed · ${r.result.reason}`); if (r.result.confirmed) onDone(); } }}>Check ANAF</button>
      <button className="btn sm" onClick={onDone}>Cancel</button>
    </div>
    <label className="field"><span>Or confirm manually (Moldovan IDNO, foreign registry) — documented reason required</span><input className="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Registry extract checked on …" /></label>
    <button className="btn sm" style={{ alignSelf: 'start' }} disabled={busy || legalId.trim().length < 3 || reason.trim().length < 8} onClick={async () => { if (await run('resolve', { companyId, legalId: legalId.trim(), reason: reason.trim() }, 'Identity confirmed manually · audit entry written')) onDone(); }}>Confirm manually</button>
  </div>;
}
