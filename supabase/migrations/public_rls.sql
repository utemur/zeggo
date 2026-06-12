-- Public read policies (no authentication required)
-- Run this in Supabase SQL Editor after schema.sql

-- businesses: clients look up a business by slug
create policy "public can read businesses"
  on businesses for select
  using (true);

-- services: clients browse available services
create policy "public can read services"
  on services for select
  using (true);

-- staff: clients choose a staff member
create policy "public can read staff"
  on staff for select
  using (true);

-- slots: clients check available time slots
create policy "public can read slots"
  on slots for select
  using (true);

-- slots: booking API marks a slot as unavailable when booked
create policy "public can claim slots"
  on slots for update
  using (true)
  with check (true);

-- bookings: clients submit a booking
create policy "public can create bookings"
  on bookings for insert
  with check (true);
