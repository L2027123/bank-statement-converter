-- Add anon SELECT policy on page_views so the admin stats API
-- (using the anon key via Supabase JS client) can read analytics data.

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  session_id text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);

create index if not exists page_views_session_idx
  on public.page_views (session_id);

alter table public.page_views enable row level security;

-- Drop existing policies (idempotent) then recreate
drop policy if exists "page_views_insert_anon" on public.page_views;
drop policy if exists "page_views_select_anon" on public.page_views;

-- Anyone (anon + authenticated) can insert page-view events
create policy "page_views_insert_anon" on public.page_views
  for insert to anon, authenticated with check (true);

-- Anyone (anon + authenticated) can select page-view aggregates
-- (analytics data only — no PII)
create policy "page_views_select_anon" on public.page_views
  for select to anon, authenticated using (true);
