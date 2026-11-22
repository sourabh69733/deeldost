import { getSettings, personUrl, readPage, saveSettings, sendCapture } from "./lib.js";

const $ = (id) => document.getElementById(id);
const msg = (text, isError = false, link) => {
  const el = $("msg");
  el.className = isError ? "error" : "";
  el.textContent = text;
  if (link) {
    const a = Object.assign(document.createElement("a"), { href: link, target: "_blank", textContent: " Open in dashboard" });
    el.append(a);
  }
};

let settings = await getSettings();
let page = null;

function showSettings(show) {
  $("settings").hidden = !show;
  $("main").hidden = show;
  $("server").value = settings.server;
  $("token").value = settings.token;
}

$("toggle-settings").onclick = () => showSettings($("settings").hidden);

$("save-settings").onclick = async () => {
  try {
    settings = await saveSettings($("server").value, $("token").value);
    msg("Settings saved.");
    showSettings(false);
  } catch (e) {
    msg(e.message || "Check the server address.", true);
  }
};

// Read the open tab. Chrome blocks this on its own pages (chrome://, the Web Store).
async function load() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const card = $("preview");
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readPage });
    page = result;
    const host = new URL(page.url).hostname.replace(/^www\./, "");
    const count = (page.text || page.description || "").match(/[\d.,]+\s*[KMBkmb]?\s*(followers|subscribers)/i)?.[0];
    card.innerHTML = "";
    const name = Object.assign(document.createElement("div"), { className: "name", textContent: page.ogTitle || page.title || host });
    const meta = Object.assign(document.createElement("div"), { className: "meta", textContent: [host + new URL(page.url).pathname, count].filter(Boolean).join(" · ") });
    card.append(name, meta);
    $("save").disabled = false;
  } catch {
    card.innerHTML = '<p class="muted">Can\'t read this page. Open a profile or website.</p>';
  }
}

$("save").onclick = async () => {
  $("save").disabled = true;
  msg("Saving…");
  try {
    const notes = $("notes").value.trim();
    const data = await sendCapture(settings, { ...page, ...(notes ? { notes } : {}) });
    msg(data.created ? "Saved." : "Updated.", false, personUrl(settings.server, data.id));
    $("notes").value = "";
  } catch (e) {
    msg(e.message, true);
  } finally {
    $("save").disabled = false;
  }
};

if (!settings.server || !settings.token) {
  showSettings(true);
  msg("Add your server and key to start.");
} else {
  showSettings(false);
}
load();
