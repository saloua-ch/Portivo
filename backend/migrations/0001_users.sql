-- Portivo standalone backend — login users table.
--
-- Auth previously lived entirely in Supabase Auth (a single user created by
-- hand in the dashboard). This backend owns auth itself now, so it needs
-- somewhere to keep the password hash. Run this once against the same
-- Postgres database the `containers`/`import_history` tables already live
-- in (see supabase/migrations/ for those), then run `npm run seed:admin`
-- to create the login user from backend/.env.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
