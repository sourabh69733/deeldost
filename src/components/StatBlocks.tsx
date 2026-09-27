import type { InstagramStats } from "@/lib/instagram/stats";

// Shared by the account page and the public media kit.

const pct = (share: number) => `${Math.round(share * 100)}%`;
const GENDER: Record<string, string> = { F: "Women", M: "Men", U: "Other" };

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-1 py-3" style={{ background: "var(--paper)", border: "1.5px solid var(--line)" }}>
      <dt className="text-xs sm:text-sm" style={{ color: "var(--muted)" }}>{label}</dt>
      <dd className="display text-2xl font-extrabold">{value}</dd>
    </div>
  );
}

export function AudienceBreakdown({ audience }: { audience: NonNullable<InstagramStats["audience"]> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <List title="Top cities" rows={audience.cities} />
      <List title="Age" rows={audience.age} />
      <List title="Gender" rows={audience.gender.map((g) => ({ ...g, label: GENDER[g.label] ?? g.label }))} />
    </div>
  );
}

function List({ title, rows }: { title: string; rows: { label: string; share: number }[] }) {
  if (!rows.length) return null;
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-1 space-y-0.5 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-2"><span className="truncate">{r.label}</span><span>{pct(r.share)}</span></li>
        ))}
      </ul>
    </div>
  );
}
