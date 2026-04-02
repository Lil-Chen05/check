-- ─── Profiles table ────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default 'Player',
  wins integer not null default 0,
  games_played integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─── Auto-create profile on signup ─────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Player')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── RPC helpers for atomic counter increments ─────
create or replace function public.increment_wins(user_id uuid)
returns void as $$
begin
  update public.profiles
  set wins = wins + 1
  where id = user_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_games_played(user_id uuid)
returns void as $$
begin
  update public.profiles
  set games_played = games_played + 1
  where id = user_id;
end;
$$ language plpgsql security definer;
