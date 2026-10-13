create table if not exists public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saved jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  constraint saved_array check (jsonb_typeof(saved) = 'array' and jsonb_array_length(saved) <= 2000),
  constraint history_array check (jsonb_typeof(history) = 'array' and jsonb_array_length(history) <= 100),
  constraint library_size check (octet_length(saved::text) + octet_length(history::text) <= 262144)
);
alter table public.libraries enable row level security;
revoke all on public.libraries from anon, authenticated;
grant select, insert, update, delete on public.libraries to authenticated;
drop policy if exists "Read own library" on public.libraries;
create policy "Read own library" on public.libraries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own library" on public.libraries;
create policy "Create own library" on public.libraries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own library" on public.libraries;
create policy "Update own library" on public.libraries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own library" on public.libraries;
create policy "Delete own library" on public.libraries for delete to authenticated using ((select auth.uid()) = user_id);
