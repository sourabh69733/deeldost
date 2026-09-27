// Prints daily usage counts from Firestore. Usage: npm run metrics [days]
// Needs GCP_PROJECT_ID (read from .env.local) and `gcloud auth application-default login`.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const days = Number(process.argv[2] ?? 14);
const projectId = process.env.GCP_PROJECT_ID;
if (!projectId) throw new Error("Set GCP_PROJECT_ID in .env.local");

// Same day key as src/lib/analytics/events.ts (India time).
const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(Date.now() - (days - 1 - i) * 86_400_000)));

const db = getFirestore(initializeApp({ projectId }));
const snaps = await db.getAll(...keys.map((k) => db.collection("metrics").doc(k)));
const rows = snaps.filter((s) => s.exists).map((s) => ({ day: s.id, ...s.data() }));

if (!rows.length) console.log(`No metrics in the last ${days} days.`);
else console.table(rows);
