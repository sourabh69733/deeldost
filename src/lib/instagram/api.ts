// Thin, typed client for the Instagram endpoints we use. Every response is validated with zod,
// so API changes fail loudly here instead of corrupting data.
import "server-only";
import { z } from "zod";
import { IG_GRAPH, IG_SCOPES, igAppConfig } from "./config";

export class InstagramApiError extends Error {
  constructor(message: string, readonly code?: number) { super(message); }
  /** Token expired or revoked: the user must reconnect. */
  get needsReconnect() { return this.code === 190; }
}

async function call<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = json.error ?? {};
    throw new InstagramApiError(err.message ?? json.error_message ?? `Instagram API ${res.status}`, err.code);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new InstagramApiError(`Unexpected Instagram response: ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

function requireConfig() {
  const cfg = igAppConfig();
  if (!cfg) throw new InstagramApiError("Instagram app is not configured");
  return cfg;
}

// ---- OAuth ----------------------------------------------------------------

export function authorizeUrl(state: string): string {
  const { appId, redirectUri } = requireConfig();
  const q = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, response_type: "code", scope: IG_SCOPES.join(","), state });
  return `https://www.instagram.com/oauth/authorize?${q}`;
}

const ShortToken = z.object({
  data: z.array(z.object({ access_token: z.string(), user_id: z.union([z.string(), z.number()]).transform(String), permissions: z.string().optional() })).min(1),
});

const LongToken = z.object({ access_token: z.string(), expires_in: z.number() });

/** Exchanges the OAuth code for a 60-day token. */
export async function exchangeCode(code: string): Promise<{ token: string; expiresAt: number; igUserId: string; permissions: string[] }> {
  const { appId, appSecret, redirectUri } = requireConfig();
  const short = await call("https://api.instagram.com/oauth/access_token", ShortToken, {
    method: "POST",
    body: new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: "authorization_code", redirect_uri: redirectUri, code }),
  });
  const first = short.data[0];
  const long = await call(
    `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: appSecret, access_token: first.access_token })}`,
    LongToken,
  );
  return {
    token: long.access_token,
    expiresAt: Date.now() + long.expires_in * 1000,
    igUserId: first.user_id,
    permissions: (first.permissions ?? "").split(",").filter(Boolean),
  };
}

/** Extends a long-lived token by another 60 days. Token must be at least 24 hours old. */
export async function refreshToken(token: string): Promise<{ token: string; expiresAt: number }> {
  const r = await call(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token })}`, LongToken);
  return { token: r.access_token, expiresAt: Date.now() + r.expires_in * 1000 };
}

// ---- Data -----------------------------------------------------------------

export const Profile = z.object({
  user_id: z.union([z.string(), z.number()]).transform(String),
  username: z.string(),
  name: z.string().optional(),
  account_type: z.string().optional(),
  profile_picture_url: z.string().optional(),
  followers_count: z.number().default(0),
  media_count: z.number().default(0),
});
export type Profile = z.infer<typeof Profile>;

export function getProfile(token: string): Promise<Profile> {
  const fields = "user_id,username,name,account_type,profile_picture_url,followers_count,media_count";
  return call(`${IG_GRAPH}/me?${new URLSearchParams({ fields, access_token: token })}`, Profile);
}

const Media = z.object({
  data: z.array(z.object({
    id: z.string(),
    media_product_type: z.string().optional(),
    timestamp: z.string().optional(),
    like_count: z.number().optional(),
    comments_count: z.number().optional(),
  })),
});
export type MediaItem = z.infer<typeof Media>["data"][number];

export async function getRecentMedia(token: string, limit = 50): Promise<MediaItem[]> {
  const fields = "id,media_product_type,timestamp,like_count,comments_count";
  return (await call(`${IG_GRAPH}/me/media?${new URLSearchParams({ fields, limit: String(limit), access_token: token })}`, Media)).data;
}

const MediaInsights = z.object({
  data: z.array(z.object({ name: z.string(), values: z.array(z.object({ value: z.number() })).optional(), total_value: z.object({ value: z.number() }).optional() })),
});

/** Views and reach for one post or reel. */
export async function getMediaInsights(token: string, mediaId: string): Promise<{ views: number | null; reach: number | null }> {
  const r = await call(`${IG_GRAPH}/${mediaId}/insights?${new URLSearchParams({ metric: "views,reach", access_token: token })}`, MediaInsights);
  const pick = (name: string) => {
    const m = r.data.find((d) => d.name === name);
    return m?.total_value?.value ?? m?.values?.[0]?.value ?? null;
  };
  return { views: pick("views"), reach: pick("reach") };
}

const Demographics = z.object({
  data: z.array(z.object({
    total_value: z.object({
      breakdowns: z.array(z.object({
        results: z.array(z.object({ dimension_values: z.array(z.string()), value: z.number() })).default([]),
      })).default([]),
    }).optional(),
  })),
});

export type Breakdown = "city" | "country" | "age" | "gender";

/** Follower counts by one dimension, e.g. [["Mumbai, Maharashtra", 1200], ...]. Needs 100+ followers. */
export async function getFollowerDemographics(token: string, breakdown: Breakdown): Promise<[string, number][]> {
  const q = new URLSearchParams({ metric: "follower_demographics", period: "lifetime", metric_type: "total_value", breakdown, access_token: token });
  const r = await call(`${IG_GRAPH}/me/insights?${q}`, Demographics);
  const results = r.data[0]?.total_value?.breakdowns[0]?.results ?? [];
  return results.map((x) => [x.dimension_values.at(-1) ?? "", x.value]);
}
