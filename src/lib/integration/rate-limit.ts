/**
 * A simple fixed-window limit per token, in memory: each server instance counts on its own, so
 * on Vercel the real ceiling is a few times this. Enough to stop a CI loop gone wrong; not a
 * defense against abuse (the token itself is).
 */
export const RATE_LIMIT = { requests: 30, windowMs: 10 * 60 * 1000 };

const windows = new Map<string, { count: number; resetAt: number }>();

export function takeRequest(key: string, now: number) {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { ok: true as const };
  }
  if (current.count >= RATE_LIMIT.requests) {
    return { ok: false as const, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { ok: true as const };
}

/** Tests only: forget every window. */
export function resetRateLimits() {
  windows.clear();
}
