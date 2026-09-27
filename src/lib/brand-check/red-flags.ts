// Rule-based scam signals. Runs instantly, no AI or network needed.
// This is the safety net: results must be useful even when AI is down.
export type Flag = { id: string; severity: "high" | "medium"; reason: string };
export type Risk = "low" | "medium" | "high";

const RULES: { id: string; severity: Flag["severity"]; reason: string; test: RegExp }[] = [
  { id: "pay_to_join", severity: "high", reason: "They ask you to pay money (fee, deposit, or charges). Real brands pay you, not the other way round.",
    test: /(registration|joining|security|onboarding|processing)\s*(fee|charge|deposit|amount)|pay\s*(₹|rs\.?|inr)?\s*\d+\s*(to|for)\s*(join|register|confirm)|refundable/i },
  { id: "buy_first", severity: "high", reason: "They want you to buy the product first and get refunded later. This is a common scam.",
    test: /(buy|purchase|order)\s.*(first|yourself).*(refund|reimburse)|refund\s*(after|later|once)/i },
  { id: "sensitive_info", severity: "high", reason: "They ask for OTP, UPI PIN, passwords, or ID documents. Never share these.",
    test: /\b(otp|upi\s*pin|password|cvv|aadhaar|aadhar|pan\s*card|bank\s*login|net\s*banking)\b/i },
  { id: "chat_groups", severity: "medium", reason: "They push you to a Telegram or WhatsApp group. Scammers often move chats off-platform.",
    test: /(t\.me\/|telegram|chat\.whatsapp\.com|join\s*(our|the)\s*(whatsapp|telegram)\s*group)/i },
  { id: "short_links", severity: "medium", reason: "They use shortened links, which can hide where they really go.",
    test: /\b(bit\.ly|tinyurl\.com|cutt\.ly|shorturl\.at|rb\.gy|is\.gd|t\.co)\//i },
  { id: "urgency", severity: "medium", reason: "They pressure you to decide fast. Real brands give you time.",
    test: /(within|in)\s*(1|one|2|two|24)\s*(hour|hr|hrs|hours)|urgent(ly)?|limited\s*slots|last\s*chance|act\s*now|immediately/i },
  { id: "task_scam", severity: "high", reason: "It sounds like a 'like and earn' or task scam, not a real brand deal.",
    test: /(like|follow|subscribe|review)\s*(and|&)\s*earn|daily\s*income|per\s*task|work\s*from\s*home\s*earn/i },
];

// A link or bare domain like "brand.in", but not the domain part of an email address.
const WEBSITE_IN_TEXT = /https?:\/\/|(?<![@\w.-])[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|in|co|shop|store|net|org|io|app|online|site)\b/i;

const FREE_EMAIL = /@(gmail|yahoo|outlook|hotmail|rediffmail|proton(mail)?|icloud)\.(com|in|me)/i;

export function runRedFlags(message: string, brandName: string, website?: string): Flag[] {
  const flags: Flag[] = RULES.filter((r) => r.test.test(message)).map(({ id, severity, reason }) => ({ id, severity, reason }));

  if (FREE_EMAIL.test(message) && brandName.trim().length > 0) {
    flags.push({
      id: "free_email", severity: "medium",
      reason: `The message uses a free email address (like Gmail) while claiming to be ${brandName}. Big brands and agencies usually use their own company email.`,
    });
  }
  if (!website && !WEBSITE_IN_TEXT.test(message)) {
    flags.push({ id: "no_website", severity: "medium", reason: "No brand website was shared. Ask for one before agreeing." });
  }
  return flags;
}

/**
 * Turns rule hits into a risk level.
 * Any high-severity flag means "high"; any medium signal (including domain notes) means "medium".
 */
export function scoreRisk(flags: Flag[], extraMediumSignals = 0): Risk {
  if (flags.some((f) => f.severity === "high")) return "high";
  const medium = flags.filter((f) => f.severity === "medium").length + extraMediumSignals;
  return medium > 0 ? "medium" : "low";
}
