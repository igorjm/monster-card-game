-- Schema for the "Lobisomem por Uma Noite - Monstros" online game.
-- Applied to the Supabase project as migration `create_rooms`.

create table public.rooms (
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

-- Career wins keyed by the private browser token (same device/browser).
create table if not exists public.player_stats (
  token text primary key,
  nickname text not null default '',
  wins integer not null default 0,
  updated_at timestamptz not null default now()
);

-- All access goes through the service role in Next.js API routes.
-- RLS enabled with no policies = deny all for anon/authenticated.
alter table public.rooms enable row level security;
alter table public.player_stats enable row level security;
