-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create generation_quotas table
create table if not exists generation_quotas (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null unique,
  generations_today integer default 0,
  last_generation_date timestamp with time zone default now(),
  total_generations integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create generation_records table
create table if not exists generation_records (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  prompt text not null,
  image_url text not null,
  status text not null default 'completed',
  model_version text not null,
  generation_params jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for better query performance
create index if not exists idx_generation_quotas_user_id on generation_quotas(user_id);
create index if not exists idx_generation_records_user_id on generation_records(user_id);
create index if not exists idx_generation_records_status on generation_records(status);

-- Enable Row Level Security (RLS)
alter table generation_quotas enable row level security;
alter table generation_records enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can read their own quota" on generation_quotas;
drop policy if exists "Service role can manage quotas" on generation_quotas;
drop policy if exists "Users can read their own generations" on generation_records;
drop policy if exists "Service role can manage records" on generation_records;

-- RLS Policies for generation_quotas
create policy "Enable all access for service role on quotas"
  on generation_quotas for all
  using (true)
  with check (true);

create policy "Users can read their own quota"
  on generation_quotas for select
  using (auth.uid()::text = user_id);

-- RLS Policies for generation_records
create policy "Enable all access for service role on records"
  on generation_records for all
  using (true)
  with check (true);

create policy "Users can read their own generations"
  on generation_records for select
  using (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_generation_quotas_updated_at
  before update on generation_quotas
  for each row
  execute function update_updated_at_column();

create trigger update_generation_records_updated_at
  before update on generation_records
  for each row
  execute function update_updated_at_column(); 