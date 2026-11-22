// Right-click menu: save a link (without opening it) or the current page.
import { getSettings, readPage, sendCapture } from "./lib.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "save-link", title: "Save link to DealDost", contexts: ["link"] });
  chrome.contextMenus.create({ id: "save-page", title: "Save this page to DealDost", contexts: ["page"] });
});

async function badge(tabId, ok) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color: ok ? "#1f9d55" : "#c8372d" });
  await chrome.action.setBadgeText({ tabId, text: ok ? "✓" : "!" });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 3000);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id;
  try {
    const settings = await getSettings();
    let payload;
    if (info.menuItemId === "save-link") {
      payload = { url: info.linkUrl };
    } else {
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: readPage });
      payload = result;
    }
    await sendCapture(settings, payload);
    if (tabId) await badge(tabId, true);
  } catch (e) {
    console.warn("[DealDost]", e.message);
    if (tabId) await badge(tabId, false);
  }
});
