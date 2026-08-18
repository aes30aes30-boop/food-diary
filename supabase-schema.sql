-- Выполните этот код в Supabase: Project -> SQL Editor -> New query -> Run

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  meal text not null,
  time time,
  dish text not null,
  category text not null,
  subtype text,
  quantity numeric not null,
  unit text not null,
  portions numeric not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  amount_ml numeric not null,
  time time,
  created_at timestamptz default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  water_target_ml numeric default 1500
);

alter table entries enable row level security;
alter table water_logs enable row level security;
alter table user_settings enable row level security;

create policy "entries_select_own" on entries for select using (auth.uid() = user_id);
create policy "entries_insert_own" on entries for insert with check (auth.uid() = user_id);
create policy "entries_update_own" on entries for update using (auth.uid() = user_id);
create policy "entries_delete_own" on entries for delete using (auth.uid() = user_id);

create policy "water_select_own" on water_logs for select using (auth.uid() = user_id);
create policy "water_insert_own" on water_logs for insert with check (auth.uid() = user_id);
create policy "water_delete_own" on water_logs for delete using (auth.uid() = user_id);

create policy "settings_select_own" on user_settings for select using (auth.uid() = user_id);
create policy "settings_upsert_own" on user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on user_settings for update using (auth.uid() = user_id);
