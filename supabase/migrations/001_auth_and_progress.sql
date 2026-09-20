-- Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  state jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_progress enable row level security;

drop policy if exists "Players can read their progress" on public.player_progress;
create policy "Players can read their progress"
on public.player_progress for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their progress" on public.player_progress;
create policy "Players can create their progress"
on public.player_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their progress" on public.player_progress;
create policy "Players can update their progress"
on public.player_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_player_progress_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_player_progress_updated_at on public.player_progress;
create trigger set_player_progress_updated_at
before update on public.player_progress
for each row execute function public.set_player_progress_updated_at();

revoke all on table public.player_progress from anon;
grant select, insert, update on table public.player_progress to authenticated;
