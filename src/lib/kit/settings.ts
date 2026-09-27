// Media kit settings. Safe to import from client components.
import { z } from "zod";
import { NICHES, type Niche } from "@/lib/pricing/config";

export const KitSettings = z.object({
  // Off by default: nothing about a creator is public until they turn this on.
  public: z.boolean(),
  niche: z.enum(Object.keys(NICHES) as [Niche, ...Niche[]]),
}).strict();
export type KitSettings = z.infer<typeof KitSettings>;

export const DEFAULT_KIT: KitSettings = { public: false, niche: "lifestyle" };

export const kitPath = (username: string) => `/kit/${encodeURIComponent(username.toLowerCase())}`;
