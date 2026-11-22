// This site's address as the browser sees it, for links we show to copy (e.g. personal page links).
import "server-only";
import { headers } from "next/headers";

export function requestOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0]}://${host}`;
}
