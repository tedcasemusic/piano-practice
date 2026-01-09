-- Piano Practice Tracker Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('teacher', 'student')) default 'student',
  teacher_id uuid references profiles(id), -- students link to their teacher
  created_at timestamptz default now()
);

-- Practice sessions table
create table practice_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  practice_date date not null default current_date,
  duration_minutes integer not null check (duration_minutes > 0),
  pieces text[], -- array of piece names practiced
  notes text,
  rating integer check (rating >= 1 and rating <= 5), -- 1-5 self-assessment
  focus_areas text[], -- e.g., ['scales', 'sight-reading', 'technique']
  created_at timestamptz default now()
);

-- Goals table (teacher can set goals for students)
create table goals (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  title text not null,
  description text,
  target_minutes_per_week integer,
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table practice_sessions enable row level security;
alter table goals enable row level security;

-- Profiles: users can read their own profile and their teacher/students
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Teachers can view their students" on profiles
  for select using (
    auth.uid() = teacher_id
    or auth.uid() in (select id from profiles where role = 'teacher' and id = auth.uid())
  );

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Practice sessions: users see their own, teachers see their students'
create policy "Users can view own practice sessions" on practice_sessions
  for select using (auth.uid() = user_id);

create policy "Teachers can view student practice sessions" on practice_sessions
  for select using (
    user_id in (select id from profiles where teacher_id = auth.uid())
  );

create policy "Users can insert own practice sessions" on practice_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own practice sessions" on practice_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own practice sessions" on practice_sessions
  for delete using (auth.uid() = user_id);

-- Goals: students see their goals, teachers can manage goals for their students
create policy "Students can view their goals" on goals
  for select using (auth.uid() = student_id);

create policy "Teachers can view goals they created" on goals
  for select using (auth.uid() = created_by);

create policy "Teachers can create goals for their students" on goals
  for insert with check (
    auth.uid() = created_by
    and student_id in (select id from profiles where teacher_id = auth.uid())
  );

create policy "Teachers can update goals they created" on goals
  for update using (auth.uid() = created_by);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
