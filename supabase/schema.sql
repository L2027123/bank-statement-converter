-- ============================================================
--  Bank Statement Converter — Supabase schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ---------- Tables ----------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  credits_remaining int not null default 3,
  credits_reset_date date not null default ((date_trunc('month', now()) + interval '1 month')::date),
  created_at timestamptz not null default now()
);

create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  parsed_data jsonb,
  excel_url text,
  csv_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists statements_user_id_created_at_idx
  on public.statements (user_id, created_at desc);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists statements_set_updated_at on public.statements;
create trigger statements_set_updated_at
  before update on public.statements
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.statements enable row level security;

-- users: a user can read & update only their own row
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- statements: a user can manage only their own rows
create policy "statements_select_own" on public.statements
  for select using (auth.uid() = user_id);
create policy "statements_insert_own" on public.statements
  for insert with check (auth.uid() = user_id);
create policy "statements_update_own" on public.statements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "statements_delete_own" on public.statements
  for delete using (auth.uid() = user_id);

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, plan, credits_remaining, credits_reset_date)
  values (new.id, 'free', 3, (date_trunc('month', now()) + interval '1 month')::date)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  Storage buckets & policies
-- ============================================================

-- 'statements' bucket: PRIVATE (holds uploaded PDFs)
insert into storage.buckets (id, name, public) values ('statements', 'statements', false)
  on conflict (id) do nothing;

-- 'exports' bucket: PUBLIC read (holds generated Excel files)
insert into storage.buckets (id, name, public) values ('exports', 'exports', true)
  on conflict (id) do nothing;

-- statements: users can CRUD objects inside their own folder (first segment = user id)
create policy "statements_storage_read_own"  on storage.objects
  for select using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_storage_write_own" on storage.objects
  for insert with check (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_storage_update_own" on storage.objects
  for update using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_storage_delete_own" on storage.objects
  for delete using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);

-- exports: public read; users can write inside their own folder
create policy "exports_storage_public_read" on storage.objects
  for select using (bucket_id = 'exports');
create policy "exports_storage_write_own" on storage.objects
  for insert with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "exports_storage_update_own" on storage.objects
  for update using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
