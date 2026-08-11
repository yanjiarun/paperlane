-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- Paperlane only stores reading state and compact paper metadata, never article files.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled_sources text[] not null default '{}',
  range_days integer not null default 30 check (range_days in (1, 3, 7, 30, 90, 180, 365)),
  ieee_scope text not null default 'ea+1' check (ieee_scope in ('ea', '1', '2', '3', '5', 'ea+1', 'ea+2', 'ea+3', 'ea+5')),
  updated_at timestamptz not null default now(),
  check (cardinality(enabled_sources) <= 100)
);

create table if not exists public.paper_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text not null check (length(paper_id) between 1 and 300),
  is_read boolean not null default false,
  is_important boolean not null default false,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, paper_id)
);

create table if not exists public.collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  name text not null check (length(name) between 1 and 24),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.collection_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id text not null check (length(collection_id) between 1 and 100),
  paper_id text not null check (length(paper_id) between 1 and 300),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, collection_id, paper_id)
);

create table if not exists public.saved_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text not null check (length(paper_id) between 1 and 300),
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, paper_id),
  check (pg_column_size(snapshot) <= 32768)
);

alter table public.user_settings enable row level security;
alter table public.paper_states enable row level security;
alter table public.collections enable row level security;
alter table public.collection_papers enable row level security;
alter table public.saved_papers enable row level security;

alter table public.user_settings force row level security;
alter table public.paper_states force row level security;
alter table public.collections force row level security;
alter table public.collection_papers force row level security;
alter table public.saved_papers force row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['user_settings', 'paper_states', 'collections', 'collection_papers', 'saved_papers']
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', table_name || '_delete_own', table_name);
  end loop;
end $$;

revoke all on public.user_settings, public.paper_states, public.collections, public.collection_papers, public.saved_papers from anon;
grant select, insert, update, delete on public.user_settings, public.paper_states, public.collections, public.collection_papers, public.saved_papers to authenticated;
