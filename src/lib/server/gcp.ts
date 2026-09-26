// Server-only access to Google Cloud: Firestore (data) and Vertex AI (Claude).
//
// Auth uses Application Default Credentials. No keys live in the code or env:
// - Local: run `gcloud auth application-default login` once.
// - Firebase App Hosting: the backend's service account is used automatically.
//
// If GCP_PROJECT_ID is not set, both getters return null and the app still works:
// waitlist emails are logged, and the brand check uses rules only.
import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

const projectId = process.env.GCP_PROJECT_ID;

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

let db: Firestore | null = null;
let claude: AnthropicVertex | null = null;

export function getDb(): Firestore | null {
  if (!projectId) return null;
  if (!db) {
    const app = getApps()[0] ?? initializeApp({ projectId });
    db = getFirestore(app);
  }
  return db;
}

export function getClaude(): AnthropicVertex | null {
  if (!projectId) return null;
  if (!claude) {
    claude = new AnthropicVertex({ projectId, region: process.env.VERTEX_REGION || "global" });
  }
  return claude;
}

// Firestore collection names in one place.
export const COLLECTIONS = {
  waitlist: "waitlist",
  brandChecks: "brandChecks",
} as const;
