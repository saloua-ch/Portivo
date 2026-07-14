import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

export function getSupabase() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server."
    );
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}
