// Shared brand check types. Safe to import from client components.
import type { DomainResult } from "./domain-check";
import type { Flag, Risk } from "./red-flags";

export type { DomainResult, Flag, Risk };

export type BrandCheckResult = {
  /** As entered, or read from the screenshot. */
  brandName: string;
  risk: Risk;
  flags: Flag[];
  domain: DomainResult | null;
  aiReasons: string[];
  questions: string[];
  aiError: string | null;
  /** Text Claude read from the uploaded screenshot, shown so the creator can verify it. */
  readFromScreenshot: string | null;
};
