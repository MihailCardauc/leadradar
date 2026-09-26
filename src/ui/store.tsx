'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, api, command, loadWorkspace, type WorkspaceView } from './api';

/**
 * App state: the workspace read model for the selected service, command execution with refresh and toasts,
 * background-job polling and screen navigation. One source of truth: after any mutation the read model is reloaded.
 */
export type Screen = 'radar' | 'companies' | 'tenders' | 'builder' | 'actions' | 'metrics' | 'how';
export const SCREENS: [Screen, string][] = [['radar', 'Radar'], ['companies', 'Companies'], ['tenders', 'Tenders'], ['builder', 'Signal Builder'], ['actions', 'Actions'], ['metrics', 'Metrics'], ['how', 'How it works']];

type Ctx = {
  view: WorkspaceView; serviceId: string; setServiceId: (id: string) => void; isAdmin: boolean;
  screen: Screen; go: (s: Screen) => void;
  selectedCompany: string | null; openCompany: (id: string | null) => void;
  selectedDecision: string | null; openDecision: (id: string | null) => void;
  refresh: () => Promise<void>;
  /** Runs a command, reloads the read model, toasts success; errors are toasted and re-thrown as null. */
  run: <T = unknown>(type: string, payload: unknown, success?: string | ((r: T) => string)) => Promise<T | null>;
  query: <T = unknown>(type: string, payload: unknown) => Promise<T | null>;
  call: <T = unknown>(path: string, body: unknown, success?: string) => Promise<T | null>;
  toast: (msg: string) => void; busy: boolean;
};
const AppContext = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(AppContext); if (!c) throw new Error('useApp outside provider'); return c; };

const SVC_KEY = 'leadradar.service';
export function AppProvider({ initial, onSignedOut, children }: { initial: WorkspaceView; onSignedOut: () => void; children: ReactNode }) {
  const [view, setView] = useState(initial);
  const [serviceId, setSvc] = useState(() => {
    let stored: string | null = null; try { stored = localStorage.getItem(SVC_KEY); } catch { /* ignore */ }
    const ids = initial.state.services.map(s => s.id);
    return stored && ids.includes(stored) ? stored : ids.includes('scut-nis2') ? 'scut-nis2' : ids[0] ?? '';
  });
  const [screen, setScreen] = useState<Screen>(() => { const h = typeof location === 'undefined' ? '' : location.hash.slice(1); return (SCREENS.find(([k]) => k === h)?.[0]) ?? 'radar'; });
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((m: string) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 3200); }, []);
  const handle = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) { onSignedOut(); return; }
    toast(e instanceof Error ? e.message : 'Something went wrong; nothing was assumed to succeed.');
  }, [onSignedOut, toast]);
  const refresh = useCallback(async () => { try { setView(await loadWorkspace(serviceId)); } catch (e) { handle(e); } }, [serviceId, handle]);

  const run = useCallback(async <T,>(type: string, payload: unknown, success?: string | ((r: T) => string)) => {
    setBusy(true);
    try { const r = await command<T>(type, payload); await refresh(); if (success) toast(typeof success === 'function' ? success(r) : success); return r; }
    catch (e) { handle(e); return null; } finally { setBusy(false); }
  }, [refresh, toast, handle]);
  const query = useCallback(async <T,>(type: string, payload: unknown) => { try { return await command<T>(type, payload); } catch (e) { handle(e); return null; } }, [handle]);
  const call = useCallback(async <T,>(path: string, body: unknown, success?: string) => {
    setBusy(true);
    try { const r = await api<T>(path, body); await refresh(); if (success) toast(success); return r; }
    catch (e) { handle(e); return null; } finally { setBusy(false); }
  }, [refresh, toast, handle]);

  const setServiceId = useCallback((id: string) => { setSvc(id); try { localStorage.setItem(SVC_KEY, id); } catch { /* ignore */ } }, []);
  // Reload the per-service read model whenever the selected service changes.
  useEffect(() => { let live = true; loadWorkspace(serviceId).then(v => { if (live) setView(v); }, handle); return () => { live = false; }; }, [serviceId, handle]);

  // Hash navigation from the design (#radar, #tenders …).
  const go = useCallback((s: Screen) => { setScreen(s); try { history.replaceState(null, '', `#${s}`); } catch { /* ignore */ } window.scrollTo({ top: 0 }); }, []);

  // Research in progress: poll the lightweight jobs endpoint and reload when the aggregate revision moves.
  const pending = view.summary.jobs.queued + view.summary.jobs.running;
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(async () => {
      try { const j = await api<{ revision: number }>('/api/jobs'); if (j.revision !== view.state.revision) await refresh(); } catch { /* next tick */ }
    }, 4000);
    return () => clearInterval(id);
  }, [pending, view.state.revision, refresh]);

  // Selecting a record switches screen only when needed; the sheet scrolls itself into view.
  const openCompany = useCallback((id: string | null) => { setSelectedCompany(id); if (id && screen !== 'radar') go('radar'); }, [go, screen]);
  const openDecision = useCallback((id: string | null) => { setSelectedDecision(id); if (id && screen !== 'actions') go('actions'); }, [go, screen]);

  // The read model is always scoped to the selected service (the first load may carry every service's rows).
  const scoped = useMemo(() => ({ ...view, priorities: view.priorities.filter(r => r.serviceId === serviceId) }), [view, serviceId]);
  const isAdmin = view.role === 'admin';
  const value = useMemo<Ctx>(() => ({ view: scoped, serviceId, setServiceId, isAdmin, screen, go, selectedCompany, openCompany, selectedDecision, openDecision, refresh, run, query, call, toast, busy }),
    [scoped, isAdmin, serviceId, setServiceId, screen, go, selectedCompany, openCompany, selectedDecision, openDecision, refresh, run, query, call, toast, busy]);
  return <AppContext.Provider value={value}>{children}<div className="toast" role="status" aria-live="polite" hidden={!toastMsg}>{toastMsg}</div></AppContext.Provider>;
}
