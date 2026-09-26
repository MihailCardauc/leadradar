import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AppError } from './store';

/**
 * Signed inbound notices (tender alert emails forwarded by a mail provider or SEAP/MTender/TED alert relays).
 * Signature: hex HMAC-SHA256 of `${timestamp}.${rawBody}` with TENDER_WEBHOOK_SECRET, sent as
 * `x-leadradar-timestamp` (unix seconds) and `x-leadradar-signature`. Replays older than 5 minutes are refused.
 * The notice text is untrusted data: it is parsed deterministically and triaged by a guarded model, never executed.
 */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export function sign(secret: string, timestamp: string, rawBody: string) {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verifySignature(secret: string, timestamp: string | null, rawBody: string, signature: string | null, nowMs = Date.now()) {
  if (!timestamp || !signature || !/^\d{9,11}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) throw new AppError(401, 'Missing or malformed signature');
  if (Math.abs(nowMs / 1000 - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS) throw new AppError(401, 'Signature timestamp outside the allowed window');
  const expected = Buffer.from(sign(secret, timestamp, rawBody), 'hex'), given = Buffer.from(signature, 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw new AppError(401, 'Invalid signature');
}

export const inboundNoticeSchema = z.object({
  source: z.enum(['seap', 'mtender', 'ted', 'email', 'manual']).default('email'),
  subject: z.string().max(300).optional(),
  text: z.string().min(20).max(20000),
  sourceUrl: z.string().url().max(500).optional(),
  messageId: z.string().max(200).optional(),
});

export type WebhookConfig = { secret: string; tenant: string; user: string };
/** All three settings must be present; the tenant/user pair is re-checked as an admin membership by the worker. */
export function webhookConfig(env: Record<string, string | undefined> = process.env): WebhookConfig {
  const secret = env.TENDER_WEBHOOK_SECRET ?? '', tenant = env.TENDER_WEBHOOK_TENANT_ID ?? '', user = env.TENDER_WEBHOOK_USER_ID ?? '';
  if (secret.length < 32 || !tenant || !user) throw new AppError(503, 'Inbound tender webhook is not configured');
  return { secret, tenant, user };
}
