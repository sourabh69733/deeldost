// Instagram API with Instagram Login ("Business Login for Instagram") settings.
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
import "server-only";

export const IG_API_VERSION = process.env.IG_API_VERSION || "v25.0";
export const IG_GRAPH = `https://graph.instagram.com/${IG_API_VERSION}`;

// Phase 2 needs profile + insights. Comments and messages are added in Phase 3.
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"];

export function igAppConfig() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const appUrl = process.env.APP_URL;
  // Placeholders ("not-set", "REPLACE_WITH_...") mean the Meta app isn't set up yet.
  const missing = (v?: string) => !v || v === "not-set" || v.startsWith("REPLACE_WITH");
  if (missing(appId) || missing(appSecret) || missing(appUrl)) return null;
  return { appId: appId!, appSecret: appSecret!, redirectUri: `${appUrl!.replace(/\/$/, "")}/api/instagram/callback` };
}
