-- Run this in your Supabase SQL Editor

-- Tier Lists
create table if not exists public.tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tier_lists enable row level security;

create policy "Users can manage their own tier lists"
  on public.tier_lists for all
  using (auth.uid() = user_id);

-- Tiers
create table if not exists public.tiers (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  label text not null default 'New',
  color text not null default '#AAAAAA',
  position integer not null default 0
);

alter table public.tiers enable row level security;

create policy "Users can manage tiers in their lists"
  on public.tiers for all
  using (
    exists (
      select 1 from public.tier_lists
      where id = tier_list_id and user_id = auth.uid()
    )
  );

-- Images
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.images enable row level security;

create policy "Users can manage their own images"
  on public.images for all
  using (auth.uid() = user_id);

-- Tier Items
create table if not exists public.tier_items (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  tier_id uuid references public.tiers(id) on delete set null,
  image_id uuid not null references public.images(id) on delete cascade,
  position integer not null default 0
);

alter table public.tier_items enable row level security;

create policy "Users can manage items in their lists"
  on public.tier_items for all
  using (
    exists (
      select 1 from public.tier_lists
      where id = tier_list_id and user_id = auth.uid()
    )
  );

-- Auto-update updated_at on tier_lists
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tier_lists_updated_at
  before update on public.tier_lists
  for each row execute function update_updated_at();

-- Storage bucket for images
-- Run in Supabase Dashboard > Storage: create a bucket named "images" with public access
-- Or run:
-- insert into storage.buckets (id, name, public) values ('images', 'images', true)
-- on conflict do nothing;

-- Storage policies
create policy "Users can upload their own images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);
