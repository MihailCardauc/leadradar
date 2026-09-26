'use client';
import { useMemo } from 'react';
import { useApp } from '../store';
import { Badge, CountUp } from '../components';
import { fmtDate, metrics, shortQuestion } from '../derive';

/** Product explainer from the design, with live counters and a ticker of the latest validated signals. */
export function How() {
  const { view, go } = useApp();
  const m = useMemo(() => metrics(view.state, view.priorities), [view.state, view.priorities]);
  const names = new Map(view.state.companies.map(c => [c.id, c.name]));
  const ticker = view.state.evidence.filter(e => e.answer === 'yes' && e.status === 'validated' && e.quote).sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '')).slice(0, 8);
  const tenders = (view.state.tenders ?? []).filter(t => t.status === 'active').slice(0, 3);
  return <section className="screen" aria-labelledby="how-h">
    <div className="hero">
      <div>
        <span className="badge orange" style={{ marginBottom: 'var(--s4)' }}>B2B intelligence · Romania &amp; Moldova</span>
        <h1 id="how-h">Don&apos;t find leads. <em>Find reasons to call.</em></h1>
        <p className="lede">LeadRadar reads public events — tenders, hiring, announcements, incidents, annual reports — scores every company with a formula you can read, adds what your CRM and accounting already know, and drafts the next step for a human to approve.</p>
        <div className="row" style={{ gap: 'var(--s3)' }}><button className="btn primary" onClick={() => go('radar')}>See today&apos;s radar</button><button className="btn" onClick={() => go('builder')}>How scoring works</button></div>
      </div>
      <div className="radar" aria-label="Radar animation: signals arriving and being scored">
        <svg viewBox="0 0 400 400" aria-hidden="true">
          <defs><linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--lime)" stopOpacity="0" /><stop offset="1" stopColor="var(--lime)" stopOpacity=".45" /></linearGradient></defs>
          {[180, 130, 80, 30].map(r => <circle key={r} className="ring" cx="200" cy="200" r={r} />)}
          <path className="ring" d="M20 200H380M200 20V380" />
          <path className="sweep" d="M200 200 L380 200 A180 180 0 0 0 290 44 Z" fill="url(#sw)" />
          <circle className="blip" cx="290" cy="120" r="6" fill="var(--lime)" /><circle className="blip o" cx="120" cy="250" r="6" fill="var(--orange)" /><circle className="blip g2" cx="250" cy="300" r="6" fill="var(--lime)" /><circle className="blip o2" cx="140" cy="140" r="6" fill="var(--orange)" />
          <circle cx="290" cy="120" r="4" fill="var(--lime)" /><circle cx="120" cy="250" r="4" fill="var(--orange)" /><circle cx="250" cy="300" r="4" fill="var(--lime)" /><circle cx="140" cy="140" r="4" fill="var(--orange)" />
          <circle cx="200" cy="200" r="6" fill="var(--ink)" />
        </svg>
        <div className="kpis"><span className="kpi g"><b><CountUp to={m.itemsRead} /></b> sources read</span><span className="kpi"><b><CountUp to={m.qualified} /></b> qualified</span><span className="kpi o"><b><CountUp to={(view.state.tenders ?? []).filter(t => t.status === 'active').length} /></b> tenders</span></div>
      </div>
    </div>
    <div className="steps" style={{ marginBottom: 'var(--s6)' }}>
      <div className="step hover-lift"><span className="n">1</span><h3>Listen</h3><p>SEAP/SICAP, MTender, TED, ANAF, job boards and news, read selectively and ethically. No LinkedIn scraping, no person tracking.</p></div>
      <div className="step hover-lift"><span className="n">2</span><h3>Extract evidence</h3><p>Each signal becomes a claim with its exact quote, source and date, tagged Fact or Hypothesis. Nothing is inferred that the text does not say.</p></div>
      <div className="step hover-lift"><span className="n">3</span><h3>Score in the open</h3><p>P = 0.35·fit + 0.65·relevance − penalties, with recency decay. Unknown is never negative; gates beat numbers. Every contribution is visible and versioned.</p></div>
      <div className="step hover-lift"><span className="n">4</span><h3>Hand to a human</h3><p>CRM and accounting say new business or upsell. You approve a draft or a bid; one approved case creates a single CRM record.</p></div>
    </div>
    {(ticker.length > 0 || tenders.length > 0) && <div className="ticker" aria-hidden="true"><div className="track-t">
      {ticker.map(e => <span key={e.id}><i />{names.get(e.companyId)} · {shortQuestion(e.questionText).toLowerCase()} · {e.publisher} · {fmtDate(e.eventDate)}</span>)}
      {tenders.map(t => <span key={t.id}><i className="o" />Tender · {t.title} · {t.authority} · deadline {fmtDate(t.deadline)}</span>)}
    </div></div>}
    <div className="grid2">
      <div className="card"><h2 style={{ marginBottom: 'var(--s3)' }}>What makes it different</h2><div className="stack" style={{ gap: 'var(--s3)' }}>
        <div className="ev"><div>Evidence, not tracking</div><q>Intent comes from public, citable events, never from de-anonymised visits or person-level data. Company-level by design.</q></div>
        <div className="ev"><div>A formula you can read</div><q>Deterministic, versioned scoring with every contribution visible; stages and windows are labelled estimates until calibrated.</q></div>
        <div className="ev"><div>CRM plus accounting</div><q>Existing customer and purchased services change the action: upsell versus new business.</q></div>
        <div className="ev"><div>Romania and Moldova first</div><q>SEAP/SICAP, MTender, TED, ANAF, local job boards and press as first-class sources; Romanian extraction.</q></div>
      </div></div>
      <div className="card"><h2 style={{ marginBottom: 'var(--s3)' }}>Guardrails</h2><div className="stack" style={{ gap: 'var(--s3)' }}>
        <div className="ev"><div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="lime">GDPR</Badge><span>Company data only (name, CUI, CAEN, turnover). No individual profiling.</span></div></div>
        <div className="ev"><div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="lime">AI Act</Badge><span>Automated extraction and drafts are labelled; every decision links to its source.</span></div></div>
        <div className="ev"><div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="orange">Human gate</Badge><span>Nothing is sent or submitted by LeadRadar; a person approves each draft or bid.</span></div></div>
        <div className="ev"><div className="row" style={{ gap: 'var(--s2)' }}><Badge tone="orange">Ethical ingestion</Badge><span>Hosted extraction on public pages; untrusted page text can never trigger an action.</span></div></div>
      </div></div>
    </div>
  </section>;
}
