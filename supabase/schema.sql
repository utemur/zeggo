-- ============================================================
-- Zeggo – Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ───────────────────────────────────────────────────

create table businesses (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  telegram_chat_id text,
  plan            text not null default 'free',
  created_at      timestamptz not null default now()
);

create table services (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  duration_minutes  int not null,
  price             numeric(10, 2) not null
);

create table staff (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  telegram_id   text
);

create table slots (
  id            uuid primary key default uuid_generate_v4(),
  staff_id      uuid not null references staff(id) on delete cascade,
  date          date not null,
  time          time not null,
  is_available  boolean not null default true
);

create table bookings (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references businesses(id) on delete cascade,
  service_id        uuid not null references services(id) on delete restrict,
  staff_id          uuid not null references staff(id) on delete restrict,
  client_name       text not null,
  client_phone      text not null,
  booking_datetime  timestamptz not null,
  status            text not null default 'pending',
  created_at        timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────

create index idx_bookings_business_id      on bookings(business_id);
create index idx_bookings_booking_datetime on bookings(booking_datetime);
create index idx_slots_staff_date          on slots(staff_id, date);

-- ── Row Level Security ────────────────────────────────────────

alter table businesses enable row level security;
alter table services    enable row level security;
alter table staff       enable row level security;
alter table slots       enable row level security;
alter table bookings    enable row level security;

-- ── RLS Policies: businesses ──────────────────────────────────

create policy "owners can view their own business"
  on businesses for select
  using (owner_id = auth.uid());

create policy "owners can insert their own business"
  on businesses for insert
  with check (owner_id = auth.uid());

create policy "owners can update their own business"
  on businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners can delete their own business"
  on businesses for delete
  using (owner_id = auth.uid());

-- ── RLS Policies: services ────────────────────────────────────

create policy "owners can manage services"
  on services for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- ── RLS Policies: staff ───────────────────────────────────────

create policy "owners can manage staff"
  on staff for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- ── RLS Policies: slots ───────────────────────────────────────

create policy "owners can manage slots"
  on slots for all
  using (
    staff_id in (
      select s.id from staff s
      join businesses b on b.id = s.business_id
      where b.owner_id = auth.uid()
    )
  )
  with check (
    staff_id in (
      select s.id from staff s
      join businesses b on b.id = s.business_id
      where b.owner_id = auth.uid()
    )
  );

-- ── RLS Policies: bookings ────────────────────────────────────

create policy "owners can manage bookings"
  on bookings for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
