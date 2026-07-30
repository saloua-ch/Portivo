// Supabase Auth backend — used automatically once VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set (see supabaseClient.js). Real server-side
// auth: Supabase issues and verifies the session token, and supabase-js
// persists it in localStorage under its own key — nothing to hand-roll.
//
// One-time setup in the Supabase dashboard (not something a migration
// file can safely do): Authentication → Users → Add user →
//   soulef@genmaritime.net / bendhibsoulef
// Tick "Auto Confirm User" so no confirmation email is required.

import { getSupabase } from "./supabaseClient";

export async function signIn(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  return data.session;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const supabase = getSupabase();
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.subscription.unsubscribe();
}
