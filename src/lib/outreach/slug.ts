// Personal page links use a random 12-character code (made in store.ts), so nobody can guess other
// people's pages from a handle. Client-safe.
export const looksLikeSlug = (s: string) => /^[A-Za-z0-9_-]{12}$/.test(s);
export const pagePath = (slug: string) => `/p/${slug}`;
