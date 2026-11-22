// Shared by the popup and the background worker.

/**
 * Runs inside the page (via chrome.scripting) only when you click Save. Reads what is on screen:
 * titles, meta description, the profile header text, its links and visible posts. The server turns this
 * into profile fields and drops the raw text. Must be self-contained: no outside variables.
 */
export function readPage() {
  const meta = (sel) => document.querySelector(sel)?.getAttribute("content")?.trim() || undefined;
  const clip = (s, n) => (s ? s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n) : undefined);
  const host = location.hostname.replace(/^www\./, "");
  const pick = (...sels) => sels.map((s) => document.querySelector(s)).find(Boolean);

  let root = document.body;
  let postSel = "";
  if (host.endsWith("instagram.com")) {
    root = pick("main header", "header", "main") || root;
    postSel = 'main a[href*="/p/"], main a[href*="/reel/"]';
  } else if (host.endsWith("youtube.com")) {
    root = pick("#page-header", "ytd-c4-tabbed-header-renderer", "#channel-header", "#owner") || root;
    postSel = "a#video-title-link, a#video-title";
  } else if (host === "x.com" || host === "twitter.com") {
    root = pick('[data-testid="primaryColumn"]') || root;
    postSel = 'article a[href*="/status/"]:has(time)';
  } else if (host.endsWith("linkedin.com")) {
    root = pick("main section", "main") || root;
  }

  const links = [...new Set([...root.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => /^https?:/.test(h)))].slice(0, 60);
  const posts = [];
  const seen = new Set();
  for (const a of postSel ? document.querySelectorAll(postSel) : []) {
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    const caption = a.querySelector("img")?.alt || a.getAttribute("title") || a.closest("article")?.querySelector('[data-testid="tweetText"]')?.innerText || a.innerText;
    posts.push({ url: a.href, caption: clip(caption, 2000) });
    if (posts.length >= 30) break;
  }

  return {
    url: location.href,
    title: clip(document.title, 500),
    ogTitle: clip(meta('meta[property="og:title"]'), 500),
    description: clip(meta('meta[property="og:description"]') || meta('meta[name="description"]'), 2000),
    text: clip(root.innerText, 6000),
    links,
    posts,
  };
}

export async function getSettings() {
  const { server = "", token = "" } = await chrome.storage.local.get(["server", "token"]);
  return { server, token };
}

/** Cleans the server address and asks Chrome for access to it if it's not localhost or *.hosted.app. */
export async function saveSettings(serverRaw, token) {
  const server = new URL(serverRaw.trim()).origin;
  const known = /^http:\/\/localhost(:\d+)?$/.test(server) || /^https:\/\/[^/]+\.hosted\.app$/.test(server);
  if (!known && !(await chrome.permissions.request({ origins: [`${server}/*`] }))) {
    throw new Error("Chrome needs permission to reach your server.");
  }
  await chrome.storage.local.set({ server, token: token.trim() });
  return { server, token: token.trim() };
}

/** Sends a page (or just a link) to the dashboard. Returns the server's JSON or throws with its message. */
export async function sendCapture(settings, payload) {
  if (!settings.server || !settings.token) throw new Error("Add your server and key in Settings first.");
  let res;
  try {
    res = await fetch(`${settings.server}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Couldn't reach your server. Is it running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
  return data;
}

export const personUrl = (server, id) => `${server}/admin/people/${encodeURIComponent(id)}`;
