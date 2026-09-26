export type DomainResult = {
  domain: string;
  reachable: boolean | null;
  https: boolean;
  ageDays: number | null;
  notes: string[];
};

// We fetch user-supplied hosts from our server, so only allow public domain names.
// Blocks raw IPs, localhost and internal names (e.g. the cloud metadata server).
const BLOCKED_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[.*\]|localhost)$|\.(internal|local|localhost)$/i;

export function extractDomain(url: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    if (!host.includes(".") || BLOCKED_HOST.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export async function checkDomain(website: string): Promise<DomainResult | null> {
  const domain = extractDomain(website);
  if (!domain) return null;
  const notes: string[] = [];
  const https = /^https:\/\//i.test(website) || !/^http:\/\//i.test(website);

  let reachable: boolean | null = null;
  try {
    const res = await fetch(`https://${domain}`, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(6000) });
    reachable = res.ok || res.status < 500;
  } catch {
    reachable = false;
    notes.push("The website did not load over HTTPS.");
  }

  // RDAP is the free, modern replacement for WHOIS.
  let ageDays: number | null = null;
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const reg = (data.events ?? []).find((e: { eventAction: string }) => e.eventAction === "registration");
      if (reg?.eventDate) ageDays = Math.floor((Date.now() - new Date(reg.eventDate).getTime()) / 86_400_000);
    }
  } catch {
    /* age unknown */
  }
  if (ageDays !== null && ageDays < 180) notes.push(`The website domain is only ${ageDays} days old. New domains are a common scam signal.`);

  return { domain, reachable, https, ageDays, notes };
}
