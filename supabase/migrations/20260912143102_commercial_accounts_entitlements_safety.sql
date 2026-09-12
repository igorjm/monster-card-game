-- Commercial account, entitlement, safety, and expiry model.
create table if not exists public.host_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_band text not null default 'unknown' check (age_band in ('unknown', '13-17', 'adult')),
  adult_confirmed_at timestamptz,
  xp integer not null default 0 check (xp >= 0),
  matches_hosted integer not null default 0 check (matches_hosted >= 0),
  achievements jsonb not null default '[]'::jsonb,
  title text,
  profile_frame text,
  room_background text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null check (product_id in (
    'remove-ads', 'pack-studio-caos', 'pack-orbita-sabotagem', 'founders-bundle'
  )),
  purchase_source text not null check (purchase_source in ('mercado-pago', 'apple', 'google', 'manual')),
  external_transaction_id text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (purchase_source, external_transaction_id, product_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create table if not exists public.purchase_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null check (product_id in (
    'remove-ads', 'pack-studio-caos', 'pack-orbita-sabotagem', 'founders-bundle'
  )),
  provider text not null,
  expected_amount_cents integer not null check (expected_amount_cents > 0),
  currency text not null default 'BRL',
  external_reference text unique,
  status text not null default 'pending',
  provider_payment_id text,
  provider_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  reporter_player_id uuid not null,
  reported_player_id uuid,
  category text not null,
  details text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create table if not exists public.host_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  match_key text not null,
  xp integer not null check (xp > 0),
  created_at timestamptz not null default now(),
  unique (room_id, match_key)
);

alter table public.rooms add column if not exists host_user_id uuid references auth.users(id) on delete set null;
alter table public.rooms add column if not exists media_policy jsonb not null default '{"microphoneAllowed":true,"cameraAllowed":true,"cameraMaxHeight":360,"cameraDisabledDuringNight":true,"recordingAllowed":false}'::jsonb;
alter table public.rooms add column if not exists blocked_tokens jsonb not null default '[]'::jsonb;
alter table public.rooms add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');

update public.rooms set theme_id = 'vila-criaturas' where theme_id = 'monstros';
alter table public.rooms alter column theme_id set default 'vila-criaturas';

create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists entitlements_user_active_idx on public.entitlements(user_id) where revoked_at is null;
create index if not exists safety_reports_expires_at_idx on public.safety_reports(expires_at);

alter table public.host_profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.payment_events enable row level security;
alter table public.purchase_intents enable row level security;
alter table public.safety_reports enable row level security;
alter table public.host_progress_events enable row level security;

-- Current Supabase projects may not auto-expose new tables. Grant the server
-- role explicitly and remove every direct browser privilege.
revoke all on table public.rooms, public.player_stats, public.host_profiles,
  public.entitlements, public.payment_events, public.purchase_intents,
  public.safety_reports, public.host_progress_events from anon, authenticated;
grant select, insert, update, delete on table public.rooms, public.player_stats,
  public.host_profiles, public.entitlements, public.payment_events,
  public.purchase_intents, public.safety_reports, public.host_progress_events
  to service_role;

-- Automatic expiry is database-owned so abandoned rooms do not depend on a
-- future browser visit. Supabase local/hosted Postgres includes pg_cron.
create extension if not exists pg_cron with schema pg_catalog;
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'purge-mesa-oculta-data') then
    perform cron.schedule(
      'purge-mesa-oculta-data',
      '17 * * * *',
      'delete from public.rooms where expires_at < now(); delete from public.safety_reports where expires_at < now();'
    );
  end if;
end $$;

-- All application access remains server-only through the service role.
