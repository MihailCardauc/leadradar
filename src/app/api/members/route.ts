import { z } from 'zod';
import { context, failure, assertOrigin, body, requireAdmin, AppError, mutate } from '../../../server/store';
import { audit } from '../../../server/service';
export const dynamic = 'force-dynamic';

/**
 * Workspace membership (live mode only; enforced in SQL by security-definer RPCs, migration 0004).
 * GET lists members; POST { action: 'add', email, role } or { action: 'remove', userId }. No invitation email is sent.
 */
export async function GET(request: Request) {
  try {
    const ctx = await context(request);
    if (ctx.mode !== 'live') return Response.json({ members: [{ userId: ctx.user, email: null, role: ctx.role }], mode: 'demo' }, { headers: { 'Cache-Control': 'no-store' } });
    const { data, error } = await ctx.db!.rpc('lr_list_members', { workspace_id: ctx.tenant });
    if (error) throw new AppError(503, 'Membership list unavailable; apply migration 0004');
    return Response.json({ members: (data as { user_id: string; email: string; role: string }[]).map(m => ({ userId: m.user_id, email: m.email, role: m.role })), mode: 'live' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), email: z.string().email().max(200), role: z.enum(['admin', 'sales']) }),
  z.object({ action: z.literal('remove'), userId: z.string().uuid() }),
]);
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    if (ctx.mode !== 'live') throw new AppError(400, 'Members are managed in authenticated workspaces');
    const p = schema.parse(await body(request));
    const { data, error } = p.action === 'add'
      ? await ctx.db!.rpc('lr_add_member', { workspace_id: ctx.tenant, member_email: p.email, member_role: p.role })
      : await ctx.db!.rpc('lr_remove_member', { workspace_id: ctx.tenant, member: p.userId });
    if (error) throw new AppError(409, /sign up first|administrator|limit/i.test(error.message) ? error.message : 'Membership change refused');
    await mutate(ctx, w => audit(w, ctx, `member.${p.action === 'add' ? 'added' : 'removed'}`, p.action === 'add' ? `${p.role} membership for an existing account` : `user ${p.userId}`));
    return Response.json({ ok: true, userId: p.action === 'add' ? data : p.userId });
  } catch (e) { return failure(e); }
}
