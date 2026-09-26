import { createHash } from 'node:crypto';
import { failure, AppError } from '../../../../server/store';
import { queue, QUEUES } from '../../../../server/queue';
import { verifySignature, inboundNoticeSchema, webhookConfig } from '../../../../server/webhook';
export const dynamic = 'force-dynamic';

/**
 * Machine-to-machine endpoint for tender alerts (no browser session, no Origin header).
 * Verified notices are queued for the worker, which imports them into the configured workspace and triages them.
 */
export async function POST(request: Request) {
  try {
    const config = webhookConfig();
    const raw = await request.text(); if (raw.length > 60000) throw new AppError(413, 'Notice exceeds 60 KB');
    verifySignature(config.secret, request.headers.get('x-leadradar-timestamp'), raw, request.headers.get('x-leadradar-signature'));
    let parsed: unknown; try { parsed = JSON.parse(raw); } catch { throw new AppError(400, 'Invalid JSON object'); }
    const notice = inboundNoticeSchema.parse(parsed);
    // Deterministic job id: the same notice delivered twice is processed once.
    const id = createHash('sha256').update(`${config.tenant}:${notice.messageId ?? ''}:${notice.text}`).digest('hex').slice(0, 32);
    const boss = await queue();
    await boss.send(QUEUES.tenderInbound, { tenant: config.tenant, user: config.user, id, notice: { text: notice.text, source: notice.source, subject: notice.subject, sourceUrl: notice.sourceUrl } }, { singletonKey: `${config.tenant}:inbound:${id}` });
    return Response.json({ accepted: true, id }, { status: 202 });
  } catch (e) { return failure(e); }
}
