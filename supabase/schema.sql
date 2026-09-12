-- Schema snapshot for the Mesa Oculta working-title application.
-- Applied to the Supabase project as migration `create_rooms`.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  theme_id text not null default 'vila-criaturas',
  phase text not null default 'lobby',
  host_id uuid not null,
  host_user_id uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{"discussionSeconds": 300}'::jsonb,
  players jsonb not null default '[]'::jsonb,
  game jsonb,
  media_policy jsonb not null default '{"microphoneAllowed":true,"cameraAllowed":true,"cameraMaxHeight":360,"cameraDisabledDuringNight":true,"recordingAllowed":false}'::jsonb,
  blocked_tokens jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null default (now() + interval '24 hours'),
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

-- The full account, commerce, and safety schema is maintained by migrations.
-- Run `supabase db reset --local` rather than applying this snapshot piecemeal.
