import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertOrigin, body, failure, publicDb, AppError, mutate } from '../../../server/store';
import { seedWorkspace } from '../../../domain/fixtures';
export async function POST(request: Request) {
  try {
    assertOrigin(request); const p = z.object({ action: z.enum(['demo','login','create','logout']), email: z.string().email().optional(), password: z.string().max(200).optional(), name: z.string().min(2).max(100).optional() }).parse(await body(request));
    if (p.action === 'demo') {
      if (process.env.LEADRADAR_DISABLE_DEMO === 'true') throw new AppError(403, 'Demo disabled');
      const tenant = randomBytes(32).toString('hex');
      await mutate({tenant,user:'demo-user',role:'admin',mode:'demo'},()=>null);
      const r = NextResponse.json({ mode: 'demo' }); r.cookies.set('lr_demo', tenant, { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: 604800 }); return r;
    }
    if (p.action === 'logout') { const r = NextResponse.json({ ok: true }); r.cookies.delete('lr_demo'); return r; }
    if (p.action === 'login') {
      const db = publicDb(); const { data, error } = await db.auth.signInWithPassword({ email: p.email ?? '', password: p.password ?? '' });
      if (error || !data.session) throw new AppError(401, 'Sign-in failed. Check the account credentials.');
      const userDb = publicDb(data.session.access_token); const membership = await userDb.from('lr_memberships').select('tenant_id,role');
      if (membership.error) throw new AppError(503, 'Workspace schema unavailable');
      return Response.json({ token: data.session.access_token, memberships: membership.data, mode: 'live' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const token = request.headers.get('authorization')?.replace(/^Bearer /, ''); if (!token) throw new AppError(401,'Sign in first');
    const db = publicDb(token); const { data, error } = await db.rpc('lr_create_workspace', { workspace_name: p.name ?? 'LeadRadar workspace', initial_state: seedWorkspace(false) });
    if (error) throw new AppError(400, 'Could not create workspace; verify membership limit and authentication');
    return Response.json({ tenant: data });
  } catch (e) { return failure(e); }
}
