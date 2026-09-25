import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { seedWorkspace } from '../domain/fixtures';
import type { Workspace } from '../domain/model';

export class AppError extends Error { constructor(public status: number, message: string) { super(message); } }
export type Context = { tenant: string; user: string; role: 'admin' | 'sales'; mode: 'demo' | 'live'; db?: SupabaseClient };
export function publicDb(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AppError(503, 'Supabase runtime configuration is missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined });
}
export async function context(request: Request): Promise<Context> {
  const auth = request.headers.get('authorization');
  if (auth) {
    if (!auth.startsWith('Bearer ')) throw new AppError(401, 'Invalid authentication');
    const db = publicDb(auth.slice(7)); const { data, error } = await db.auth.getUser(auth.slice(7));
    if (error || !data.user) throw new AppError(401, 'Session expired; please sign in again');
    const tenant = request.headers.get('x-tenant-id');
    if (!tenant) throw new AppError(400, 'Select a workspace');
    const membership = await db.from('lr_memberships').select('role').eq('tenant_id', tenant).eq('user_id', data.user.id).single();
    if (membership.error || !membership.data) throw new AppError(403, 'Workspace access denied');
    return { tenant, user: data.user.id, role: membership.data.role, mode: 'live', db };
  }
  // The isolated demo is available only when explicitly requested, and is never a live fallback.
  if (process.env.LEADRADAR_DISABLE_DEMO === 'true') throw new AppError(401, 'Sign in required');
  const cookie = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith('lr_demo='))?.slice(8);
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) throw new AppError(401, 'Open a demo workspace or sign in');
  return { tenant: cookie, user: 'demo-user', role: 'admin', mode: 'demo' };
}
export function requireAdmin(ctx: Context) { if (ctx.role !== 'admin') throw new AppError(403, 'Administrator access required'); }
function path(tenant: string) {
  if (!/^[a-f0-9]{64}$/.test(tenant)) throw new AppError(403, 'Invalid demo workspace');
  return join(process.env.LEADRADAR_DATA_DIR || join(process.cwd(), '.leadradar'), `${tenant}.json`);
}
export async function load(ctx: Context): Promise<Workspace> {
  if (ctx.mode === 'live') {
    const { data, error } = await ctx.db!.from('lr_workspaces').select('state,revision').eq('id', ctx.tenant).single();
    if (error || !data) throw new AppError(403, 'Workspace unavailable');
    return { ...data.state, revision: data.revision } as Workspace;
  }
  try { return JSON.parse(await readFile(path(ctx.tenant), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; return seedWorkspace(); }
}
const locks = new Map<string, Promise<unknown>>();
export async function mutate<T>(ctx: Context, fn: (w: Workspace) => T | Promise<T>): Promise<{ state: Workspace; result: T }> {
  const previous = locks.get(ctx.tenant) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    const state = await load(ctx); const revision = state.revision;
    const result = await fn(state); state.revision++;
    if (ctx.mode === 'live') {
      const { error } = await ctx.db!.rpc('lr_save_workspace', { workspace_id: ctx.tenant, expected_revision: revision, new_state: state });
      if (error) throw new AppError(409, 'Workspace changed or access denied. Refresh and retry.');
    } else {
      const target = path(ctx.tenant); await mkdir(join(target, '..'), { recursive: true });
      const temp = `${target}.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(state), 'utf8'); await rename(temp, target);
    }
    return { state, result };
  });
  locks.set(ctx.tenant, operation);
  try { return await operation; } finally { if (locks.get(ctx.tenant) === operation) locks.delete(ctx.tenant); }
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) throw new AppError(403, 'Same-origin request required');
  const parsed = new URL(origin);
  const configured = new URL(process.env.APP_BASE_URL || 'http://localhost:3000');
  const trusted = origin === configured.origin || (['localhost','127.0.0.1'].includes(parsed.hostname) && parsed.protocol === 'http:');
  if (!trusted || parsed.host !== (request.headers.get('host') || new URL(request.url).host)) throw new AppError(403, 'Same-origin request required');
}
export async function body(request: Request) {
  const text = await request.text(); if (text.length > 300000) throw new AppError(413, 'Request exceeds 300 KB');
  try { return JSON.parse(text); } catch { throw new AppError(400, 'Invalid JSON'); }
}
export function failure(error: unknown) {
  if (error instanceof AppError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.name === 'ZodError') return Response.json({ error: 'Invalid input. Check field values and required weights.' }, { status: 400 });
  console.error('LeadRadar request failed', error instanceof Error ? error.name : 'unknown');
  return Response.json({ error: 'The operation failed. No success has been assumed; refresh and retry.' }, { status: 500 });
}
