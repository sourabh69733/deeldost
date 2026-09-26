# DealDost: Project Plan and Progress

The one file for direction and progress. Tick items in **section 7** as work lands.
Last updated: 2026-09-27

---

## 1. Goal

**DealDost helps Indian creators say yes to the right brand deals, at the right price.**

It reads a creator's Instagram comments and DMs, finds every brand offer, checks whether the brand is real,
tells them what to charge, and shows what their audience and deals are doing.

**Business model:** free tools (rate calculator, scam check) bring creators in.
The paid plan (₹299 to ₹499/month) connects Instagram and does all of it automatically.

### Success targets

| Stage | Outcome | Target |
|---|---|---|
| Free tools | Creators use a tool | 100+ in first month |
| | Join the waitlist | 30+ |
| | Say "I'd pay for this" | 10+ |
| | Report a real deal price (for calibration) | 50+ |
| Instagram connected | Creators connect their account | 50+ |
| Paid | Paying creators | 50 |

If the free-tool numbers don't happen, talk to creators before building the paid part.

---

## 2. Who it's for

Indian **Instagram** creators with **10K to 200K followers** who handle brand deals themselves (no manager).
Niches: fashion, beauty, tech, finance, food, fitness, lifestyle. Mostly on phones, English or Hinglish.

**Their problems**
- Don't know what to charge, so they undercharge or lose deals.
- Fake collab scams are common (pay a fee, buy first, share OTP, "DM @xyz for collab").
- Offers get lost among hundreds of comments and DMs, and payments get forgotten.
- No clear view of their own audience to show brands.

---

## 3. What we are building

Four modules. Each works on its own and feeds the others.

| # | Module | What it answers | Needs Instagram? |
|---|---|---|---|
| 1 | **Rate** | "What should I charge?" Low / fair / high in ₹, rate card, media kit | No (better with it) |
| 2 | **Brand check** | "Is this brand real, and is the pay fair?" | No (paste or screenshot) |
| 3 | **Inbox** | "Which comments and DMs matter?" Sorts everything, pulls out deals | Yes |
| 4 | **Insights** | "What is my audience saying, and how are my deals doing?" | Yes |

### 3.1 Comment categories
| Category | Use |
|---|---|
| Brand interest | Possible deal, goes to Inbox |
| Scam | Warn creator, suggest hiding |
| Audience question | Content ideas, buying intent |
| Fan / praise | Find superfans |
| Negative / hate | Review or hide |
| Spam / bot | Engagement quality score |

### 3.2 DM categories
Paid deal · Barter / gifting · Agency outreach · Payment follow-up · Fan · Spam / scam · Other.
Each deal becomes a card: brand, offer, deliverables, deadline, budget (if mentioned), risk, fair price.

### 3.3 Insights
- Real reach, views and audience (city, age, gender) from Instagram, used to price accurately
- Top audience questions and sentiment over time
- Which posts bring brand interest
- Engagement quality (real people vs bots)
- Deal pipeline: received, negotiating, confirmed, paid, late; total earnings
- Auto media kit to send to brands

### 3.4 Brand profile
For every brand that contacts a creator:
- **Real?** Domain age, website, brand's Instagram (followers, post history), scam signals, reports from other creators
- **Fair pay?** Offer vs creator's fair rate, and what similar creators were paid by this brand
- **Pays on time?** From other creators' deal history

Cross-creator data (reports, pay, payment speed) only works once many creators use DealDost.
Until then, brand profiles use public data and rules.

### 3.5 Not building (for now)
- Brand-side marketplace or agency tools
- Auto-sending any message or comment reply (**never**; we draft, creator sends)
- Scraping Instagram (breaks Meta terms, risks the creator's account). Official API only.
- Native apps (a fast mobile website first)

---

## 4. How Instagram access works

We use Meta's official **Instagram API with Instagram Login**.

| Data | Permission | Notes |
|---|---|---|
| Profile, media, reach, audience | `instagram_business_basic`, `instagram_business_manage_insights` | Easiest review, apply first |
| Comments (read, hide, reply) | `instagram_business_manage_comments` | Webhook on new comments |
| DMs (read, reply) | `instagram_business_manage_messages` | Webhook on new messages; old history is limited |

**Requirements**
- Creator has a **Creator or Business** Instagram account (free switch). Personal accounts can't connect.
- Meta **App Review** per permission: privacy policy, screen recording, test account.
- Meta **Business Verification**: needs a registered business (GST or company docs).
- Expect 2 to 6 weeks, maybe a rejection round.

**Until approved:** creators paste text or upload a **screenshot** of a DM, and Claude reads it.

---

## 5. Architecture

All on **Google Cloud**, one project, no API keys in code.

```
Phone browser ──> Firebase App Hosting (Next.js on Cloud Run)
                    ├─ /rate            pricing runs in browser
                    ├─ /check ─────────> /api/check-brand ──> rules → domain → Claude
                    ├─ /api/waitlist ──> Firestore
                    └─ /api/instagram/webhook   (Phase 3)
                                │
Instagram ──webhooks──> Cloud Run ──> Pub/Sub ──> worker
                                                  ├─ keyword filter (free, drops noise)
                                                  ├─ Claude: categorise + extract deal
                                                  ├─ brand check + fair price
                                                  └─ Firestore ──> dashboard, alerts
Cloud Scheduler ──> daily insights refresh, payment reminders
```

### Stack and why

| Need | Choice | Why |
|---|---|---|
| Web app | Next.js 14 + TypeScript + Tailwind | One codebase for UI and API |
| Hosting | Firebase App Hosting (Cloud Run) | Next.js native, git-push deploys, scales to zero |
| Database | Firestore | Serverless, free tier, JSON-shaped data |
| Queue | Pub/Sub | Absorbs comment spikes on viral posts |
| Jobs | Cloud Scheduler | Daily insights, reminders |
| Login | Firebase Auth (Google) + Instagram Login | Google for the account, Instagram for data access |
| Secrets | Secret Manager | Meta app secret, Instagram tokens |
| AI | Claude on Vertex AI | GCP billing, service-account auth |
| Validation | zod | Every API input and every AI output |
| Tests | Vitest | Fast, zero config |
| Runtime | Node 22 (`.nvmrc`) | Required by firebase-admin |

### Data model (Firestore)

| Collection | Key fields | Phase |
|---|---|---|
| `waitlist/{email}` | email, createdAt | 1 ✅ |
| `brandChecks/{id}` | brandName, website, instagram, risk, flagIds, usedAi, createdAt | 1 ✅ |
| `dealReports/{id}` | niche, followers, avgViews, deliverable, quoted, actualPaid | 1 |
| `users/{uid}` | name, niche, igUserId, plan, createdAt | 2 |
| `users/{uid}/deals/{id}` | brandId, source (dm/comment/paste), status, offer, deliverables, fairPrice, risk, dueDate, paidAt | 3 |
| `users/{uid}/insightsDaily/{date}` | reach, views, category counts, top questions, bot share | 3 |
| `brands/{brandId}` | name, handle, domain, domainAgeDays, reportCount, avgPaid, onTimeRate | 4 |

Raw comment and DM text is **not** stored. We keep categories, counts and extracted deal fields only.
Browsers have no direct Firestore access (`firestore.rules` denies all); everything goes through our server.

### Design principles
1. **Rules first, AI second.** Every feature gives a useful answer without AI.
2. **Filter before AI.** Cheap keyword filters run before any Claude call, to control cost.
3. **Store the minimum.** No raw messages; follow India's DPDP Act.
4. **Never act for the creator.** Drafts only.
5. **Tunable without UI changes.** Prices in `pricing/config.ts`, rules in `brand-check/red-flags.ts`.
6. **One job per file**, logic in `src/lib/<module>/` with tests next to it. Pages stay thin.
7. **Mobile first, plain English, ₹ via `src/lib/format.ts`.**

### Code map
```
src/
  app/                         pages + API routes (thin)
    page.tsx, rate/, check/
    api/check-brand/, api/waitlist/
  components/                  UI only
  lib/
    format.ts                  ₹ formatting
    server/gcp.ts              Firestore + Vertex clients (server only)
    pricing/                   config.ts (numbers), calculate.ts (math), tests
    brand-check/               red-flags, domain-check, ai-review, index (pipeline), types, tests
    instagram/                 (Phase 2) OAuth, API client, webhook handling
    inbox/                     (Phase 3) filters, categoriser, deal extractor
    insights/                  (Phase 3) daily aggregation
apphosting.yaml                runtime + env
firestore.rules                deny-all client rules
```

---

## 6. Phases

| Phase | Name | Delivers | Needs Meta approval |
|---|---|---|---|
| 1 | Free tools | Rate calculator, brand check (paste + screenshot), waitlist | No |
| 2 | Connect Instagram | Login, real stats, auto rate card, media kit | Insights only |
| 3 | Inbox + Insights (paid) | Comment + DM sorting, deal board, alerts, insights | Comments + messages |
| 4 | Brand network | Brand profiles from all creators, "what others were paid" | No extra |

---

## 7. Progress

✅ done · 🟡 in progress · ⬜ not started

### Phase 0: Foundation
- ✅ Next.js + Tailwind scaffold
- ✅ Move to GCP: Firestore, Claude on Vertex AI, App Hosting config
- ✅ Code split into modules (`pricing/`, `brand-check/`, `server/`)
- ✅ Unit tests (pricing, red flags, domain safety)
- ✅ SSRF protection in domain check
- ✅ Git repo with clean commit history
- ⬜ Push to GitHub
- ⬜ Create GCP project and first deploy (section 9)

### Phase 1: Free tools
- ✅ Landing page + waitlist
- ✅ Rate calculator with copy-as-text rate card
- ✅ Brand check: rules + domain age + Claude with fallback
- 🟡 Brand check from a DM screenshot (Claude reads the image)
- ⬜ Rate limit `/api/check-brand` per IP
- ⬜ "Is this pay fair?" when the message mentions a price
- ⬜ Rule: unrealistic pay for the creator's size
- ⬜ Shareable rate card image (`next/og`)
- ⬜ "What were you actually paid?" feedback → `dealReports`
- ⬜ Analytics (GA4)
- ⬜ Privacy policy + terms pages (also needed for Meta review)
- ⬜ Launch to 20 to 50 creators, tune pricing

### Phase 2: Connect Instagram
- ⬜ Register business (GST / company) for Meta verification
- ⬜ Create Meta app, business verification
- ⬜ Firebase Auth (Google sign-in)
- ⬜ Instagram Login + token storage in Secret Manager
- ⬜ Pull profile, reach, audience → auto-fill rate calculator
- ⬜ Media kit page
- ⬜ App Review: basic + insights

### Phase 3: Inbox + Insights (paid)
- ⬜ App Review: comments + messages
- ⬜ Webhook endpoint → Pub/Sub → worker
- ⬜ Keyword pre-filter
- ⬜ Claude categoriser for comments and DMs
- ⬜ Deal extractor → deal cards
- ⬜ Deal board (New → Negotiating → Confirmed → Content done → Paid)
- ⬜ Reply drafts (never auto-send)
- ⬜ Daily insights + dashboard
- ⬜ Payment reminders (Cloud Scheduler)
- ⬜ Billing (Razorpay, UPI)

### Phase 4: Brand network
- ⬜ `brands` collection built from checks, deals and reports
- ⬜ Brand profile page
- ⬜ "What similar creators were paid"

---

## 8. Decisions

| # | Decision | Why | Date |
|---|---|---|---|
| D1 | Google Cloud for everything | One project, one bill, one auth system | 2026-09-27 |
| D2 | Firestore over Cloud SQL | Serverless, free tier, JSON-shaped data | 2026-09-27 |
| D3 | Claude via Vertex AI | No API key to leak, GCP billing | 2026-09-27 |
| D4 | Login after launch | Free tools must have zero friction | 2026-09-27 |
| D5 | Never store raw messages | Privacy, DPDP Act | 2026-09-27 |
| D6 | Instagram first, Gmail later | Creators get most offers in Instagram DMs; Gmail read access is a restricted scope with a yearly paid audit | 2026-09-27 |
| D7 | Official Meta API only, no scraping | Scraping breaks Meta terms and risks creator accounts | 2026-09-27 |
| D8 | *Open:* model for bulk comment sorting | Sonnet for deal analysis; a cheaper model may be enough for sorting. Decide with real cost data in Phase 3 | pending |

---

## 9. Risks

- **Meta approval** can take weeks or be rejected. Phase 1 must stand alone.
- **Business registration** is needed before Meta verification.
- **AI cost at scale.** Viral posts get thousands of comments. Mitigate with keyword filter, Pub/Sub batching and a per-creator monthly cap.
- **Pricing accuracy.** Numbers are guesses until `dealReports` and Instagram stats come in.
- **Abuse of free AI endpoint.** Needs per-IP rate limit and a GCP budget alert.
- **False "looks OK".** Always say "signals, not proof".
- **Hinglish.** Rules are English-only; Claude handles Hinglish. Add patterns from real data.

---

## 10. Setup and deploy

**Local, no cloud** (rules-only check, waitlist logs to console):
```bash
nvm use && npm install && npm run dev
```

**Connect GCP** (one time):
1. Create a GCP project with billing.
2. Enable: Vertex AI, Firestore, Firebase App Hosting.
3. Firestore in Native mode, location `asia-south1` (Mumbai).
4. Enable Claude Sonnet 5 in Vertex AI Model Garden.
5. `gcloud auth application-default login`
6. Copy `.env.example` to `.env.local`, set `GCP_PROJECT_ID`.

**Deploy:**
1. Push the repo to GitHub.
2. `firebase init apphosting`, connect the repo, pick the nearest region to India.
3. Set `GCP_PROJECT_ID` in `apphosting.yaml`.
4. Give the App Hosting service account **Vertex AI User** and **Cloud Datastore User**.
5. `firebase deploy --only firestore:rules`
6. Push to `main` to deploy. Set a budget alert.

**Before every commit:** `npm test && npm run typecheck && npm run lint`

### Commit style
[Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
One logical change per commit.
