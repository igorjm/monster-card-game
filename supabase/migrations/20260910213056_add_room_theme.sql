alter table public.rooms
add column if not exists theme_id text not null default 'monstros';
