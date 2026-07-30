// Local auth fallback — used when Supabase env vars are not configured.
// Mirrors storageLocal.js: same idea, just for the session instead of data.
// NOT real security — the credential check happens in the browser, so
// anyone reading the shipped code can see it. Fine for local dev; once
// Supabase is configured (see authSupabase.js) real server-side auth
// takes over automatically via the api/auth.js facade.

const KEY = "pv:auth:v1";
const ALLOWED_EMAIL    = "soulef@genmaritime.net";
const ALLOWED_PASSWORD = "bendhibsoulef";
const SESSION_HOURS    = 12;

function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function encode(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decode(token) {
  return JSON.parse(decodeURIComponent(escape(atob(token))));
}

function readSession() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const payload = decode(raw);
    if (!payload.exp || payload.exp < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { user: { email: payload.email }, expires_at: Math.floor(payload.exp / 1000) };
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

function notify() {
  window.dispatchEvent(new CustomEvent("pv:auth-changed"));
}

export async function signIn(email, password) {
  await delay();
  const cleanEmail = (email || "").trim().toLowerCase();
  if (cleanEmail !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
    throw new Error("Invalid email or password");
  }
  const token = encode({
    email: cleanEmail,
    iat: Date.now(),
    exp: Date.now() + SESSION_HOURS * 3600 * 1000,
  });
  localStorage.setItem(KEY, token);
  notify();
  return readSession();
}

export async function signOut() {
  await delay(100);
  localStorage.removeItem(KEY);
  notify();
}

export async function getSession() {
  return readSession();
}

export function onAuthChange(callback) {
  const handler = () => callback(readSession());
  window.addEventListener("pv:auth-changed", handler);
  window.addEventListener("storage", handler); // cross-tab sign-out
  return () => {
    window.removeEventListener("pv:auth-changed", handler);
    window.removeEventListener("storage", handler);
  };
}
