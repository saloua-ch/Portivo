// Standalone-backend auth — used once VITE_API_URL is set (see
// backendClient.js). Real server-side auth: the Express server checks the
// password against a bcrypt hash and issues a JWT; we just hold onto it.

import { apiFetch } from "./backendClient";
import { getToken, setToken, clearToken } from "./tokenStore";

export async function signIn(email, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token, data.session.expires_at, data.session.user.email);
  return data.session;
}

export async function signOut() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function getSession() {
  const stored = getToken();
  if (!stored) return null;
  return { user: { email: stored.email }, expires_at: stored.expires_at };
}

export function onAuthChange(callback) {
  const handler = () => callback(getToken() ? { user: { email: getToken().email }, expires_at: getToken().expires_at } : null);
  window.addEventListener("pv:auth-changed", handler);
  window.addEventListener("storage", handler); // cross-tab sign-out
  return () => {
    window.removeEventListener("pv:auth-changed", handler);
    window.removeEventListener("storage", handler);
  };
}
