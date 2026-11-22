// Wrapped sharing settings. Safe to import from client components.
import { z } from "zod";

export const WrappedSettings = z.object({
  // Off by default: nothing is public until the creator turns it on.
  public: z.boolean(),
}).strict();
export type WrappedSettings = z.infer<typeof WrappedSettings>;

export const DEFAULT_WRAPPED_SETTINGS: WrappedSettings = { public: false };

export const wrappedPath = (username: string) => `/wrapped/${encodeURIComponent(username.toLowerCase())}`;
export const wrappedCardPath = (username?: string) => `/api/wrapped/card${username ? `?u=${encodeURIComponent(username.toLowerCase())}` : ""}`;
