// GET: Instagram sends the user back here after they approve (or cancel) the connection.
import { NextResponse } from "next/server";
import { exchangeCode, getProfile } from "@/lib/instagram/api";
import { AlreadyLinkedError, consumeOAuthState, saveConnection } from "@/lib/instagram/store";
import { syncStats } from "@/lib/instagram/sync";
import { getCurrentUser } from "@/lib/server/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/account?${q}`, req.url));

  const user = await getCurrentUser();
  if (!user) return back("ig=signin");

  const state = url.searchParams.get("state") ?? "";
  if (!(await consumeOAuthState(state, user.uid))) return back("ig=expired");
  if (url.searchParams.get("error")) return back("ig=cancelled");

  const code = url.searchParams.get("code");
  if (!code) return back("ig=error");

  try {
    const conn = await exchangeCode(code);
    const profile = await getProfile(conn.token);
    await saveConnection(user.uid, { ...conn, profile });
  } catch (e) {
    if (e instanceof AlreadyLinkedError) return back("ig=taken");
    console.error("[instagram/callback] connect failed:", e instanceof Error ? e.message : e);
    return back("ig=error");
  }

  // Connected. A failed first sync is fine: the account page offers "Refresh".
  await syncStats(user.uid).catch((e) => console.error("[instagram/callback] first sync failed:", e instanceof Error ? e.message : e));
  return back("ig=connected");
}
