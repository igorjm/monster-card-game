-- Idempotent baseline for databases that were originally created from
-- supabase/schema.sql before this repository adopted CLI migrations.
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  phase text not null default 'lobby',
  host_id uuid not null,
  settings jsonb not null default '{"discussionSeconds": 300}'::jsonb,
  players jsonb not null default '[]'::jsonb,
  game jsonb,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_stats (
  token text primary key,
  nickname text not null default '',
  wins integer not null default 0,
  updated_at timestamptz not null default now()
);

-- The browser only subscribes to Realtime broadcasts. All table access goes
-- through server routes using the secret key, so public roles get no policy.
alter table public.rooms enable row level security;
alter table public.player_stats enable row level security;
