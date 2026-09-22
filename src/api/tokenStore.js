// Shared JWT storage for authBackend.js / storageBackend.js — same role
// authSupabase.js used to leave to supabase-js's internal session storage,
// now handled explicitly since we own the auth flow.

const KEY = "pv:backend-token:v1";

export function getToken() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (!payload.expires_at || payload.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return payload;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function setToken(token, expires_at, email) {
  localStorage.setItem(KEY, JSON.stringify({ token, expires_at, email }));
  window.dispatchEvent(new CustomEvent("pv:auth-changed"));
}

export function clearToken() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("pv:auth-changed"));
}
