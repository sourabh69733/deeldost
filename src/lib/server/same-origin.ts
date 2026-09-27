// CSRF guard for routes that change account state: the request must come from our own pages.
// Browsers always send Origin on cross-site POST/DELETE, so a mismatch means another site sent it.
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
