import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertOrigin, body, context, failure, publicDb, AppError, mutate } from '../../../server/store';
import { seedWorkspace } from '../../../domain/fixtures';
import { rateLimit, clientKey } from '../../../server/ratelimit';

/**
 * Sessions.
 *   demo    -> isolated local demo tenant (httpOnly cookie), never a fallback for authenticated users
 *   login   -> Supabase password sign-in; returns the access token, refresh token and memberships
 *   refresh -> exchanges a refresh token for a new access token
 *   create  -> new workspace via RPC (the caller becomes admin); empty, labelled live
 *   logout  -> clears the demo cookie (Supabase tokens are dropped by the client)
 *   GET     -> session status for the UI: always 200, never reveals why a session is absent
 */
export async function GET(request: Request) {
  try { const ctx = await context(request); return Response.json({ signedIn: true, mode: ctx.mode, role: ctx.role }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ signedIn: false, demoAvailable: process.env.LEADRADAR_DISABLE_DEMO !== 'true' }, { headers: { 'Cache-Control': 'no-store' } }); }
}

const schema = z.object({ action: z.enum(['demo', 'login', 'refresh', 'create', 'logout']), email: z.string().email().optional(), password: z.string().max(200).optional(), refreshToken: z.string().max(2000).optional(), name: z.string().min(2).max(100).optional() });

export async function POST(request: Request) {
  try {
    assertOrigin(request); const p = schema.parse(await body(request));
    if (p.action === 'demo') {
      if (process.env.LEADRADAR_DISABLE_DEMO === 'true') throw new AppError(403, 'Demo disabled');
      rateLimit(`demo:${clientKey(request)}`, 30, 60000);
      const tenant = randomBytes(32).toString('hex');
      await mutate({ tenant, user: 'demo-user', role: 'admin', mode: 'demo' }, () => null);
      const r = NextResponse.json({ mode: 'demo' }); r.cookies.set('lr_demo', tenant, { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: 604800 }); return r;
    }
    if (p.action === 'logout') { const r = NextResponse.json({ ok: true }); r.cookies.delete('lr_demo'); return r; }
    if (p.action === 'login') {
      rateLimit(`login:${clientKey(request)}`, 5, 60000);
      const db = publicDb(); const { data, error } = await db.auth.signInWithPassword({ email: p.email ?? '', password: p.password ?? '' });
      if (error || !data.session) throw new AppError(401, 'Sign-in failed. Check the account credentials.');
      const userDb = publicDb(data.session.access_token); const membership = await userDb.from('lr_memberships').select('tenant_id,role');
      if (membership.error) throw new AppError(503, 'Workspace schema unavailable');
      return Response.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: data.session.expires_at ?? null, memberships: membership.data, mode: 'live' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (p.action === 'refresh') {
      rateLimit(`refresh:${clientKey(request)}`, 30, 60000);
      if (!p.refreshToken) throw new AppError(400, 'Refresh token required');
      const { data, error } = await publicDb().auth.refreshSession({ refresh_token: p.refreshToken });
      if (error || !data.session) throw new AppError(401, 'Session expired; please sign in again');
      return Response.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: data.session.expires_at ?? null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const token = request.headers.get('authorization')?.replace(/^Bearer /, ''); if (!token) throw new AppError(401, 'Sign in first');
    const db = publicDb(token); const { data, error } = await db.rpc('lr_create_workspace', { workspace_name: p.name ?? 'LeadRadar workspace', initial_state: seedWorkspace(false) });
    if (error) throw new AppError(400, 'Could not create workspace; verify membership limit and authentication');
    return Response.json({ tenant: data });
  } catch (e) { return failure(e); }
}
