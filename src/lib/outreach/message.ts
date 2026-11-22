// First-message drafts for the admin to copy and send themselves. Never sent automatically.
import { inr } from "@/lib/format";
import type { Person } from "@/lib/people/person";
import { DEFAULT_SENDER } from "./config";
import { buildPublicPage, firstName } from "./page";

export type Drafts = { dm: string; emailSubject: string; emailBody: string };

/** Something specific to mention: an AI theme, else their niche, else their content in general. */
function hook(p: Person, nicheLabel: string): string {
  const theme = p.research?.themes.find((t) => !t.startsWith("#"));
  if (theme) return theme.toLowerCase();
  return nicheLabel === "Other" ? "" : nicheLabel.toLowerCase();
}

export function draftMessages(p: Person, pageUrl: string, senderName: string | null): Drafts {
  const page = buildPublicPage(p);
  const hi = firstName(p);
  const about = hook(p, page.nicheLabel);
  const sender = (senderName ?? "").trim().split(/\s+/)[0] || DEFAULT_SENDER;
  const reel = page.rates?.rows[0];
  const what = reel
    ? `what brands should pay you for a ${reel.label.toLowerCase()} (around ${inr(reel.price)})`
    : "tips on getting paid brand deals";
  const liked = about ? `Really like your ${about} posts. ` : "Really like your posts. ";

  const dm = `Hi ${hi}! ${liked}I made you a free page with ${what}: ${pageUrl}\nNo sign-up needed to see it. Hope it helps! ${sender}`;

  const emailSubject = reel ? `${hi}, what brands should pay you` : `${hi}, a few tips for brand deals`;
  const emailBody = [
    `Hi ${hi},`,
    "",
    `${liked}I'm ${sender} from DealDost, a free tool that helps creators in India price brand deals and spot fake offers.`,
    "",
    `I made a page just for you with ${what}, plus a few tips for your size and niche:`,
    pageUrl,
    "",
    "It's free and you don't need to sign up to see it. If you don't want the page, there's a button on it to remove it.",
    "",
    "Cheers,",
    sender,
  ].join("\n");

  return { dm, emailSubject, emailBody };
}
