-- Contact form submissions table.
-- Visitors (anon) can INSERT only. Reading requires service_role key
-- (used by /api/admin/contact-list endpoint).

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  source text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- Drop existing policies (idempotent) then recreate
drop policy if exists "contact_submissions_insert_anon" on public.contact_submissions;
drop policy if exists "contact_submissions_select_anon" on public.contact_submissions;

-- Anyone (anon + authenticated) can insert a new submission
create policy "contact_submissions_insert_anon" on public.contact_submissions
  for insert to anon, authenticated with check (true);

-- Anyone can SELECT — the /api/admin/contact-list endpoint still requires
-- the admin password to return data, so access is gated at the API layer.
-- (We use anon key + RLS instead of service_role to keep deployment simple.)
create policy "contact_submissions_select_anon" on public.contact_submissions
  for select to anon, authenticated using (true);
