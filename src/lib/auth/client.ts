// Browser only: Google sign-in with Firebase Auth, then hand the result to our server as a session cookie.
// Firebase's own browser session is not kept; the httpOnly cookie is the single source of truth.
// The Firebase SDK is loaded on demand, so pages don't pay for it until someone taps "Sign in".

async function firebaseAuth() {
  const [{ getApps, initializeApp }, auth] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return { auth: auth.getAuth(app), sdk: auth };
}

export async function signInWithGoogle(): Promise<void> {
  const { auth, sdk } = await firebaseAuth();
  await sdk.setPersistence(auth, sdk.inMemoryPersistence);
  const cred = await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider());
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await cred.user.getIdToken() }),
  });
  await sdk.signOut(auth);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Sign-in failed");
}

export async function signOut(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}
