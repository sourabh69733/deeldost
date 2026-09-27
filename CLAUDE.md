# Notes for Claude Code

Read PROJECT.md first. It holds the goal, architecture, decisions and progress tracker.
When you finish a task, tick it in PROJECT.md section 7 (Progress) and add any new decision to section 8.

## Stack
Next.js 14 + TypeScript + Tailwind, on Google Cloud: Firebase App Hosting, Firestore, Claude via Vertex AI.
Node 22 (`nvm use`). No API keys; auth is Google Application Default Credentials.

## Where things live
- GCP clients (Firestore, Vertex): src/lib/server/gcp.ts
- Pricing numbers: src/lib/pricing/config.ts (tune here, not in UI)
- Pricing math: src/lib/pricing/calculate.ts
- Scam rules + risk score: src/lib/brand-check/red-flags.ts
- Domain check (RDAP): src/lib/brand-check/domain-check.ts
- Claude review: src/lib/brand-check/ai-review.ts
- Brand check pipeline: src/lib/brand-check/index.ts

## Rules
- Rules first, AI second: every feature works if AI fails
- AI calls and secrets server-side only
- Never store pasted messages or full emails
- If you change what data is collected or stored, update src/app/privacy/page.tsx and SITE.legalUpdated in src/lib/site.ts
- Never auto-send messages on the user's behalf
- Mobile-first, plain English, INR via src/lib/format.ts
- Logic in src/lib with a test next to it; pages and components stay thin
- Before finishing: `npm test && npm run typecheck && npm run lint`
- Commits: Conventional Commits (feat:, fix:, docs:, ...), one logical change each, no co-author lines
