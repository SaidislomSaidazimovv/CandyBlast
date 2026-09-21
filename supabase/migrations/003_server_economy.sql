-- Server-authoritative lives, boosters, daily claims and lucky spins.
-- Run once in Supabase Dashboard > SQL Editor after 001 and 002.
create table if not exists public.player_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lives integer not null default 5 check (lives between 0 and 5),
  extra_moves integer not null default 2 check (extra_moves between 0 and 999),
  hammers integer not null default 1 check (hammers between 0 and 999),
  bombs integer not null default 1 check (bombs between 0 and 999),
  spins integer not null default 3 check (spins between 0 and 999),
  gold_bars integer not null default 0 check (gold_bars between 0 and 1000000),
  last_life_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.economy_daily_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_claim_date date,
  streak_day integer not null default 0 check (streak_day between 0 and 30)
);

create table if not exists public.economy_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_key text not null,
  reward_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, claim_key)
);

create table if not exists public.level_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 20),
  stars integer not null check (stars between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, level)
);

alter table public.player_wallets enable row level security;
alter table public.economy_daily_state enable row level security;
alter table public.economy_claims enable row level security;
alter table public.level_reward_claims enable row level security;

revoke all on table public.player_wallets, public.economy_daily_state, public.economy_claims, public.level_reward_claims from anon, authenticated;

create or replace function public.economy_get_state()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  wallet public.player_wallets%rowtype;
  daily public.economy_daily_state%rowtype;
  gained integer := 0;
  today_utc date := (now() at time zone 'utc')::date;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  insert into public.player_wallets(user_id) values(uid) on conflict do nothing;
  insert into public.economy_daily_state(user_id) values(uid) on conflict do nothing;
  select * into wallet from public.player_wallets where user_id=uid for update;
  if wallet.lives < 5 then
    if wallet.last_life_at is null then wallet.last_life_at := now(); end if;
    gained := greatest(0,floor(extract(epoch from (now()-wallet.last_life_at))/1800)::integer);
    if gained > 0 then
      wallet.lives := least(5,wallet.lives+gained);
      wallet.last_life_at := case when wallet.lives=5 then null else wallet.last_life_at+(gained*interval '30 minutes') end;
      update public.player_wallets set lives=wallet.lives,last_life_at=wallet.last_life_at,updated_at=now() where user_id=uid;
    end if;
  end if;
  select * into daily from public.economy_daily_state where user_id=uid;
  return jsonb_build_object('lives',wallet.lives,'extra_moves',wallet.extra_moves,'hammers',wallet.hammers,'bombs',wallet.bombs,'spins',wallet.spins,'gold_bars',wallet.gold_bars,'last_life_at',wallet.last_life_at,'streak_day',daily.streak_day,'daily_claimed_today',daily.last_claim_date=today_utc,'server_time',now());
end;
$$;

create or replace function public.economy_consume(p_item text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid := auth.uid(); wallet public.player_wallets%rowtype;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  perform public.economy_get_state();
  select * into wallet from public.player_wallets where user_id=uid for update;
  if p_item='life' and wallet.lives>0 then update public.player_wallets set lives=lives-1,last_life_at=coalesce(last_life_at,now()),updated_at=now() where user_id=uid;
  elsif p_item='extraMoves' and wallet.extra_moves>0 then update public.player_wallets set extra_moves=extra_moves-1,updated_at=now() where user_id=uid;
  elsif p_item='hammer' and wallet.hammers>0 then update public.player_wallets set hammers=hammers-1,updated_at=now() where user_id=uid;
  elsif p_item='bomb' and wallet.bombs>0 then update public.player_wallets set bombs=bombs-1,updated_at=now() where user_id=uid;
  else raise exception 'insufficient_%',p_item; end if;
  return public.economy_get_state();
end;
$$;

create or replace function public.economy_claim_daily()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid(); daily public.economy_daily_state%rowtype; day_no integer; today_utc date := (now() at time zone 'utc')::date;
  reward text; add_lives integer:=0; add_moves integer:=0; add_hammers integer:=0; add_bombs integer:=0; add_spins integer:=0;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  insert into public.player_wallets(user_id) values(uid) on conflict do nothing;
  insert into public.economy_daily_state(user_id) values(uid) on conflict do nothing;
  select * into daily from public.economy_daily_state where user_id=uid for update;
  if daily.last_claim_date=today_utc then raise exception 'daily_already_claimed'; end if;
  day_no := case when daily.last_claim_date=today_utc-1 then (daily.streak_day%30)+1 else 1 end;
  case day_no
    when 1 then reward:='extra_moves_1';add_moves:=1; when 2 then reward:='life_1';add_lives:=1; when 3 then reward:='extra_moves_1';add_moves:=1;
    when 4 then reward:='extra_moves_2';add_moves:=2; when 5 then reward:='life_2';add_lives:=2; when 6 then reward:='hammer_2';add_hammers:=2;
    when 7 then reward:='booster_pack';add_moves:=1;add_hammers:=1;add_bombs:=1; when 8 then reward:='extra_moves_2';add_moves:=2;
    when 9 then reward:='life_2';add_lives:=2; when 10 then reward:='bomb_2';add_bombs:=2; when 11 then reward:='extra_moves_3';add_moves:=3;
    when 12 then reward:='life_3';add_lives:=3; when 13 then reward:='spin_1';add_spins:=1; when 14 then reward:='big_pack';add_moves:=2;add_hammers:=2;add_bombs:=2;
    when 15 then reward:='extra_moves_3';add_moves:=3; when 16 then reward:='life_3';add_lives:=3; when 17 then reward:='extra_moves_3';add_moves:=3;
    when 18 then reward:='hammer_3';add_hammers:=3; when 19 then reward:='bomb_3';add_bombs:=3; when 20 then reward:='spin_1';add_spins:=1;
    when 21 then reward:='mega_pack';add_moves:=3;add_hammers:=3;add_bombs:=3; when 22 then reward:='life_4';add_lives:=4;
    when 23 then reward:='extra_moves_5';add_moves:=5; when 24 then reward:='all_2';add_moves:=2;add_hammers:=2;add_bombs:=2;
    when 25 then reward:='life_5';add_lives:=5; when 26 then reward:='spin_1';add_spins:=1; when 27 then reward:='mega_pack_2';add_moves:=6;add_hammers:=6;add_bombs:=6;
    when 28 then reward:='jackpot_pack';add_lives:=5;add_moves:=2;add_hammers:=2;add_bombs:=2;
    when 29 then reward:='all_3';add_lives:=5;add_moves:=3;add_hammers:=3;add_bombs:=3;
    else reward:='grand_jackpot';add_lives:=5;add_moves:=5;add_hammers:=5;add_bombs:=5;add_spins:=1;
  end case;
  update public.player_wallets set lives=least(5,lives+add_lives),extra_moves=least(999,extra_moves+add_moves),hammers=least(999,hammers+add_hammers),bombs=least(999,bombs+add_bombs),spins=least(999,spins+add_spins),last_life_at=case when least(5,lives+add_lives)=5 then null else last_life_at end,updated_at=now() where user_id=uid;
  update public.economy_daily_state set last_claim_date=today_utc,streak_day=day_no where user_id=uid;
  insert into public.economy_claims(user_id,claim_key,reward_key) values(uid,'daily:'||today_utc,reward);
  return jsonb_build_object('reward_key',reward,'streak_day',day_no,'state',public.economy_get_state());
end;
$$;

create or replace function public.economy_spin()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid := auth.uid(); wallet public.player_wallets%rowtype; roll integer; prize integer;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  perform public.economy_get_state();select * into wallet from public.player_wallets where user_id=uid for update;
  if wallet.spins<=0 then raise exception 'no_spins_available'; end if;
  roll:=floor(random()*100)::integer;
  prize:=case when roll<10 then 0 when roll<20 then 1 when roll<36 then 2 when roll<53 then 3 when roll<70 then 4 when roll<78 then 5 when roll<86 then 6 when roll<93 then 7 else 8 end;
  update public.player_wallets set spins=spins-1,lives=least(5,lives+case when prize=0 then 5 when prize=2 then 3 when prize=6 then 1 else 0 end),extra_moves=least(999,extra_moves+case when prize=1 then 3 when prize=3 then 1 when prize=4 then 2 when prize=5 then 1 else 0 end),hammers=least(999,hammers+case when prize=1 then 3 when prize=3 then 1 when prize=7 then 1 else 0 end),bombs=least(999,bombs+case when prize=1 then 3 when prize=3 then 1 when prize=8 then 1 else 0 end),last_life_at=case when least(5,lives+case when prize=0 then 5 when prize=2 then 3 when prize=6 then 1 else 0 end)=5 then null else last_life_at end,updated_at=now() where user_id=uid;
  return jsonb_build_object('prize_index',prize,'state',public.economy_get_state());
end;
$$;

create or replace function public.economy_claim_weekly_bonus()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid:=auth.uid(); week_start date:=(date_trunc('week',now() at time zone 'utc'))::date; claim_count integer;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select count(*) into claim_count from public.economy_claims where user_id=uid and claim_key like 'daily:%' and created_at>=week_start::timestamptz and created_at<(week_start+7)::timestamptz;
  if claim_count<7 then raise exception 'weekly_bonus_locked'; end if;
  insert into public.economy_claims(user_id,claim_key,reward_key) values(uid,'weekly:'||week_start,'weekly_pack') on conflict do nothing;
  if not found then raise exception 'weekly_bonus_already_claimed'; end if;
  update public.player_wallets set lives=5,extra_moves=least(999,extra_moves+3),hammers=least(999,hammers+3),bombs=least(999,bombs+3),last_life_at=null,updated_at=now() where user_id=uid;
  return jsonb_build_object('state',public.economy_get_state());
end;
$$;

create or replace function public.economy_claim_level_reward(p_level integer,p_stars integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid:=auth.uid(); granted boolean:=false; item text;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if p_level not between 1 and 20 or p_stars not between 1 and 3 then raise exception 'invalid_level_result'; end if;
  insert into public.player_wallets(user_id) values(uid) on conflict do nothing;
  if p_stars=3 then
    insert into public.level_reward_claims(user_id,level,stars) values(uid,p_level,p_stars) on conflict do nothing;
    if found then granted:=true;item:=case p_level%3 when 1 then 'extraMoves' when 2 then 'hammer' else 'bomb' end;
      if item='extraMoves' then update public.player_wallets set extra_moves=least(999,extra_moves+1),updated_at=now() where user_id=uid;
      elsif item='hammer' then update public.player_wallets set hammers=least(999,hammers+1),updated_at=now() where user_id=uid;
      else update public.player_wallets set bombs=least(999,bombs+1),updated_at=now() where user_id=uid; end if;
    end if;
  end if;
  return jsonb_build_object('granted',granted,'item',item,'state',public.economy_get_state());
end;
$$;

revoke all on function public.economy_get_state(),public.economy_consume(text),public.economy_claim_daily(),public.economy_spin(),public.economy_claim_weekly_bonus(),public.economy_claim_level_reward(integer,integer) from public, anon;
grant execute on function public.economy_get_state(),public.economy_consume(text),public.economy_claim_daily(),public.economy_spin(),public.economy_claim_weekly_bonus(),public.economy_claim_level_reward(integer,integer) to authenticated;
