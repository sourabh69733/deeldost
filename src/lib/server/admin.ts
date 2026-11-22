// Admin access: Google accounts listed in ADMIN_EMAILS (comma separated) can use /admin and the extension.
import "server-only";
import { getCurrentUser, type SessionUser } from "./session";

export function parseAdminEmails(value = process.env.ADMIN_EMAILS ?? ""): Set<string> {
  return new Set(value.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")));
}

export function isAdminEmail(email: string | null | undefined, admins = parseAdminEmails()): boolean {
  return !!email && admins.has(email.trim().toLowerCase());
}

/** The signed-in user if they are an admin, else null. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}
