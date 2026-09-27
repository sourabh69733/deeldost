// A creator's report of what a real deal paid. This is our calibration data for pricing-config.ts.
// Anonymous by design: numbers only, no name, handle or brand.
import { z } from "zod";
import { ADD_ONS, DELIVERABLES, NICHES, type AddOn, type Deliverable, type Niche } from "./config";

const keys = <T extends string>(o: Record<T, unknown>) => Object.keys(o) as [T, ...T[]];

export const DealReportInput = z
  .object({
    deliverable: z.enum(keys<Deliverable>(DELIVERABLES)),
    followers: z.number().int().positive().max(1e9),
    avgViews: z.number().int().positive().max(1e9),
    niche: z.enum(keys<Niche>(NICHES)),
    addOns: z.array(z.enum(keys<AddOn>(ADD_ONS))).max(4).default([]),
    paid: z.number().int().min(100, "Enter the amount in rupees").max(10_000_000, "That amount looks too high"),
  })
  .strict();
export type DealReportInput = z.infer<typeof DealReportInput>;
