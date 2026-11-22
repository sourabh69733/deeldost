"use client";
// Full-screen, Instagram-style story for a Wrapped. Tap right/left to move, hold to pause, Esc to close.
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import { compact } from "@/lib/format";
import { shareImage } from "@/lib/share-image";
import type { Wrapped } from "@/lib/wrapped/compute";
import { MONTHS_LONG, PERSONAS } from "@/lib/wrapped/config";
import { buildSlides, type Slide } from "@/lib/wrapped/story";
import s from "./WrappedStory.module.css";

export type StoryMode = "own" | "public" | "demo";

type Props = {
  wrapped: Wrapped;
  picture: string | null;
  mode: StoryMode;
  /** Story image to share. */
  cardUrl: string;
  /** Public link to copy, when the owner turned it on. */
  publicUrl?: string | null;
  onClose: () => void;
};

const THEME: Record<Slide["kind"], string> = {
  cover: s["t-ink"], posts: s["t-marigold"], views: s["t-pink"], top: s["t-ink"], months: s["t-lilac"],
  streak: s["t-mint"], love: s["t-sky"], persona: s["t-ink"], summary: s["t-cream"], empty: s["t-marigold"],
};
const SLIDE_MS = 5500;
const HOLD_MS = 220;

const full = (n: number) => n.toLocaleString("en-IN");

/** Counts up to `to` when shown. Jumps straight there for reduced motion. */
function CountUp({ to, format = compact }: { to: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{format(n)}</>;
}

export default function WrappedStory({ wrapped: w, picture, mode, cardUrl, publicUrl, onClose }: Props) {
  const slides = buildSlides(w);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const press = useRef<{ t: number; x: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const slide = slides[i];
  const last = i === slides.length - 1;

  const next = useCallback(() => setI((v) => Math.min(v + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  // Lock page scroll, focus the close button, keyboard controls.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKey); };
  }, [next, prev, onClose]);

  // Tap = move, hold = pause. Buttons and links inside the slide handle their own clicks.
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    press.current = { t: Date.now(), x: e.clientX };
    setPaused(true);
  };
  const onUp = (e: React.PointerEvent) => {
    const p = press.current;
    press.current = null;
    setPaused(false);
    if (!p || Date.now() - p.t > HOLD_MS) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (p.x - rect.left < rect.width * 0.3) prev(); else next();
  };

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={`@${w.username}'s ${w.year} Wrapped`}>
      <div
        className={`${s.frame} ${THEME[slide.kind]} ${paused ? s.paused : ""}`}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => { press.current = null; setPaused(false); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className={s.top}>
          <div className={s.bars} aria-hidden>
            {slides.map((_, k) => (
              <div key={k} className={`${s.bar} ${k < i ? s.done : ""} ${k === i && !last ? s.active : ""} ${k === i && last ? s.done : ""}`}>
                <div
                  className={s.fill}
                  style={{ ["--dur" as string]: `${SLIDE_MS}ms` }}
                  onAnimationEnd={k === i ? next : undefined}
                />
              </div>
            ))}
          </div>
          <div className={s.head}>
            {picture
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={picture} alt="" className={s.miniAvatar} referrerPolicy="no-referrer" />
              : <span className={s.miniAvatar} aria-hidden />}
            <span className={s.headText}>@{w.username}<small>{w.year} Wrapped</small></span>
            <span className={s.spacer} />
            {mode === "demo" && <span className={s.sample}>Sample</span>}
            <button ref={closeRef} type="button" className={s.close} onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div key={i} className={`${s.slide} ${slideClass(slide)}`} aria-live="polite">
          <SlideBody slide={slide} w={w} picture={picture} mode={mode} cardUrl={cardUrl} publicUrl={publicUrl} onReplay={() => setI(0)} onClose={onClose} />
        </div>

        {/* Visible to screen readers and keyboards; pointer users tap anywhere. */}
        {!last && <button type="button" className="sr-only" onClick={next}>Next</button>}
      </div>
    </div>
  );
}

function slideClass(slide: Slide) {
  if (slide.kind === "cover") return s.cover;
  if (slide.kind === "persona") return s.persona;
  if (slide.kind === "summary") return s.summary;
  return "";
}

type BodyProps = { slide: Slide; w: Wrapped; picture: string | null; mode: StoryMode; cardUrl: string; publicUrl?: string | null; onReplay: () => void; onClose: () => void };

function SlideBody({ slide, w, picture, mode, cardUrl, publicUrl, onReplay, onClose }: BodyProps) {
  switch (slide.kind) {
    case "cover":
      return (
        <>
          <div className={s.ghostYear} aria-hidden>{w.year}</div>
          {picture
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={picture} alt="" className={`${s.avatar} ${s.pop}`} referrerPolicy="no-referrer" />
            : <div className={`${s.avatarFallback} ${s.pop}`} aria-hidden>{w.username[0]?.toUpperCase()}</div>}
          <p className={`${s.handle} ${s.pop} ${s.d1}`}>@{w.username}</p>
          <h2 className={`${s.wrappedWord} ${s.pop} ${s.d2}`}>Your <span>{w.year}</span><br />Wrapped</h2>
          <p className={`${s.hint} ${s.pop} ${s.d3}`}>Tap to start →</p>
        </>
      );
    case "empty":
      return (
        <>
          <p className={`${s.mid} ${s.pop}`}>No posts in {w.year} yet.</p>
          <p className={`${s.sub} ${s.pop} ${s.d1}`}>Post a reel and come back. We&apos;ll be here.</p>
        </>
      );
    case "posts":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>This year you posted</p>
          <p className={`${s.big} ${s.pop} ${s.d1}`}><CountUp to={slide.posts} format={full} /></p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`}>times</p>
          <p className={`${s.sub} ${s.pop} ${s.d2}`}>{slide.reels} of them were reels.</p>
          {slide.day && <p className={`${s.sticker} ${s.pop} ${s.d3}`}>📅 Favourite day to post: {slide.day}</p>}
        </>
      );
    case "views":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>Your reels were watched</p>
          <p className={`${s.big} ${s.pop} ${s.d1}`}><CountUp to={slide.views} /></p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`}>times</p>
          <p className={`${s.sub} ${s.pop} ${s.d2}`}>That&apos;s {full(slide.views)} views.</p>
          {slide.venue && <p className={`${s.sticker} ${s.pop} ${s.d3}`}>🏟️ {slide.venue}</p>}
          <p className={`${s.note} ${s.pop} ${s.d4}`}>{slide.note} Views count plays, not unique people.</p>
        </>
      );
    case "top":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>Your biggest reel of the year</p>
          <p className={`${s.big} ${s.pop} ${s.d1}`} style={{ color: "var(--marigold)" }}><CountUp to={slide.views} /></p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`}>views</p>
          <p className={`${s.sub} ${s.pop} ${s.d2}`}>Posted in {slide.month}.</p>
          <div className={`${s.chips} ${s.pop} ${s.d3}`}>
            <span className={s.chip}>❤️ {compact(slide.likes)}</span>
            <span className={s.chip}>💬 {compact(slide.comments)}</span>
          </div>
          {slide.permalink && (
            <a className={`${s.watch} ${s.pop} ${s.d4}`} href={slide.permalink} target="_blank" rel="noopener noreferrer">Watch it again ↗</a>
          )}
        </>
      );
    case "months": {
      const max = Math.max(...slide.bars.map((b) => b.value), 1);
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>Your best month was</p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`} style={{ fontSize: "clamp(52px, 17vw, 76px)" }}>{slide.best}</p>
          <p className={`${s.sub} ${s.pop} ${s.d1}`}>{slide.byViews ? "Most views of the year." : "Your busiest month for posts."}</p>
          <div className={s.chart} role="img" aria-label={`${slide.byViews ? "Views" : "Posts"} by month. Best: ${slide.best}.`}>
            {slide.bars.map((b, k) => (
              <div key={b.label} className={s.col}>
                <div className={`${s.colBar} ${b.best ? s.best : ""}`} style={{ height: `${Math.max(2, (b.value / max) * 100)}%`, animationDelay: `${0.3 + k * 0.05}s` }} />
                <span className={s.colLabel}>{b.label[0]}</span>
              </div>
            ))}
          </div>
        </>
      );
    }
    case "streak":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>Longest posting streak</p>
          <p className={`${s.big} ${s.pop} ${s.d1}`}>🔥{slide.weeks}</p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`}>weeks in a row</p>
          <p className={`${s.sticker} ${s.pop} ${s.d2}`}>{slide.line}</p>
        </>
      );
    case "love":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>People showed up for you</p>
          <p className={`${s.big} ${s.pop} ${s.d1}`}><CountUp to={slide.likes} /></p>
          <p className={`${s.mid} ${s.pop} ${s.d1}`}>likes ❤️</p>
          <p className={`${s.mid} ${s.pop} ${s.d2}`} style={{ marginTop: 18, fontSize: "clamp(30px, 9vw, 42px)", whiteSpace: "nowrap" }}><CountUp to={slide.comments} /> comments 💬</p>
          <p className={`${s.sticker} ${s.pop} ${s.d3}`}>{slide.line}</p>
        </>
      );
    case "persona":
      return (
        <>
          <p className={`${s.kicker} ${s.pop}`}>Your {w.year} creator type</p>
          <div className={s.emoji} aria-hidden>{slide.emoji}</div>
          <p className={`${s.mid} ${s.pop} ${s.d2}`}>{slide.title}</p>
          <p className={`${s.sub} ${s.pop} ${s.d3}`}>{slide.line}</p>
        </>
      );
    case "summary":
      return <Summary w={w} mode={mode} cardUrl={cardUrl} publicUrl={publicUrl} onReplay={onReplay} onClose={onClose} />;
  }
}

function Summary({ w, mode, cardUrl, publicUrl, onReplay, onClose }: Omit<BodyProps, "slide" | "picture">) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const persona = PERSONAS[w.persona];

  async function share() {
    setBusy(true);
    if (await shareImage(cardUrl, `wrapped-${w.year}.png`, `My ${w.year} Wrapped`)) track("wrapped_shared");
    setBusy(false);
  }
  async function copy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className={`${s.sumHead} ${s.pop}`}>
        <p className={s.mid} style={{ fontSize: 34 }}>@{w.username}</p>
        <p className={s.kicker}>{w.year}</p>
      </div>
      <div className={`${s.grid} ${s.pop} ${s.d1}`}>
        <div className={s.tile} style={{ background: "var(--marigold)" }}><b>{w.posts}</b><span>posts</span></div>
        {w.views !== null
          ? <div className={s.tile} style={{ background: "var(--pink)" }}><b>{compact(w.views)}</b><span>reel views</span></div>
          : <div className={s.tile} style={{ background: "var(--pink)" }}><b>{compact(w.likes)}</b><span>likes</span></div>}
        {w.topReel && <div className={s.tile} style={{ background: "var(--lilac)" }}><b>{compact(w.topReel.views)}</b><span>top reel</span></div>}
        <div className={s.tile} style={{ background: "var(--mint)" }}><b>{w.streakWeeks}</b><span>week streak</span></div>
        {w.bestMonth !== null && !w.topReel && <div className={s.tile} style={{ background: "var(--lilac)" }}><b>{MONTHS_LONG[w.bestMonth].slice(0, 3)}</b><span>best month</span></div>}
        <div className={`${s.tile} ${s.wide}`} style={{ background: "var(--sky)" }}><b>{persona.emoji} {persona.title}</b><span>creator type</span></div>
      </div>

      <div className={`${s.actions} ${s.pop} ${s.d2}`}>
        {mode === "own" && (
          <>
            <button type="button" className={s.primary} onClick={share} disabled={busy}>{busy ? "Making image…" : "Share to your Story"}</button>
            {publicUrl && <button type="button" className={s.secondary} onClick={copy}>{copied ? "Copied" : "Copy link"}</button>}
          </>
        )}
        {mode !== "own" && (
          <a href="/wrapped#make" className={s.primary} onClick={() => { track("wrapped_make_own"); if (mode === "demo") onClose(); }}>
            Make your own Wrapped, free
          </a>
        )}
        <div className={s.row}>
          {mode !== "own" && <button type="button" className={s.secondary} onClick={share} disabled={busy}>{busy ? "…" : "Save image"}</button>}
          <button type="button" className={s.secondary} onClick={onReplay}>Replay</button>
        </div>
      </div>
      {mode === "demo" && <p className={s.note}>Sample numbers. Yours come from your own Instagram.</p>}
    </>
  );
}
