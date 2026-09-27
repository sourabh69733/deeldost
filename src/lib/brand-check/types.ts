// Shared brand check types. Safe to import from client components.
import type { DomainResult } from "./domain-check";
import type { Flag, Risk } from "./red-flags";
import type { PayCheck } from "./pay-check";

export type { DomainResult, Flag, Risk, PayCheck };

export type BrandCheckResult = {
  /** As entered, or read from the screenshot. */
  brandName: string;
  risk: Risk;
  flags: Flag[];
  domain: DomainResult | null;
  aiReasons: string[];
  questions: string[];
  aiError: string | null;
  /** Rupee amount the brand offered, if we found one. */
  offeredAmount: number | null;
  /** Fair-pay comparison. Null when no amount was found or the creator gave no numbers. */
  payCheck: PayCheck | null;
  /** Text Claude read from the uploaded screenshot, shown so the creator can verify it. */
  readFromScreenshot: string | null;
};
