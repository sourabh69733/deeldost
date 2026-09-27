import { z } from "zod";
import { CLIENT_EVENTS } from "@/lib/analytics/events";
import { countEvent } from "@/lib/server/metrics";

const Input = z.object({ event: z.enum(CLIENT_EVENTS) });

// Receives cookie-free usage beacons from the browser. Always 204 so beacons never error.
export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (parsed.success) await countEvent(parsed.data.event);
  return new Response(null, { status: 204 });
}
