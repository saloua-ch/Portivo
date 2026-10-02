// Unified auth API — picks the standalone backend's auth when configured,
// otherwise a local-only fallback. Pages import from here only, same
// pattern as storage.js.

import { isBackendConfigured } from "./backendClient";
import * as local from "./authLocal";
import * as remote from "./authBackend";

const backend = isBackendConfigured() ? remote : local;

if (!isBackendConfigured() && import.meta.env.DEV) {
  console.info(
    "[Portivo] Backend API not configured — using local-only auth. " +
    "Add VITE_API_URL to .env (and run the backend/ app) to enable real auth."
  );
}

export const signIn       = backend.signIn;
export const signOut      = backend.signOut;
export const getSession   = backend.getSession;
export const onAuthChange = backend.onAuthChange;
