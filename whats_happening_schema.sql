-- ============================================================
--  what's happening — Supabase schema
--  Project: xhbalfyxkjjszgbvgefv
--
--  HOW TO RUN:
--  1. Go to https://supabase.com/dashboard/project/xhbalfyxkjjszgbvgefv/sql/new
--  2. Paste this entire file
--  3. Click "Run"
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. CITIES ────────────────────────────────────────────────
create table if not exists public.cities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  lat         double precision not null,
  lng         double precision not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ── 2. NEIGHBORHOODS ─────────────────────────────────────────
create table if not exists public.neighborhoods (
  id          uuid primary key default uuid_generate_v4(),
  city_id     uuid not null references public.cities(id) on delete cascade,
  name        text not null,
  slug        text not null,
  lat         double precision not null,
  lng         double precision not null,
  radius_m    int default 800,
  color       text default '#f97316',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  unique(city_id, slug)
);

-- ── 3. PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  avatar_url    text,
  home_city_id  uuid references public.cities(id),
  created_at    timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 4. POSTS ─────────────────────────────────────────────────
do $$ begin
  create type post_type as enum ('video', 'photo', 'text');
exception when duplicate_object then null;
end $$;

create table if not exists public.posts (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  neighborhood_id   uuid not null references public.neighborhoods(id) on delete cascade,
  type              post_type not null,
  caption           text,
  media_url         text,
  media_thumbnail   text,
  duration_sec      int check (duration_sec <= 10),
  poster_lat        double precision,
  poster_lng        double precision,
  expires_at        timestamptz not null default (now() + interval '4 hours'),
  is_removed        boolean default false,
  heat_score        int default 0,
  view_count        int default 0,
  created_at        timestamptz default now()
);

create index if not exists idx_posts_expires
  on public.posts(expires_at) where is_removed = false;
create index if not exists idx_posts_neighborhood
  on public.posts(neighborhood_id, created_at desc) where is_removed = false;
create index if not exists idx_posts_heat
  on public.posts(neighborhood_id, heat_score desc) where is_removed = false;

-- ── 5. REACTIONS ─────────────────────────────────────────────
do $$ begin
  create type reaction_type as enum ('fire', 'eyes', 'lol', 'heads_up');
exception when duplicate_object then null;
end $$;

create table if not exists public.reactions (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        reaction_type not null,
  created_at  timestamptz default now(),
  unique(post_id, user_id, type)
);

create index if not exists idx_reactions_post on public.reactions(post_id);

-- ── 6. COMMENTS ──────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  body        text not null,
  is_removed  boolean default false,
  created_at  timestamptz default now()
);

create index if not exists idx_comments_post
  on public.comments(post_id, created_at asc) where is_removed = false;

-- ── 7. NEIGHBORHOOD FOLLOWS ──────────────────────────────────
create table if not exists public.neighborhood_follows (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  created_at      timestamptz default now(),
  primary key (user_id, neighborhood_id)
);

-- ── 8. HEAT SCORE TRIGGER ────────────────────────────────────
create or replace function public.update_heat_score()
returns trigger language plpgsql as $$
declare
  target_post_id uuid;
  r_count int;
  c_count int;
begin
  target_post_id := coalesce(new.post_id, old.post_id);

  select count(*) into r_count
    from public.reactions where post_id = target_post_id;

  select count(*) into c_count
    from public.comments where post_id = target_post_id and is_removed = false;

  update public.posts
    set heat_score = (r_count * 3) + (c_count * 1)
    where id = target_post_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_heat_reactions on public.reactions;
create trigger trg_heat_reactions
  after insert or delete on public.reactions
  for each row execute procedure public.update_heat_score();

drop trigger if exists trg_heat_comments on public.comments;
create trigger trg_heat_comments
  after insert or delete on public.comments
  for each row execute procedure public.update_heat_score();

-- ── 9. NEIGHBORHOOD HEAT VIEW ────────────────────────────────
create or replace view public.neighborhood_heat as
select
  n.id,
  n.name,
  n.slug,
  n.city_id,
  n.lat,
  n.lng,
  n.color,
  n.radius_m,
  count(p.id)                     as post_count,
  coalesce(sum(p.heat_score), 0)  as total_heat,
  max(p.created_at)               as last_post_at
from public.neighborhoods n
left join public.posts p
  on  p.neighborhood_id = n.id
  and p.expires_at > now()
  and p.is_removed = false
where n.is_active = true
group by n.id;

-- ── 10. REALTIME ─────────────────────────────────────────────
-- Enable realtime on posts and reactions so the feed updates live
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;

-- ── 11. ROW LEVEL SECURITY ───────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.posts                enable row level security;
alter table public.reactions            enable row level security;
alter table public.comments             enable row level security;
alter table public.neighborhood_follows enable row level security;
alter table public.cities               enable row level security;
alter table public.neighborhoods        enable row level security;

-- Cities + neighborhoods: public read only
create policy "cities_public_read"
  on public.cities for select using (true);
create policy "neighborhoods_public_read"
  on public.neighborhoods for select using (true);

-- Profiles
create policy "profiles_public_read"
  on public.profiles for select using (true);
create policy "profiles_own_insert"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update"
  on public.profiles for update using (auth.uid() = id);

-- Posts
create policy "posts_public_read"
  on public.posts for select
  using (is_removed = false and expires_at > now());
create policy "posts_own_insert"
  on public.posts for insert
  with check (auth.uid() = user_id);
create policy "posts_own_delete"
  on public.posts for update
  using (auth.uid() = user_id);

-- Reactions
create policy "reactions_public_read"
  on public.reactions for select using (true);
create policy "reactions_own_insert"
  on public.reactions for insert
  with check (auth.uid() = user_id);
create policy "reactions_own_delete"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- Comments
create policy "comments_public_read"
  on public.comments for select using (is_removed = false);
create policy "comments_own_insert"
  on public.comments for insert
  with check (auth.uid() = user_id);
create policy "comments_own_delete"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Follows
create policy "follows_own_all"
  on public.neighborhood_follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 12. STORAGE BUCKET ───────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  52428800,  -- 50MB limit
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do nothing;

create policy "post_media_public_read"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "post_media_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and auth.role() = 'authenticated'
  );

create policy "post_media_own_delete"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── 13. SEED DATA ────────────────────────────────────────────
insert into public.cities (name, slug, lat, lng) values
  ('Seattle',   'seattle',   47.6062, -122.3321),
  ('St. Louis', 'st-louis',  38.6270,  -90.1994)
on conflict (slug) do nothing;

-- Seattle
with s as (select id from public.cities where slug = 'seattle')
insert into public.neighborhoods (city_id, name, slug, lat, lng, color, radius_m)
select s.id, n.name, n.slug, n.lat, n.lng, n.color, n.radius_m
from s, (values
  ('Waterfront',      'waterfront',      47.6065, -122.3416, '#f97316', 600),
  ('Belltown',        'belltown',        47.6154, -122.3469, '#3b82f6', 700),
  ('Capitol Hill',    'capitol-hill',    47.6253, -122.3222, '#8b5cf6', 900),
  ('Queen Anne',      'queen-anne',      47.6373, -122.3569, '#10b981', 900),
  ('Greenlake',       'greenlake',       47.6803, -122.3300, '#06b6d4', 800),
  ('Pioneer Square',  'pioneer-square',  47.6008, -122.3323, '#f59e0b', 600),
  ('Fremont',         'fremont',         47.6516, -122.3500, '#ec4899', 800),
  ('Ballard',         'ballard',         47.6677, -122.3839, '#14b8a6', 1000),
  ('South Lake Union','south-lake-union',47.6227, -122.3361, '#6366f1', 700),
  ('First Hill',      'first-hill',      47.6107, -122.3202, '#84cc16', 700)
) as n(name, slug, lat, lng, color, radius_m)
on conflict (city_id, slug) do nothing;

-- St. Louis
with s as (select id from public.cities where slug = 'st-louis')
insert into public.neighborhoods (city_id, name, slug, lat, lng, color, radius_m)
select s.id, n.name, n.slug, n.lat, n.lng, n.color, n.radius_m
from s, (values
  ('Downtown',      'downtown',      38.6270, -90.1994, '#f97316', 800),
  ('Chesterfield',  'chesterfield',  38.6637, -90.5774, '#3b82f6', 1200),
  ('Clayton',       'clayton',       38.6431, -90.3229, '#8b5cf6', 900),
  ('Webster Groves','webster-groves',38.5934, -90.3551, '#10b981', 1000),
  ('Forest Park',   'forest-park',   38.6375, -90.2853, '#06b6d4', 800),
  ('Soulard',       'soulard',       38.6057, -90.2099, '#f59e0b', 700),
  ('The Hill',      'the-hill',      38.6090, -90.2717, '#ec4899', 700),
  ('Midtown',       'midtown',       38.6335, -90.2271, '#14b8a6', 800)
) as n(name, slug, lat, lng, color, radius_m)
on conflict (city_id, slug) do nothing;

-- ============================================================
--  Schema complete.
--  Tables: cities, neighborhoods, profiles, posts,
--          reactions, comments, neighborhood_follows
--  Views:  neighborhood_heat
--  Next: Settings → API → copy your anon key
-- ============================================================
