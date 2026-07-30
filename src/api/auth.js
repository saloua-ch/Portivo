// Unified auth API — picks Supabase Auth when configured, otherwise a
// local-only fallback. Pages import from here only, same pattern as
// storage.js.

import { isSupabaseConfigured } from "./supabaseClient";
import * as local from "./authLocal";
import * as remote from "./authSupabase";

const backend = isSupabaseConfigured() ? remote : local;

if (!isSupabaseConfigured() && import.meta.env.DEV) {
  console.info(
    "[Portivo] Supabase not configured — using local-only auth. " +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, and create " +
    "the soulef@genmaritime.net user in Supabase Auth, to enable real auth."
  );
}

export const signIn       = backend.signIn;
export const signOut      = backend.signOut;
export const getSession   = backend.getSession;
export const onAuthChange = backend.onAuthChange;
