'use client';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, api, loadWorkspace, signOut, type WorkspaceView } from './api';
import { AppProvider, SCREENS, useApp } from './store';
import { Icon, Logo, Skeleton } from './components';
import { initials } from './derive';
import { Radar } from './screens/Radar';
import { Companies } from './screens/Companies';
import { Tenders } from './screens/Tenders';
import { Builder } from './screens/Builder';
import { Actions } from './screens/Actions';
import { Metrics } from './screens/Metrics';
import { How } from './screens/How';
import { Welcome } from './screens/Welcome';
import { Settings } from './screens/Settings';

/** Root client component: session gate → workspace provider → shell with the design's seven screens. */
export function App() {
  const [state, setState] = useState<{ kind: 'loading' } | { kind: 'signed-out'; notice?: string } | { kind: 'ready'; view: WorkspaceView }>({ kind: 'loading' });
  const load = useCallback(() => api<{ signedIn: boolean }>('/api/session').then(s => s.signedIn ? loadWorkspace() : Promise.reject(new ApiError(401, 'signed out'))).then(
    view => setState({ kind: 'ready', view }),
    (e: unknown) => setState({ kind: 'signed-out', notice: e instanceof ApiError && e.status !== 401 ? e.message : undefined })), []);
  useEffect(() => { void load(); }, [load]);
  const boot = useCallback(() => { setState({ kind: 'loading' }); void load(); }, [load]);
  const out = useCallback(async () => { await signOut(); setState({ kind: 'signed-out' }); }, []);
  if (state.kind === 'loading') return <main className="wrap" aria-busy="true"><Skeleton rows={4} /></main>;
  if (state.kind === 'signed-out') return <Welcome onReady={boot} notice={state.notice} />;
  return <AppProvider initial={state.view} onSignedOut={() => setState({ kind: 'signed-out', notice: 'Session expired; please sign in again.' })}><Shell onSignOut={out} /></AppProvider>;
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
  const { view, screen, go, serviceId, setServiceId } = useApp();
  const [settings, setSettings] = useState(false);
  const waiting = view.summary.decisionsToReview + view.summary.evidenceToReview;
  const service = view.state.services.find(s => s.id === serviceId);
  useTheme();
  return <div className="wrap">
    <header className="top">
      <div className="brand" aria-label="LeadRadar"><Logo />LeadRadar<span className={`pill-note ${view.mode}`}>{view.mode === 'demo' ? 'Demo · synthetic data' : 'Live'}</span></div>
      <nav aria-label="Main"><div className="tabs" role="tablist" aria-label="Screens">{SCREENS.map(([k, l]) => <button key={k} className="tab" role="tab" aria-selected={k === screen} data-s={k} onClick={() => go(k)}>{l}</button>)}</div></nav>
      <div className="icons">
        <label className="svc"><span className="sr-only">Service</span><select className="text" value={serviceId} onChange={e => setServiceId(e.target.value)} title="Scores are per service">{view.state.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <button className={`ibtn ${waiting ? 'dot' : ''}`} aria-label={`Notifications: ${view.summary.decisionsToReview} decision(s) and ${view.summary.evidenceToReview} evidence item(s) waiting`} onClick={() => go(view.summary.decisionsToReview ? 'actions' : 'radar')}><Icon name="bell" /></button>
        <ThemeButton />
        <button className="ibtn" aria-label="Settings" onClick={() => setSettings(true)}><Icon name="gear" /></button>
        <span className="avatar" title={`${view.role} · ${view.mode}`}>{initials(view.role === 'admin' ? 'Key Manager' : 'Sales Rep')}</span>
      </div>
    </header>
    {screen === 'radar' && <Radar />}
    {screen === 'companies' && <Companies />}
    {screen === 'tenders' && <Tenders />}
    {screen === 'builder' && <Builder key={`${serviceId}:${service?.version ?? 0}`} />}
    {screen === 'actions' && <Actions />}
    {screen === 'metrics' && <Metrics />}
    {screen === 'how' && <How />}
    <p className="disc" style={{ marginTop: 'var(--s10)' }}>Scores are priorities computed by a deterministic, versioned formula from public evidence — not purchase probabilities. Every decision includes a source link for human verification. Company-level data only; no person is profiled.{view.mode === 'demo' ? ' Demo data: fictional companies are labelled synthetic; reference-pack and seed companies carry only public, dated statements.' : ''}</p>
    {settings && <Settings onClose={() => setSettings(false)} onSignOut={onSignOut} />}
  </div>;
}

const THEME_KEY = 'leadradar.theme';
function useTheme() { useEffect(() => { try { const t = localStorage.getItem(THEME_KEY); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch { /* ignore */ } }, []); }
function ThemeButton() {
  return <button className="ibtn" aria-label="Toggle light or dark theme" onClick={() => {
    const r = document.documentElement; const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const next = (r.dataset.theme || (dark ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark'; r.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  }}><Icon name="moon" /></button>;
}
