-- Portivo — initial Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- or via: supabase db push

-- ─── Containers ───────────────────────────────────────────────────────────────

create table if not exists public.containers (
  id                text primary key,
  number            text not null unique,
  ref               text,
  sheet             text,
  import_id         text,
  status            text not null default 'in_transit',
  eta               text,
  etd               text,
  origin            text not null default '',
  destination       text not null default '',
  carrier           text not null default '',
  needs_attention   boolean not null default false,
  attention_reason  text,
  etd_verified      boolean not null default false,
  etd_verified_by   text,
  etd_verified_at   text,
  eta_verified      boolean not null default false,
  eta_verified_by   text,
  eta_verified_at   text,
  groupages         jsonb not null default '[]'::jsonb,
  timeline          jsonb not null default '[]'::jsonb,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists containers_status_idx on public.containers (status);
create index if not exists containers_eta_idx on public.containers (eta);
create index if not exists containers_import_id_idx on public.containers (import_id);

-- ─── Import history ───────────────────────────────────────────────────────────

create table if not exists public.import_history (
  id              text primary key,
  filename        text not null default '',
  at              text not null default '',
  ctr             integer not null default 0,
  grp             integer not null default 0,
  sheets          integer not null default 0,
  skipped         integer not null default 0,
  container_ids   jsonb not null default '[]'::jsonb,
  inserted_at     timestamptz not null default now()
);

create index if not exists import_history_inserted_at_idx
  on public.import_history (inserted_at desc);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists containers_set_updated_at on public.containers;
create trigger containers_set_updated_at
  before update on public.containers
  for each row execute function public.set_updated_at();

-- ─── Row Level Security (open anon access — add auth later) ───────────────────

alter table public.containers enable row level security;
alter table public.import_history enable row level security;

drop policy if exists "containers_select_anon" on public.containers;
create policy "containers_select_anon" on public.containers
  for select to anon, authenticated using (true);

drop policy if exists "containers_insert_anon" on public.containers;
create policy "containers_insert_anon" on public.containers
  for insert to anon, authenticated with check (true);

drop policy if exists "containers_update_anon" on public.containers;
create policy "containers_update_anon" on public.containers
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "containers_delete_anon" on public.containers;
create policy "containers_delete_anon" on public.containers
  for delete to anon, authenticated using (true);

drop policy if exists "import_history_select_anon" on public.import_history;
create policy "import_history_select_anon" on public.import_history
  for select to anon, authenticated using (true);

drop policy if exists "import_history_insert_anon" on public.import_history;
create policy "import_history_insert_anon" on public.import_history
  for insert to anon, authenticated with check (true);

drop policy if exists "import_history_update_anon" on public.import_history;
create policy "import_history_update_anon" on public.import_history
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "import_history_delete_anon" on public.import_history;
create policy "import_history_delete_anon" on public.import_history
  for delete to anon, authenticated using (true);

-- ─── Realtime (multi-tab / multi-user sync) ───────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.containers;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.import_history;
exception
  when duplicate_object then null;
end $$;
