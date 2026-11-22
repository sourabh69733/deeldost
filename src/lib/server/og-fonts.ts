// Fonts for generated images (next/og). Files live in the repo; list each image route in
// next.config.mjs outputFileTracingIncludes so the fonts ship with the deployed server.
// Hind's Devanagari file has the ₹ sign.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fontDir = join(process.cwd(), "src/assets/fonts");

export const ogFonts = Promise.all([
  readFile(join(fontDir, "hind-latin-400-normal.woff")),
  readFile(join(fontDir, "hind-latin-600-normal.woff")),
  readFile(join(fontDir, "hind-devanagari-600-normal.woff")),
  readFile(join(fontDir, "bricolage-grotesque-latin-800-normal.woff")),
]).then(([regular, semibold, rupee, display]) => [
  { name: "Hind", data: regular, weight: 400 as const },
  { name: "Hind", data: semibold, weight: 600 as const },
  { name: "HindRupee", data: rupee, weight: 600 as const },
  { name: "Bricolage", data: display, weight: 800 as const },
]);
