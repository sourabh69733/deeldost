"use client";
// A tappable cover that opens the full-screen Wrapped story.
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics/track";
import { compact } from "@/lib/format";
import type { Wrapped } from "@/lib/wrapped/compute";
import WrappedStory, { type StoryMode } from "./WrappedStory";

type Props = { wrapped: Wrapped; picture: string | null; mode: StoryMode; cardUrl: string; publicUrl?: string | null; autoOpen?: boolean; label?: string };

export default function WrappedLauncher({ wrapped: w, picture, mode, cardUrl, publicUrl, autoOpen, label }: Props) {
  const [open, setOpen] = useState(false);
  const play = () => { setOpen(true); track("wrapped_played"); };
  useEffect(() => {
    if (autoOpen) { setOpen(true); track("wrapped_played"); }
  }, [autoOpen]);

  return (
    <>
      <button
        type="button"
        onClick={play}
        className="group relative block w-full max-w-sm overflow-hidden rounded-3xl p-6 text-left text-white shadow-xl transition-transform hover:-translate-y-0.5"
        style={{ background: "linear-gradient(150deg, #1b2240 0%, #2a2160 55%, #5b2a6e 100%)", aspectRatio: "4 / 5" }}
      >
        <span aria-hidden className="display absolute -right-3 top-2 text-[8.5rem] font-extrabold leading-none opacity-40"
          style={{ color: "transparent", WebkitTextStroke: "2px #f5a524" }}>{w.year}</span>
        {mode === "demo" && <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-[#1b2240]">Sample</span>}
        <span className="absolute inset-x-6 bottom-6 block">
          <span className="block font-semibold text-[#f5a524]">@{w.username}</span>
          <span className="display mt-1 block text-5xl font-extrabold leading-[0.9]">Your {w.year}<br />Wrapped</span>
          <span className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-[#f5a524] px-3 py-1 text-[#1b2240]">{w.posts} posts</span>
            {w.views !== null && <span className="rounded-full bg-[#ff6fa8] px-3 py-1 text-[#1b2240]">{compact(w.views)} views</span>}
          </span>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-[#1b2240] transition-transform group-hover:scale-105">
            ▶ {label ?? "Play"}
          </span>
        </span>
      </button>
      {open && <WrappedStory wrapped={w} picture={picture} mode={mode} cardUrl={cardUrl} publicUrl={publicUrl} onClose={() => setOpen(false)} />}
    </>
  );
}
