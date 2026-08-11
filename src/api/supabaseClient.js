import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ADD THESE DEBUG LOGS TEMPORARILY:
console.log("[DEBUG] VITE_SUPABASE_URL:", url);
console.log("[DEBUG] VITE_SUPABASE_ANON_KEY:", anonKey ? "EXISTS" : "UNDEFINED");

let client = null;

export function isSupabaseConfigured() {
  return Boolean(
    url &&
    anonKey &&
    url.trim() !== "" &&
    anonKey.trim() !== ""
  );
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server."
    );
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}