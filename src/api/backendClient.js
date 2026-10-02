// Fetch wrapper for the standalone Express API — the replacement for
// supabaseClient.js. All requests go through here so the auth header and
// error handling stay in one place.

import { getToken, clearToken } from "./tokenStore";

const API_URL = import.meta.env.VITE_API_URL;

export function isBackendConfigured() {
  return Boolean(API_URL && API_URL.trim() !== "");
}

export function apiUrl() {
  if (!isBackendConfigured()) {
    throw new Error(
      "Backend API is not configured. Add VITE_API_URL to a .env file in the project root, then restart the dev server."
    );
  }
  return API_URL.replace(/\/$/, "");
}

export async function apiFetch(pathname, options = {}) {
  const stored = getToken();
  const headers = { ...(options.headers || {}) };
  if (stored?.token) headers.Authorization = `Bearer ${stored.token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${apiUrl()}${pathname}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }
  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}
