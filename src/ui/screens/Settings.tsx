'use client';
import { Fragment, useEffect, useState } from 'react';
import { api, session } from '../api';
import { useApp } from '../store';
import { Badge, Overlay } from '../components';
import { fmtDate } from '../derive';

type Member = { userId: string; email: string | null; role: string };

/** Workspace settings: session, integrations (presence only), budgets, sources, members, configuration export. */
export function Settings({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const { view, isAdmin, run, busy, toast } = useApp();
  const b = view.state.budgets!; const [budgets, setBudgets] = useState(b);
  const [members, setMembers] = useState<Member[] | null>(null); const [email, setEmail] = useState(''); const [role, setRole] = useState<'admin' | 'sales'>('sales');
  useEffect(() => { if (view.mode === 'live') api<{ members: Member[] }>('/api/members').then(r => setMembers(r.members)).catch(() => setMembers([])); }, [view.mode]);
  async function exportConfig() {
    try { const cfg = await api('/api/config'); const url = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'leadradar-config.json'; a.click(); URL.revokeObjectURL(url); }
    catch (e) { toast(e instanceof Error ? e.message : 'Export failed'); }
  }
  const usage = view.summary.usageToday;
  return <Overlay title="Settings" onClose={onClose}>
    <div className="stack">
      <dl className="kv"><dt>Mode</dt><dd>{view.mode === 'demo' ? 'Demo · isolated synthetic workspace' : `Live · ${session.get()?.email ?? ''}`}</dd><dt>Role</dt><dd>{view.role}</dd><dt>Revision</dt><dd>{view.state.revision}</dd></dl>
      <div><h3>Integrations</h3><p className="small muted" style={{ margin: '4px 0 8px' }}>Presence of configuration only — a configured key is not a verified connection.</p>
        <dl className="kv">{Object.entries(view.integrations).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl></div>
      <div><h3>Source health</h3><dl className="kv" style={{ marginTop: 8 }}>{(view.state.sources ?? []).map(s => <Fragment key={s.id}><dt>{s.name}</dt><dd>{s.state}{s.lastSuccessAt ? ` · ok ${fmtDate(s.lastSuccessAt)}` : ''}{s.consecutiveFailures ? ` · ${s.consecutiveFailures} failure(s)` : ''}</dd></Fragment>)}</dl></div>
      <div><h3>Research budget</h3><p className="small muted" style={{ margin: '4px 0 8px' }}>Today: {usage.runs} run(s), ≈{usage.costEur} EUR (estimate).</p>
        <div className="row">{([['dailyResearchRuns', 'Runs / day'], ['maxPagesPerRun', 'Pages / run'], ['maxQueriesPerRun', 'Searches / run'], ['maxTokensPerRun', 'Tokens / run'], ['maxCostPerDayEur', 'EUR / day']] as const).map(([k, l]) =>
          <label key={k} className="field" style={{ flex: '1 1 110px' }}><span>{l}</span><input className="text" type="number" min={0} disabled={!isAdmin} value={budgets[k]} onChange={e => setBudgets({ ...budgets, [k]: Number(e.target.value) })} /></label>)}</div>
        {isAdmin && <button className="btn sm" style={{ marginTop: 8 }} disabled={busy || JSON.stringify(budgets) === JSON.stringify(b)} onClick={() => run('budgets-update', budgets, 'Budgets saved')}>Save budgets</button>}</div>
      {view.mode === 'live' && <div><h3>Members</h3>{members === null ? <p className="small muted">Loading…</p> : <ul className="trace" style={{ margin: '8px 0' }}>{members.map(m => <li key={m.userId}>{m.email ?? m.userId} · {m.role}{isAdmin && m.email !== session.get()?.email && <> · <button className="linkish" onClick={async () => { try { await api('/api/members', { action: 'remove', userId: m.userId }); setMembers(members.filter(x => x.userId !== m.userId)); } catch (e) { toast(e instanceof Error ? e.message : 'Failed'); } }}>remove</button></>}</li>)}</ul>}
        {isAdmin && <div className="row" style={{ gap: 'var(--s2)' }}><input className="text" style={{ flex: '2 1 200px' }} placeholder="Existing account email" value={email} onChange={e => setEmail(e.target.value)} /><select className="text" style={{ width: 'auto' }} value={role} onChange={e => setRole(e.target.value as 'admin' | 'sales')}><option value="sales">sales</option><option value="admin">admin</option></select>
          <button className="btn sm" disabled={!email.includes('@')} onClick={async () => { try { await api('/api/members', { action: 'add', email, role }); setEmail(''); setMembers((await api<{ members: Member[] }>('/api/members')).members); toast('Member added'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed'); } }}>Add</button></div>}</div>}
      <div className="row" style={{ justifyContent: 'space-between' }}>{isAdmin ? <button className="btn" onClick={exportConfig}>Export configuration</button> : <span />}<Badge tone="outline">No secrets are shown or exported</Badge><button className="btn danger" onClick={onSignOut}>Sign out</button></div>
    </div>
  </Overlay>;
}
