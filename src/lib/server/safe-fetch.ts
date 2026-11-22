// Fetches a public web page for research, safely: only http(s), only public IP addresses (checked on every
// redirect), a time limit and a size limit. Stops our server being used to reach internal addresses.
import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_NAME = /^localhost$|\.(internal|local|localhost)$/i;

/** True for loopback, private, link-local, carrier-grade NAT, multicast and other non-public addresses. */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19));
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return s === "::" || s === "::1" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s) || /^ff/.test(s);
  }
  return true;
}

async function isPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (BLOCKED_NAME.test(host)) return false;
  if (isIP(host)) return !isPrivateIp(host);
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

export type FetchedPage = { url: string; html: string };

export async function fetchPublicPage(
  rawUrl: string,
  opts: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
): Promise<FetchedPage | null> {
  const { timeoutMs = 8000, maxBytes = 600_000, maxRedirects = 3 } = opts;
  const signal = AbortSignal.timeout(timeoutMs);
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      if (!(await isPublicHost(url.hostname))) return null;
      const res = await fetch(url, {
        redirect: "manual",
        signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DealDostBot/1.0)", Accept: "text/html,application/xhtml+xml" },
      });
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get("location");
        if (!next) return null;
        url = new URL(next, url);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html") || !res.body) return null;

      // Read at most maxBytes.
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      await reader.cancel().catch(() => {});
      return { url: url.toString(), html: new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes)) };
    }
    return null;
  } catch (e) {
    console.warn("[safe-fetch] failed:", url.hostname, e instanceof Error ? e.message : e);
    return null;
  }
}
