// What the brand check API accepts. Shared by the route and tests.
import { z } from "zod";

// ~5 MB of image after base64. The client compresses screenshots well below this.
const MAX_SCREENSHOT_BASE64 = 7_000_000;

export const Screenshot = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(100).max(MAX_SCREENSHOT_BASE64, "Screenshot is too large. Try a smaller one."),
});
export type Screenshot = z.infer<typeof Screenshot>;

export const BrandCheckInput = z
  .object({
    brandName: z.string().trim().max(120).default(""),
    website: z.string().trim().max(300).default(""),
    instagram: z.string().trim().max(100).default(""),
    message: z.string().trim().max(8000).default(""),
    screenshot: Screenshot.optional(),
  })
  .superRefine((v, ctx) => {
    // With a screenshot we can read the message and brand name from the image.
    if (v.screenshot) return;
    if (!v.brandName) ctx.addIssue({ code: "custom", path: ["brandName"], message: "Enter the brand name" });
    if (v.message.length < 20) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Paste the full message, or upload a screenshot" });
    }
  });
export type BrandCheckInput = z.infer<typeof BrandCheckInput>;
