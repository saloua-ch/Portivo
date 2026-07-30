-- Portivo — tighten RLS now that a real login exists
-- Run this in the Supabase SQL Editor AFTER creating the
-- soulef@genmaritime.net user in Authentication → Users.
--
-- The initial schema (20260713000000) deliberately left containers and
-- import_history open to the `anon` role, with a comment to add auth
-- later. Now that the app has a login page, this migration replaces
-- those anon policies with authenticated-only ones, so the anon key
-- alone (which ships in the browser bundle) is no longer enough to
-- read or write data — a signed-in session is required.
--
-- IMPORTANT: run this only after the login flow is deployed and the
-- Supabase user exists, or the app will show empty pages until someone
-- signs in.

-- ─── Containers ───────────────────────────────────────────────────────────────

drop policy if exists "containers_select_anon" on public.containers;
drop policy if exists "containers_insert_anon" on public.containers;
drop policy if exists "containers_update_anon" on public.containers;
drop policy if exists "containers_delete_anon" on public.containers;

create policy "containers_select_authenticated" on public.containers
  for select to authenticated using (true);

create policy "containers_insert_authenticated" on public.containers
  for insert to authenticated with check (true);

create policy "containers_update_authenticated" on public.containers
  for update to authenticated using (true) with check (true);

create policy "containers_delete_authenticated" on public.containers
  for delete to authenticated using (true);

-- ─── Import history ───────────────────────────────────────────────────────────

drop policy if exists "import_history_select_anon" on public.import_history;
drop policy if exists "import_history_insert_anon" on public.import_history;
drop policy if exists "import_history_update_anon" on public.import_history;
drop policy if exists "import_history_delete_anon" on public.import_history;

create policy "import_history_select_authenticated" on public.import_history
  for select to authenticated using (true);

create policy "import_history_insert_authenticated" on public.import_history
  for insert to authenticated with check (true);

create policy "import_history_update_authenticated" on public.import_history
  for update to authenticated using (true) with check (true);

create policy "import_history_delete_authenticated" on public.import_history
  for delete to authenticated using (true);
