// Standalone-backend storage — used once VITE_API_URL is set. Talks to the
// Express API instead of Supabase's PostgREST/Storage/Realtime.

import { io } from "socket.io-client";
import { apiFetch, apiUrl } from "./backendClient";
import { getToken } from "./tokenStore";

let socket = null;

function emitChange(detail) {
  window.dispatchEvent(new CustomEvent("pv:data-updated", { detail: detail || { timestamp: Date.now() } }));
}

function ensureRealtime() {
  if (socket) return;
  socket = io(apiUrl(), { auth: { token: getToken()?.token }, autoConnect: true });
  socket.on("data:changed", emitChange);
}

export async function getContainers(opts = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(opts)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return apiFetch(`/api/containers${qs ? `?${qs}` : ""}`);
}

export async function getContainer(id) {
  try {
    return await apiFetch(`/api/containers/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.message.includes("404") || err.message === "Not found") return null;
    throw err;
  }
}

export async function addContainer(payload) {
  const item = await apiFetch("/api/containers", { method: "POST", body: JSON.stringify(payload) });
  ensureRealtime();
  return item;
}

export async function updateContainer(id, patch) {
  const item = await apiFetch(`/api/containers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  ensureRealtime();
  return item;
}

export async function deleteContainer(id) {
  await apiFetch(`/api/containers/${encodeURIComponent(id)}`, { method: "DELETE" });
  ensureRealtime();
}

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

export async function uploadDocument(containerId, groupageIndex, file) {
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const form = new FormData();
  form.append("file", file);
  return apiFetch(`/api/containers/${encodeURIComponent(containerId)}/documents/${groupageIndex}`, {
    method: "POST",
    body: form,
  });
}

export async function getDocumentUrl(doc) {
  if (doc.dataUrl) return doc.dataUrl; // legacy inline document
  if (!doc.storagePath) throw new Error("Document has no file reference");

  const { url } = await apiFetch(`/api/documents/sign?path=${encodeURIComponent(doc.storagePath)}`);
  return `${apiUrl()}${url}`;
}

export async function deleteDocument(doc) {
  if (!doc.storagePath) return; // legacy inline document — nothing on disk to remove
  await apiFetch("/api/documents", {
    method: "DELETE",
    body: JSON.stringify({ storagePath: doc.storagePath }),
  });
}

export async function importContainers(csvText) {
  const result = await apiFetch("/api/containers/import", {
    method: "POST",
    body: JSON.stringify({ csvText }),
  });
  ensureRealtime();
  return result;
}

export async function getImportHistory() {
  return apiFetch("/api/import-history");
}

export async function addImportHistory(record) {
  const result = await apiFetch("/api/import-history", { method: "POST", body: JSON.stringify(record) });
  ensureRealtime();
  return result;
}

export async function deleteImport(importId) {
  await apiFetch(`/api/containers/by-import/${encodeURIComponent(importId)}`, { method: "DELETE" });
  ensureRealtime();
}

export function onChange(callback) {
  ensureRealtime();
  const handler = (e) => callback(e.detail);
  window.addEventListener("pv:data-updated", handler);
  return () => window.removeEventListener("pv:data-updated", handler);
}
