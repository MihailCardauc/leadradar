import { AppError } from './store';

/**
 * Fixed-window, in-process limiter for unauthenticated endpoints (sign-in, demo creation).
 * One Next.js process per deployment in the pilot; a shared store (Postgres/Redis) replaces it when scaled out.
 */
const windows = new Map<string, { start: number; count: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) { windows.set(key, { start: now, count: 1 }); prune(now, windowMs); return; }
  if (++w.count > limit) throw new AppError(429, 'Too many attempts; wait a minute and retry');
}
function prune(now: number, windowMs: number) { if (windows.size > 10000) for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k); }

/** Client address as seen by the first trusted proxy; falls back to a single shared bucket. */
export function clientKey(request: Request) {
  return (request.headers.get('x-forwarded-for')?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'local').trim().slice(0, 64);
}
