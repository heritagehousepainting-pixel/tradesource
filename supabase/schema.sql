-- TradeSource Database Schema for Supabase

-- Users table (contractors and homeowners)
create table users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  user_type text check (user_type in ('CONTRACTOR', 'HOMEOWNER')) not null,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  trade_type text check (trade_type in ('PAINTER', 'GENERAL_CONTRACTOR')),
  service_counties text[],
  is_verified boolean default false,
  is_insured boolean default false,
  is_background_checked boolean default false,
  license_number text,
  license_verified boolean default false,
  insurance_provider text,
  insurance_expiry date,
  insurance_verified boolean default false,
  background_check_status text default 'PENDING',
  years_experience integer,
  profile_photo_url text,
  review_count integer default 0,
  avg_rating numeric(3,2) default 0,
  jobs_completed integer default 0,
  verification_status text default 'PENDING',
  verification_notes text,
  external_reviews text,  -- JSON array of review links
  portfolio_urls text[],   -- Array of portfolio image URLs
  subscription_tier text check (subscription_tier in ('BASIC', 'PRO', 'PREMIUM')) default 'BASIC',
  subscription_status text check (subscription_status in ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED')) default 'ACTIVE',
  availability boolean default false,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs table
create table jobs (
  id uuid default gen_random_uuid() primary key,
  posted_by uuid references users(id) not null,
  job_type text check (job_type in ('FULL', 'PIECE', 'B2C_PROJECT')) not null,
  title text not null,
  description text,
  county text not null,
  work_category text check (work_category in ('INTERIOR', 'EXTERIOR', 'BOTH')),
  property_type text check (property_type in ('RESIDENTIAL', 'COMMERCIAL', 'MIXED')),
  price_type text check (price_type in ('FIXED', 'HOURLY')),
  price_amount decimal,
  status text check (status in ('OPEN', 'AWARDED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')) default 'OPEN',
  is_b2c boolean default false,
  media_urls text[],  -- Array of image/video URLs
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interest/Applications table
create table interests (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) not null,
  user_id uuid references users(id) not null,
  message text,
  status text check (status in ('INTERESTED', 'DECLINED', 'SELECTED')) default 'INTERESTED',
  created_at timestamptz default now()
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) not null,
  sender_id uuid references users(id) not null,
  receiver_id uuid references users(id) not null,
  message_text text not null,
  created_at timestamptz default now()
);

-- Reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) not null,
  reviewer_id uuid references users(id) not null,
  reviewed_id uuid references users(id) not null,
  rating int check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table users enable row level security;
alter table jobs enable row level security;
alter table interests enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- RLS Policies
-- Users can read all users, update own
create policy "Users can read all users" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Jobs: anyone can read open jobs, users can create jobs
create policy "Anyone can read open jobs" on jobs for select using (status = 'OPEN');
create policy "Users can create jobs" on jobs for insert with check (auth.uid() = posted_by);
create policy "Users can update own jobs" on jobs for update using (auth.uid() = posted_by);

-- Interests: users can view for jobs they posted or applied to
create policy "View interests for own jobs" on interests for select using (
  exists (select 1 from jobs where jobs.id = interests.job_id and jobs.posted_by = auth.uid())
  or interests.user_id = auth.uid()
);
create policy "Create interests" on interests for insert with check (auth.uid() = user_id);

-- Messages: only job participants
create policy "Job participants can view messages" on messages for select using (
  sender_id = auth.uid() or receiver_id = auth.uid()
);
create policy "Send messages" on messages for insert with check (auth.uid() = sender_id);

-- Reviews: only participants
create policy "View reviews" on reviews for select using (
  reviewer_id = auth.uid() or reviewed_id = auth.uid()
);
create policy "Create reviews" on reviews for insert with check (auth.uid() = reviewer_id);

-- Message notifications table
create table message_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) not null,
  from_user_id uuid references users(id) not null,
  job_id uuid references jobs(id),
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table message_notifications enable row level security;

create policy "Users can view own notifications" on message_notifications for select 
  using (auth.uid() = user_id);

-- Chats table for messaging
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id),
  participants uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table chats enable row level security;

create policy "Participants can view chats" on chats for select 
  using (auth.uid() = any(participants));
create policy "Users can create chats" on chats for insert 
  with check (auth.uid() = any(participants));

-- Storage bucket for job media
insert into storage.buckets (id, name, public) values ('job-media', 'job-media', true);

-- Storage policy for job-media
create policy "Public can view job media" on storage.objects for select using (bucket_id = 'job-media');
create policy "Authenticated users can upload job media" on storage.objects for insert with check (bucket_id = 'job-media' AND auth.role() = 'authenticated');
