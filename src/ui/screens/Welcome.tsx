'use client';
import { useState } from 'react';
import { createWorkspace, session, signIn, startDemo, type Membership } from '../api';
import { Logo } from '../components';

/** Entry: isolated demo workspace (synthetic data, no external calls) or Supabase sign-in to a live workspace. */
export function Welcome({ onReady, notice }: { onReady: () => void; notice?: string }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(notice ?? '');
  const [pending, setPending] = useState<{ token: string; refreshToken: string; memberships: Membership[] } | null>(null);
  const [name, setName] = useState('LeadRadar workspace');
  async function guard(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); } }
  const choose = (tenant: string, p = pending!) => { session.set({ token: p.token, refreshToken: p.refreshToken, tenant, email }); onReady(); };
  return <main className="welcome">
    <div className="card">
      <div className="hero" style={{ marginBottom: 0 }}>
        <div>
          <div className="brand" style={{ marginBottom: 'var(--s6)' }}><span style={{ width: 32, height: 32, display: 'block' }}><Logo /></span>LeadRadar</div>
          <span className="badge orange" style={{ marginBottom: 'var(--s4)' }}>B2B intelligence · Romania &amp; Moldova</span>
          <h1>Don&apos;t find leads. <em>Find reasons to call.</em></h1>
          <p className="lede">Public evidence, a formula you can read, and a human who approves every next step.</p>
          <button className="btn primary" disabled={busy} onClick={() => guard(async () => { await startDemo(); onReady(); })}>Explore the demo</button>
          <p className="small muted" style={{ marginTop: 'var(--s3)' }}>Isolated demo workspace with fictional companies and labelled reference cases. No web, AI or CRM requests.</p>
        </div>
        <div className="stack">
          <h2>Sign in to a live workspace</h2>
          {!pending ? <form className="stack" onSubmit={e => { e.preventDefault(); void guard(async () => { const r = await signIn(email, password); setPassword(''); if (r.memberships.length === 1) choose(r.memberships[0].tenant_id, r); else setPending(r); }); }}>
            <label className="field"><span>Email</span><input className="text" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label className="field"><span>Password</span><input className="text" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
            <button className="btn inverse" disabled={busy}>Sign in</button>
          </form> : pending.memberships.length ? <div className="stack"><span className="label">Choose a workspace</span>{pending.memberships.map(m => <button key={m.tenant_id} className="btn" onClick={() => choose(m.tenant_id)}>{m.tenant_id.slice(0, 8)}… · {m.role}</button>)}</div>
            : <div className="stack"><p className="small muted">No workspace yet. Create one; you become its administrator. It starts empty (live data only).</p>
              <label className="field"><span>Workspace name</span><input className="text" value={name} onChange={e => setName(e.target.value)} /></label>
              <button className="btn primary" disabled={busy || name.trim().length < 2} onClick={() => guard(async () => { const tenant = await createWorkspace(pending.token, name.trim()); choose(tenant); })}>Create workspace</button></div>}
          {error && <div className="errband" role="alert"><span>{error}</span></div>}
        </div>
      </div>
    </div>
  </main>;
}
