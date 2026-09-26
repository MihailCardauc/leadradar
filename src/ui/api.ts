'use client';
import type { Workspace } from '../domain/model';
import type { priorities, summary } from '../server/service';

/**
 * Browser client for the LeadRadar API (docs/api.md). Demo sessions use the httpOnly `lr_demo` cookie; live sessions
 * send the Supabase access token + workspace id. The token lives in sessionStorage only (cleared with the tab) and is
 * refreshed once on 401. No other credential is ever handled in the browser.
 */
export type PriorityRow = ReturnType<typeof priorities>[number];
export type Summary = ReturnType<typeof summary>;
export type WorkspaceView = { state: Workspace; mode: 'demo' | 'live'; role: 'admin' | 'sales'; integrations: Record<string, string>; priorities: PriorityRow[]; summary: Summary; commands: string[] };
export type Membership = { tenant_id: string; role: 'admin' | 'sales' };
export type LiveSession = { token: string; refreshToken: string; tenant: string; email: string };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

const KEY = 'leadradar.session';
export const session = {
  get(): LiveSession | null { try { const raw = sessionStorage.getItem(KEY); return raw ? JSON.parse(raw) as LiveSession : null; } catch { return null; } },
  set(s: LiveSession | null) { try { if (s) sessionStorage.setItem(KEY, JSON.stringify(s)); else sessionStorage.removeItem(KEY); } catch { /* storage unavailable: session lasts for this page only */ } },
};

async function refreshToken(s: LiveSession): Promise<LiveSession | null> {
  const r = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh', refreshToken: s.refreshToken }) });
  if (!r.ok) return null;
  const j = await r.json() as { token: string; refreshToken: string };
  const next = { ...s, token: j.token, refreshToken: j.refreshToken }; session.set(next); return next;
}

export async function api<T = unknown>(path: string, body?: unknown, init: { method?: string; retried?: boolean } = {}): Promise<T> {
  const live = session.get();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (live) { headers.Authorization = `Bearer ${live.token}`; headers['x-tenant-id'] = live.tenant; }
  const response = await fetch(path, { method: init.method ?? (body === undefined ? 'GET' : 'POST'), headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'same-origin' });
  if (response.status === 401 && live && !init.retried) { const next = await refreshToken(live); if (next) return api<T>(path, body, { ...init, retried: true }); session.set(null); }
  const text = await response.text();
  let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) throw new ApiError(response.status, (data as { error?: string } | null)?.error ?? `Request failed (${response.status})`);
  return data as T;
}

export const loadWorkspace = (serviceId?: string) => api<WorkspaceView>(`/api/workspace${serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ''}`);
/** Runs a command (mutation or read-only query) and returns its `result`. */
export async function command<T = unknown>(type: string, payload?: unknown): Promise<T> {
  const r = await api<{ result?: T } & Record<string, unknown>>('/api/workspace', { type, payload });
  return (type === 'simulate' ? r : r.result) as T;
}

export async function startDemo() { session.set(null); await api('/api/session', { action: 'demo' }); }
export async function signIn(email: string, password: string) {
  session.set(null);
  const r = await api<{ token: string; refreshToken: string; memberships: Membership[] }>('/api/session', { action: 'login', email, password });
  return r;
}
export async function createWorkspace(token: string, name: string) {
  const r = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'create', name }) });
  const j = await r.json() as { tenant?: string; error?: string };
  if (!r.ok || !j.tenant) throw new ApiError(r.status, j.error ?? 'Could not create workspace');
  return j.tenant;
}
export async function signOut() { session.set(null); await api('/api/session', { action: 'logout' }).catch(() => null); }
