'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Criterion, Question, Service } from '../../domain/model';
import { signalCategories } from '../../domain/model';
import type { Simulation } from '../../domain/simulate';
import { normalizeWeights } from '../../domain/simulate';
import { taxonomyList } from '../../domain/templates';
import { useApp } from '../store';
import { Badge, useDebounced } from '../components';
import { bandLabel, importance, round } from '../derive';

const OP: Record<Criterion['operator'], string> = { in: 'in', gte: '≥', lte: '≤', between: 'between' };
const critLabel = (c: Criterion) => `${c.field} ${OP[c.operator]} ${c.value.split(',').slice(0, 4).join(', ')}${c.value.split(',').length > 4 ? '…' : ''}`;
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'question';

export function Builder() {
  const { view, serviceId, setServiceId, isAdmin, run, query, busy } = useApp();
  const w = view.state; const service = w.services.find(s => s.id === serviceId);
  const [draft, setDraft] = useState<Service | null>(service ? structuredClone(service) : null);
  const [sim, setSim] = useState<Simulation | null>(null); const [simError, setSimError] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', category: 'strategic' as Question['category'], weight: 10, kind: 'positive' as Question['kind'] });
  // The draft is re-initialised by the parent via `key={serviceId:version}` whenever the published service changes.
  const debounced = useDebounced(draft, 450);
  const dirty = useMemo(() => Boolean(draft && service && JSON.stringify(draft) !== JSON.stringify(service)), [draft, service]);
  const effective = useMemo(() => draft ? new Map(normalizeWeights(draft).questions.map(q => [q.id, q.weight])) : new Map<string, number>(), [draft]);
  useEffect(() => {
    if (!debounced || !isAdmin) return; let live = true;
    query<{ detail: Simulation }>('simulate', debounced).then(r => { if (!live) return; setSimError(!r); setSim(r?.detail ?? null); });
    return () => { live = false; };
  }, [debounced, isAdmin, query]);
  if (!service || !draft) return <section className="screen"><h1>Signal Builder</h1><p className="muted">No service configured yet.</p></section>;

  const setQ = (id: string, patch: Partial<Question>) => setDraft(d => d && ({ ...d, questions: d.questions.map(q => q.id === id ? { ...q, ...patch } : q) }));
  const setC = (id: string, patch: Partial<Criterion>) => setDraft(d => d && ({ ...d, criteria: d.criteria.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const positives = draft.questions.filter(q => q.kind === 'positive'), negatives = draft.questions.filter(q => q.kind !== 'positive');
  const history = w.history.filter(h => h.id === service.id).sort((a, b) => b.version - a.version);
  const missing = taxonomyList.filter(t => !w.services.some(s => s.taxonomy === t));

  function addQuestion() {
    let id = slug(newQ.text); for (let n = 2; draft!.questions.some(q => q.id === id); n++) id = `${slug(newQ.text)}-${n}`;
    const q: Question = { id, text: newQ.text.trim(), weight: newQ.weight, kind: newQ.kind, group: id, halfLife: 90, enabled: true, category: newQ.category, answerType: 'yes_no', positiveExamples: [], negativeExamples: [], horizonDays: 365, sourceHint: '', origin: 'human', commitment: newQ.category === 'procurement' };
    setDraft(d => d && ({ ...d, questions: [...d.questions, q] })); setNewQ(n => ({ ...n, text: '' }));
  }

  return <section className="screen" aria-labelledby="b-h">
    <div className="head"><div><h1 id="b-h">Signal Builder</h1><div className="muted" style={{ marginTop: 8 }}>One configuration per catalogue service. Weights are starting values; tune them in the simulator, then publish a reviewed version.</div></div>
      {isAdmin && <div className="row"><button className="btn" disabled={!dirty || busy} onClick={() => setDraft(structuredClone(service))}>Discard changes</button><button className="btn inverse" disabled={!dirty || busy} onClick={() => run<Service>('publish', draft, s => `Published ${s.name} v${s.version} · scores recalculated; nothing was sent`)}>Save as reviewed version</button></div>}</div>

    <div className="row" style={{ marginBottom: 'var(--s6)' }}>
      {w.services.map(s => <button key={s.id} className="tile" aria-pressed={s.id === serviceId} onClick={() => setServiceId(s.id)}><span className="id">{s.name}</span><span className="nm">{s.taxonomy || 'custom'} · v{s.version}</span></button>)}
      {isAdmin && missing.length > 0 && <label className="tile" style={{ justifyContent: 'center' }}><span className="id">+ Template</span><select className="text" style={{ height: 32, marginTop: 6 }} value="" onChange={e => e.target.value && run('template-add', { taxonomy: e.target.value }, 'Template added as v1 · review ICP and questions before relying on it')}><option value="">Add…</option>{missing.map(t => <option key={t} value={t}>{t}</option>)}</select></label>}
    </div>

    <div className="grid2">
      <div className="card stack">
        <div><h2>Offer, in the supplier&apos;s words</h2>{isAdmin ? <textarea className="text" style={{ marginTop: 8 }} value={draft.offerSummary} onChange={e => setDraft({ ...draft, offerSummary: e.target.value })} aria-label="Offer summary" /> : <p className="muted" style={{ margin: '8px 0 0' }}>{draft.offerSummary || draft.description}</p>}</div>
        <div><h2>ICP</h2>
          <div className="label" style={{ margin: '8px 0' }}>Mandatory (a mismatch excludes; unknown sends to research){isAdmin ? ' — click to toggle' : ''}</div>
          <div className="row" style={{ gap: 'var(--s2)' }}>{draft.criteria.filter(c => c.required).map(c => <button key={c.id} className="chip" aria-pressed="true" disabled={!isAdmin} onClick={() => setC(c.id, { required: false })} title={`weight ${c.weight}`}>{critLabel(c)}</button>)}</div>
          <div className="label" style={{ margin: '12px 0 8px' }}>Preferred (adds to F, unknown earns nothing and penalises nothing)</div>
          <div className="row" style={{ gap: 'var(--s2)' }}>{draft.criteria.filter(c => !c.required).map(c => <button key={c.id} className="chip quiet" disabled={!isAdmin} onClick={() => setC(c.id, { required: true })} title={`weight ${c.weight}`}>{critLabel(c)} · {c.weight}</button>)}</div></div>
        <div><h2>Signal questions</h2>
          {positives.map(q => <div className="sig" key={q.id}>
            <span><span className={`badge ${importance(q) === 'High' ? 'lime' : importance(q) === 'Medium' ? '' : 'outline'}`} style={{ marginRight: 8 }}>{importance(q)}</span>{q.text}<div className="small muted">{q.category.replace('_', ' ')} · half-life {q.halfLife} d{q.commitment ? ' · commitment' : ''}{q.origin !== 'template' ? ` · ${q.origin.replace('_', ' ')}` : ''} · effective {round(effective.get(q.id) ?? 0)}%</div></span>
            <input className="wt tnum" type="number" min={0} max={100} value={q.weight} disabled={!isAdmin} aria-label={`Weight for ${q.text}`} onChange={e => setQ(q.id, { weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)), importance: undefined })} />
            <button className="pol pos" disabled={!isAdmin} onClick={() => setQ(q.id, { kind: 'penalty' })} title="Switch to a negative rule">+ positive</button>
          </div>)}
        </div>
        <div><h2>Negative rules</h2>
          {negatives.map(q => <div className="sig" key={q.id}>
            <span>{q.text}<div className="small muted">{q.kind === 'penalty' ? `Penalty up to −${q.weight} (all penalties capped at ${draft.penaltyCap})` : q.kind === 'exclude' ? 'Gate · excluded when confirmed' : 'Gate · sends to human review'}</div></span>
            {q.kind === 'penalty' ? <input className="wt tnum" type="number" min={0} max={100} value={q.weight} disabled={!isAdmin} aria-label={`Penalty for ${q.text}`} onChange={e => setQ(q.id, { weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} /> : <Badge tone="orange">Gate</Badge>}
            {q.kind === 'penalty' ? <button className="pol neg" disabled={!isAdmin} onClick={() => setQ(q.id, { kind: 'positive' })}>− negative</button> : <span />}
          </div>)}
        </div>
        {isAdmin && <div className="inline-form"><div className="label">Add a question (unknown for every account until researched)</div>
          <input className="text" value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })} placeholder="e.g. Is the company hiring OT security engineers?" aria-label="Question text" />
          <div className="row" style={{ gap: 'var(--s2)' }}>
            <select className="text" style={{ width: 'auto' }} value={newQ.category} onChange={e => setNewQ({ ...newQ, category: e.target.value as Question['category'] })} aria-label="Category">{signalCategories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select>
            <select className="text" style={{ width: 'auto' }} value={newQ.kind} onChange={e => setNewQ({ ...newQ, kind: e.target.value as Question['kind'] })} aria-label="Kind"><option value="positive">positive</option><option value="penalty">penalty</option><option value="exclude">exclusion gate</option><option value="review">review gate</option></select>
            <input className="wt tnum" type="number" min={0} max={100} value={newQ.weight} onChange={e => setNewQ({ ...newQ, weight: Number(e.target.value) || 0 })} aria-label="Weight" />
            <button className="btn sm" disabled={newQ.text.trim().length < 5} onClick={addQuestion}>Add to draft</button>
          </div></div>}
        <div><h2>Buying roles</h2><div className="row" style={{ gap: 'var(--s2)', marginTop: 8 }}>{draft.buyingRoles.map(r => <Badge key={r.role} tone="outline">{r.role} · {r.purpose.replace('_', ' ')}</Badge>)}{!draft.buyingRoles.length && <span className="small muted">None configured.</span>}</div></div>
      </div>

      <div className="card">
        <div className="head" style={{ marginBottom: 'var(--s4)' }}><h2>Simulator</h2><Badge tone="outline">{service.id} v{service.version}{dirty ? ' · draft' : ''}</Badge></div>
        <p className="muted small" style={{ margin: '0 0 var(--s4)' }}>Same companies, same evidence, same time — only the draft differs. Nothing is published or sent.</p>
        {!isAdmin ? <p className="small muted">The simulator is available to administrators.</p> : simError ? <p className="small" style={{ color: 'var(--danger)' }}>The draft is not valid yet (check weights: at least one positive question and one ICP weight above zero).</p> : !sim ? <p className="small muted">Simulating…</p> : <div className="stack">
          {sim.rows.slice().sort((a, b) => a.rankAfter - b.rankAfter).map(r => { const d = r.after.P - r.before.P; return <div key={r.companyId}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span>{r.company}{r.blocked ? <span className="small muted"> · gated</span> : ''}</span><span className="tnum" style={{ fontSize: 22 }}>{round(r.after.P)}{Math.abs(d) >= 0.5 && <span className={`small delta ${d > 0 ? 'up' : 'down'}`}> {d > 0 ? '+' : ''}{d.toFixed(1)}</span>}</span></div>
            <div className="seg-track"><div className="seg" style={{ width: `${draft.fitWeight * r.after.F}%`, opacity: 0.65 }} title={`Profile fit +${(draft.fitWeight * r.after.F).toFixed(1)}`} /><div className="seg" style={{ width: `${draft.relevanceWeight * r.after.R}%` }} title={`Signals +${(draft.relevanceWeight * r.after.R).toFixed(1)}`} />{r.after.N > 0 && <div className="seg pen" style={{ width: `${r.after.N}%` }} title={`Penalties −${r.after.N.toFixed(1)}`} />}</div>
            <div className="small muted" style={{ marginTop: 4 }}>fit +{(draft.fitWeight * r.after.F).toFixed(1)} · signals +{(draft.relevanceWeight * r.after.R).toFixed(1)}{r.after.N ? ` · penalties −${r.after.N.toFixed(1)}` : ''} · {bandLabel(r.bandBefore)}{r.bandBefore !== r.bandAfter ? ` → ${bandLabel(r.bandAfter)}` : ''} · rank {r.rankBefore}{r.rankAfter !== r.rankBefore ? ` → ${r.rankAfter}` : ''}</div>
          </div>; })}
          <p className="disc">{sim.explanation}</p>
        </div>}
        {isAdmin && history.length > 0 && <div className="row" style={{ marginTop: 'var(--s4)', gap: 'var(--s2)' }}><span className="label">Rollback to</span>{history.slice(0, 5).map(h => <button key={h.version} className="btn sm" disabled={busy} onClick={() => run('rollback', { serviceId: service.id, version: h.version }, `Restored v${h.version} as a new version; history kept`)}>v{h.version}</button>)}</div>}
      </div>
    </div>
  </section>;
}
