# DealDost — Project Spec

> Hand this file to Claude Code. Start with: "Read PROJECT_SPEC.md and build Phase 1."

## 1. What we're building

A creator-side tool for Indian influencers (10K–200K followers) that helps them:

1. **Price themselves** — "What should I charge for this deal?"
2. **Spot scams** — "Is this brand offer real?"
3. **(Later) Never miss a deal** — all brand offers from email/DMs in one place.

Phase 1 is a **free web app** (rate calculator + scam checker) to attract users. Phase 2 adds the paid deal inbox.

**Target user:** Indian creators on Instagram / YouTube, niches: fashion, beauty, tech, finance, food, fitness, lifestyle. They handle brand deals themselves, no manager.

---

## 2. Tech stack

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Styling:** Tailwind CSS, mobile-first (most users are on phones)
- **Database + Auth:** Supabase (Postgres, Google login)
- **AI:** Anthropic Claude API (server-side only, key in `.env.local`)
- **Hosting:** Vercel
- **Currency:** INR everywhere, formatted `₹12,500` (use `Intl.NumberFormat('en-IN')`)

Keep it simple. No microservices, no extra state libraries unless needed.

---

## 3. Phase 1 — Free tools (build this first)

### 3.1 Landing page (`/`)
- Headline: "Know your worth. Spot fake brands. Never miss a deal."
- Two big buttons: **Calculate my rate** and **Check a brand**
- Short "How it works" (3 steps) and a waitlist email capture for Phase 2 (store in Supabase `waitlist` table)

### 3.2 Rate Card Calculator (`/rate`)

**Inputs**
- Platform: Instagram / YouTube
- Deliverable: Reel, Static post, Story (set of 3), YouTube integration, YouTube Short
- Followers (number)
- Average views per reel/video (number) — most important input
- Niche: fashion, beauty, tech, finance, food, fitness, lifestyle, entertainment, travel, other
- Optional add-ons: usage rights (brand can run ads with it), exclusivity (no competitor for X days), link in bio, extra revisions

**Output**
- Suggested price range: low / fair / high, in ₹
- One-line explanation of how it was calculated
- "Copy rate card" button → generates a clean shareable text/image rate card
- Tip text: e.g. "Always charge extra for usage rights."

**Pricing logic** (put ALL numbers in `lib/pricing-config.ts` so they're easy to tune):

```
basePrice = (avgViews / 1000) × nicheCPM
price = basePrice × deliverableMultiplier × engagementMultiplier × addOnMultipliers
low  = price × 0.75
high = price × 1.35
```

Starting values (placeholders — must be calibrated with real creator data later):

| Niche | CPM range (₹ per 1,000 views) |
|---|---|
| Finance | 600–1200 |
| Tech | 500–1000 |
| Beauty | 450–900 |
| Fashion | 400–800 |
| Fitness | 350–750 |
| Food / Lifestyle / Travel | 350–700 |
| Entertainment / Other | 250–500 |

- Deliverable multipliers: Reel 1.0, Static 0.6, Story set 0.4, YT integration 1.5, YT Short 0.8
- Engagement multiplier: views/followers ratio → <10% = 0.8, 10–30% = 1.0, 30–60% = 1.2, >60% = 1.4
- Add-ons: usage rights +30–50%, exclusivity +20%, link in bio +10%
- Minimum floor: ₹1,500

Show a disclaimer: "Estimates only. Your real rate depends on your audience and the brand."

### 3.3 Brand Scam Checker (`/check`)

**Inputs**
- Brand name
- Brand website (optional)
- Brand Instagram handle (optional)
- Paste the message/email they sent (textarea)

**Checks**
1. **Rule-based red flags** (run instantly, no AI):
   - Asks creator to pay anything ("registration fee", "security deposit", "buy the product first and we'll refund")
   - Sender uses free email (gmail/yahoo/outlook) while claiming to be a big brand
   - Asks for OTP, bank login, UPI PIN, or Aadhaar/PAN upfront
   - Links to shortened URLs or WhatsApp/Telegram groups
   - Unrealistic pay for follower count (compare with rate calculator output)
   - Urgency pressure ("reply in 1 hour")
2. **Domain check** (if website given): does it load, does it have HTTPS, domain age via a WHOIS API (flag if < 6 months old)
3. **AI analysis** (Claude API, server route `/api/check-brand`): send the message + rule results, ask for JSON output:
   ```json
   { "risk": "low | medium | high", "reasons": ["..."], "questions_to_ask_brand": ["..."] }
   ```

**Output**
- Traffic light: 🟢 Looks OK / 🟡 Be careful / 🔴 Likely scam
- List of reasons in plain, simple English
- "Questions to ask the brand before saying yes"
- If price was mentioned, show "Fair for your size?" using the rate calculator

Never claim 100% certainty. Say "signals" not "proof".

### 3.4 Accounts (light)
- Google login via Supabase (optional for Phase 1 tools — tools work without login)
- Logged-in users can save their rate card and past brand checks

### 3.5 Database tables (Supabase)
- `waitlist` (id, email, created_at)
- `profiles` (id, name, niche, platform, followers, avg_views, created_at)
- `rate_cards` (id, user_id, inputs jsonb, result jsonb, created_at)
- `brand_checks` (id, user_id nullable, brand_name, input jsonb, result jsonb, created_at)

Enable Row Level Security so users only see their own data.

---

## 4. Phase 2 — Deal Inbox (paid, build after Phase 1 has users)

- Connect Gmail (Google OAuth, read-only scope first)
- AI classifies emails: **Brand deal / Collab / Fan / Spam / Payment**
- Deals board: New → Negotiating → Confirmed → Content done → Paid
- Each deal auto-runs the scam checker and rate check
- Draft replies in the creator's tone (creator approves before sending, never auto-send)
- Payment reminders when a brand is late
- Later: Instagram DMs (needs Meta app review) and WhatsApp Business

Pricing idea: free tools forever, Pro ₹299–499/month for the inbox.

---

## 5. Rules for building

- Mobile-first, fast, simple English, no jargon
- All AI calls server-side; never expose the API key
- Validate every input (zod)
- Handle AI failures gracefully — rule-based checks must still show results
- No auto-sending messages on the user's behalf, ever
- Store only what's needed; don't store full emails in Phase 2, only extracted deal info
- Write small, readable components; keep pricing config and red-flag rules in separate files so they can be tuned without touching UI

---

## 6. Build order

1. Set up Next.js + Tailwind + Supabase, deploy empty app to Vercel
2. Landing page + waitlist
3. Rate calculator (pure frontend logic first)
4. Scam checker: rule-based checks → then domain check → then Claude API
5. Google login + save results
6. Polish mobile UI, add shareable rate card image
7. Launch: share with 20–50 creators, collect feedback, tune pricing numbers

---

## 7. Success check for Phase 1

- 100+ creators use a tool in the first month
- 30+ join the Phase 2 waitlist
- At least 10 creators say "I'd pay for the inbox"

If these don't happen, talk to users before building Phase 2.
