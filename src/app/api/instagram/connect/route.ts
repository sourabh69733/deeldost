// GET: start "Connect Instagram". Sends the signed-in user to Instagram's login page.
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/instagram/api";
import { igAppConfig } from "@/lib/instagram/config";
import { createOAuthState } from "@/lib/instagram/store";
import { getCurrentUser } from "@/lib/server/session";

export async function GET(req: Request) {
  const back = (q: string) => NextResponse.redirect(new URL(`/account?${q}`, req.url));
  const user = await getCurrentUser();
  if (!user) return back("ig=signin");
  if (!igAppConfig()) return back("ig=unavailable");

  const state = await createOAuthState(user.uid);
  return NextResponse.redirect(authorizeUrl(state));
}
