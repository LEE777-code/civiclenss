-- ============================================
-- Push Notifications: user_devices Table
-- ============================================
-- Stores FCM tokens for each user's device
-- Works with Clerk authentication (clerk_id)

create table if not exists user_devices (
  id uuid default gen_random_uuid() primary key,
  clerk_id text not null,  -- Clerk user ID
  fcm_token text not null unique,
  platform text default 'android',
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table user_devices enable row level security;

-- Policy: Users can manage their own device tokens
-- Uses clerk_id from the users table to match against clerk_id in user_devices
create policy "User can manage own device tokens"
on user_devices
for all
using (
  clerk_id in (
    select clerk_id from users where clerk_id = (
      select raw_user_meta_data->>'clerk_id' from auth.users where id = auth.uid()
    )
  )
);

-- Index for faster lookups
create index if not exists idx_user_devices_clerk_id on user_devices(clerk_id);
create index if not exists idx_user_devices_token on user_devices(fcm_token);

