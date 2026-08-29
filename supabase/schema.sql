-- ============================================
-- CNCP Scheduler — Supabase Schema (idempotent)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE
-- ============================================

-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────
-- 1. PROFILES
-- Extends Supabase auth.users with app-specific data
-- ────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  email      text not null,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ────────────────────────────────────────────
-- 2. DEPARTMENTS
-- Groups of people (e.g., Operations, Technology)
-- ────────────────────────────────────────────
create table if not exists public.departments (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  color      text not null default '#1a3a6b',
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────
-- 3. AVAILABLE DATES
-- Admin sets which dates are open for booking per department
-- ────────────────────────────────────────────
create table if not exists public.available_dates (
  id            uuid primary key default uuid_generate_v4(),
  date          date not null,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.available_dates add column if not exists department_id uuid references public.departments(id) on delete cascade;
alter table public.available_dates add column if not exists time_ranges jsonb not null default '[]'::jsonb;

do $$
begin
  -- Drop old single-column unique constraint if it exists
  if exists (
    select 1 from pg_constraint where conname = 'available_dates_date_key'
  ) then
    alter table public.available_dates drop constraint available_dates_date_key;
  end if;

  -- Add composite unique constraint if not exists
  if not exists (
    select 1 from pg_constraint where conname = 'available_dates_department_id_date_unique'
  ) then
    alter table public.available_dates
      add constraint available_dates_department_id_date_unique unique (department_id, date);
  end if;
end $$;

create index if not exists idx_available_dates_dept on public.available_dates(department_id);
create index if not exists idx_available_dates_date on public.available_dates(date);
create index if not exists idx_available_dates_active on public.available_dates(is_active);

-- ────────────────────────────────────────────
-- 4. TIME SLOTS
-- Each available date has multiple time slots
-- ────────────────────────────────────────────
create table if not exists public.time_slots (
  id                uuid primary key default uuid_generate_v4(),
  available_date_id uuid not null references public.available_dates(id) on delete cascade,
  time              text not null,
  is_taken          boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_time_slots_date on public.time_slots(available_date_id);
create index if not exists idx_time_slots_taken on public.time_slots(is_taken);

-- ────────────────────────────────────────────
-- 5. INTERVIEW LINKS
-- Shareable booking links for specific departments
-- ────────────────────────────────────────────
create table if not exists public.interview_links (
  id            uuid primary key default uuid_generate_v4(),
  department_id uuid not null references public.departments(id) on delete cascade,
  slug          text not null unique,
  title         text not null,
  description   text,
  date_from     date not null,
  date_to       date not null,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_interview_links_dept on public.interview_links(department_id);
create index if not exists idx_interview_links_slug on public.interview_links(slug);
create index if not exists idx_interview_links_active on public.interview_links(is_active);

-- ────────────────────────────────────────────
-- 6. BOOKINGS
-- Users book a specific time slot on a specific date
-- ────────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default uuid_generate_v4(),
  full_name         text not null,
  email             text not null,
  status            text not null default 'confirmed'
                      check (status in ('confirmed', 'cancelled', 'completed')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.bookings add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.bookings add column if not exists department_id uuid not null references public.departments(id) on delete cascade;
alter table public.bookings add column if not exists available_date_id uuid not null references public.available_dates(id) on delete cascade;
alter table public.bookings add column if not exists time_slot_id uuid not null references public.time_slots(id) on delete cascade;

create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_date on public.bookings(available_date_id);
create index if not exists idx_bookings_status on public.bookings(status);

-- Unique constraint: one booking per time slot
create unique index if not exists idx_bookings_unique_slot
  on public.bookings(time_slot_id)
  where status = 'confirmed';

-- ────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.available_dates enable row level security;
alter table public.time_slots enable row level security;
alter table public.interview_links enable row level security;
alter table public.bookings enable row level security;

-- Profiles: users can read all profiles, update only their own
drop policy if exists "Profiles: anyone can read" on public.profiles;
create policy "Profiles: anyone can read"
  on public.profiles for select
  using (true);

drop policy if exists "Profiles: users can update own" on public.profiles;
create policy "Profiles: users can update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Departments: anyone authenticated can read, admins can manage
drop policy if exists "Departments: authenticated read" on public.departments;
create policy "Departments: authenticated read"
  on public.departments for select
  to authenticated
  using (true);

drop policy if exists "Departments: admin insert" on public.departments;
create policy "Departments: admin insert"
  on public.departments for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Departments: admin update" on public.departments;
create policy "Departments: admin update"
  on public.departments for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Departments: admin delete" on public.departments;
create policy "Departments: admin delete"
  on public.departments for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Available dates: anyone authenticated can read, admins can manage
drop policy if exists "Available dates: authenticated read" on public.available_dates;
create policy "Available dates: authenticated read"
  on public.available_dates for select
  to authenticated
  using (true);

drop policy if exists "Available dates: public read" on public.available_dates;
create policy "Available dates: public read"
  on public.available_dates for select
  using (true);

drop policy if exists "Available dates: admin insert" on public.available_dates;
create policy "Available dates: admin insert"
  on public.available_dates for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Available dates: admin update" on public.available_dates;
create policy "Available dates: admin update"
  on public.available_dates for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Available dates: admin delete" on public.available_dates;
create policy "Available dates: admin delete"
  on public.available_dates for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Time slots: anyone authenticated can read, admins can manage
drop policy if exists "Time slots: authenticated read" on public.time_slots;
create policy "Time slots: authenticated read"
  on public.time_slots for select
  to authenticated
  using (true);

drop policy if exists "Time slots: public read" on public.time_slots;
create policy "Time slots: public read"
  on public.time_slots for select
  using (true);

drop policy if exists "Time slots: admin insert" on public.time_slots;
create policy "Time slots: admin insert"
  on public.time_slots for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Time slots: admin update" on public.time_slots;
create policy "Time slots: admin update"
  on public.time_slots for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Interview links: anyone can read active links, admins can manage
drop policy if exists "Interview links: public read active" on public.interview_links;
create policy "Interview links: public read active"
  on public.interview_links for select
  using (is_active = true);

drop policy if exists "Interview links: authenticated read all" on public.interview_links;
create policy "Interview links: authenticated read all"
  on public.interview_links for select
  to authenticated
  using (true);

drop policy if exists "Interview links: admin insert" on public.interview_links;
create policy "Interview links: admin insert"
  on public.interview_links for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Interview links: admin update" on public.interview_links;
create policy "Interview links: admin update"
  on public.interview_links for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Interview links: admin delete" on public.interview_links;
create policy "Interview links: admin delete"
  on public.interview_links for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Bookings: users can read their own, admins can read all
drop policy if exists "Bookings: users read own" on public.bookings;
create policy "Bookings: users read own"
  on public.bookings for select
  using (auth.uid() = user_id);

drop policy if exists "Bookings: users read own by email" on public.bookings;
create policy "Bookings: users read own by email"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.email = bookings.email
    )
  );

drop policy if exists "Bookings: users insert own" on public.bookings;
create policy "Bookings: users insert own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Bookings: public insert" on public.bookings;
create policy "Bookings: public insert"
  on public.bookings for insert
  with check (user_id is null);

drop policy if exists "Bookings: users update own" on public.bookings;
create policy "Bookings: users update own"
  on public.bookings for update
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────
-- 8. HELPER FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────

-- Function to mark a time slot as taken when booking is created
create or replace function public.book_slot()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.time_slots
  set is_taken = true
  where id = new.time_slot_id;
  return new;
end;
$$;

drop trigger if exists on_booking_created on public.bookings;
create trigger on_booking_created
  after insert on public.bookings
  for each row
  execute function public.book_slot();

-- Function to release a time slot when booking is cancelled
create or replace function public.cancel_booking_slot()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update public.time_slots
    set is_taken = false
    where id = new.time_slot_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_updated on public.bookings;
create trigger on_booking_updated
  after update on public.bookings
  for each row
  execute function public.cancel_booking_slot();
