"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { viewEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

// Counts one view per page visit. No cookies, no identifiers.
export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => track(viewEvent(pathname)), [pathname]);
  return null;
}
