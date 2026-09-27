// Browser only: count a usage event. Never blocks the UI and never throws.
import type { ClientEvent } from "./events";

export function track(event: ClientEvent): void {
  try {
    const body = JSON.stringify({ event });
    if (!navigator.sendBeacon?.("/api/event", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/event", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* counting is best-effort */
  }
}
