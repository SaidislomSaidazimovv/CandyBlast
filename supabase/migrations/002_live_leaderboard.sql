create extension if not exists pgcrypto;

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  score bigint not null check (score >= 0 and score <= 100000000),
  level integer not null check (level between 1 and 20),
  stars integer not null check (stars between 0 and 3),
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_scores_score_idx on public.leaderboard_scores (score desc);
create index if not exists leaderboard_scores_week_idx on public.leaderboard_scores (created_at desc, score desc);
create index if not exists leaderboard_scores_player_idx on public.leaderboard_scores (user_id, score desc);

alter table public.leaderboard_scores enable row level security;

drop policy if exists "Anyone can read leaderboard scores" on public.leaderboard_scores;
create policy "Anyone can read leaderboard scores"
on public.leaderboard_scores for select to anon, authenticated
using (true);

drop policy if exists "Players can submit their own scores" on public.leaderboard_scores;
create policy "Players can submit their own scores"
on public.leaderboard_scores for insert to authenticated
with check (auth.uid() = user_id);

revoke all on table public.leaderboard_scores from anon;
grant select on table public.leaderboard_scores to anon;
grant select, insert on table public.leaderboard_scores to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leaderboard_scores'
  ) then
    alter publication supabase_realtime add table public.leaderboard_scores;
  end if;
end $$;
