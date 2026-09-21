-- Candy Blast player avatars shown in the live leaderboard.
alter table public.leaderboard_scores
  add column if not exists avatar text not null default 'berry';

alter table public.leaderboard_scores
  drop constraint if exists leaderboard_scores_avatar_check;

alter table public.leaderboard_scores
  add constraint leaderboard_scores_avatar_check
  check (avatar in ('berry','mint','star','diamond','grape','orange','prism','emblem'));
