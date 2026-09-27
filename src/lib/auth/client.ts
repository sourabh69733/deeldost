// Browser only: Google sign-in with Firebase Auth, then hand the result to our server as a session cookie.
// Firebase's own browser session is not kept; the httpOnly cookie is the single source of truth.
import { getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, inMemoryPersistence, setPersistence, signInWithPopup, signOut as fbSignOut } from "firebase/auth";

function firebaseAuth() {
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return getAuth(app);
}

export async function signInWithGoogle(): Promise<void> {
  const auth = firebaseAuth();
  await setPersistence(auth, inMemoryPersistence);
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await cred.user.getIdToken() }),
  });
  await fbSignOut(auth);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Sign-in failed");
}

export async function signOut(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}
