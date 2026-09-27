// Cookie-free usage counting. We only keep daily totals per event, nothing per person.
// Add new events here; anything not listed is rejected by /api/event.

export const CLIENT_EVENTS = [
  "view_home", "view_rate", "view_check", "view_other",
  "rate_calculated", "card_shared", "card_copied",
] as const;

export const SERVER_EVENTS = [
  "waitlist_join", "check_run", "check_screenshot", "check_limited", "deal_report",
] as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type ServerEvent = (typeof SERVER_EVENTS)[number];

/** Day key in India time, e.g. "2026-09-27". Metrics docs are keyed by this. */
export function dayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

export function viewEvent(pathname: string): ClientEvent {
  if (pathname === "/") return "view_home";
  if (pathname.startsWith("/rate")) return "view_rate";
  if (pathname.startsWith("/check")) return "view_check";
  return "view_other";
}
