// Shared brand check types. Safe to import from client components.
import type { DomainResult } from "./domain-check";
import type { Flag, Risk } from "./red-flags";

export type { DomainResult, Flag, Risk };

export type BrandCheckResult = {
  risk: Risk;
  flags: Flag[];
  domain: DomainResult | null;
  aiReasons: string[];
  questions: string[];
  aiError: string | null;
};
