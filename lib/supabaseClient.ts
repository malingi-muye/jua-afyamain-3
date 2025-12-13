const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"

if (SUPABASE_URL === "https://placeholder.supabase.co") {
  console.warn("Supabase not configured. App running in DEMO MODE with local mock data.")
}

// --- SQL SCHEMA INSTRUCTIONS ---
// Ensure your Supabase Database has the following tables.
// Run this SQL in your Supabase SQL Editor.

/*
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clinics
create table if not exists clinics (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  location text,
  currency text default 'KSh',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. User Profiles (linking auth.users to clinic data)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  clinic_id uuid references clinics(id),
  full_name text,
  role text,
  avatar_url text
);

-- 3. Patients
create table if not exists patients (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  name text not null,
  phone text,
  age int,
  gender text,
  notes text,
  last_visit date,
  history jsonb default '[]'::jsonb,
  vitals jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Inventory
create table if not exists inventory (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  name text not null,
  category text,
  stock int default 0,
  min_stock_level int default 10,
  unit text,
  price numeric default 0,
  batch_number text,
  expiry_date date,
  supplier_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Appointments
create table if not exists appointments (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  patient_id uuid references patients(id),
  patient_name text,
  date date,
  time text,
  reason text,
  status text default 'Scheduled',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Visits (Workflow)
create table if not exists visits (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  patient_id uuid references patients(id),
  patient_name text,
  stage text,
  stage_start_time text,
  start_time text,
  queue_number int,
  priority text,
  vitals jsonb default '{}'::jsonb,
  lab_orders jsonb default '[]'::jsonb,
  prescription jsonb default '[]'::jsonb,
  medications_dispensed boolean default false,
  consultation_fee numeric default 0,
  total_bill numeric default 0,
  payment_status text default 'Pending',
  chief_complaint text,
  diagnosis text,
  doctor_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Suppliers
create table if not exists suppliers (
  id uuid default uuid_generate_v4() primary key,
  clinic_id uuid references clinics(id) not null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS POLICIES --

-- Helper function to get the current user's clinic_id
create or replace function get_my_clinic_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select clinic_id from profiles where id = auth.uid();
$$;

-- 1. Profiles Table
alter table profiles enable row level security;
-- Users can only see their own profile
create policy "Users can see their own profile" on profiles for select using (id = auth.uid());
-- Users can update their own profile
create policy "Users can update their own profile" on profiles for update using (id = auth.uid());

-- 2. Patients Table
alter table patients enable row level security;
-- Drop old insecure policy
drop policy if exists "Public access" on patients;
-- Allow users to manage patients within their own clinic
create policy "Clinic members can manage patients" on patients
  for all
  using (clinic_id = get_my_clinic_id())
  with check (clinic_id = get_my_clinic_id());

-- 3. Inventory Table
alter table inventory enable row level security;
drop policy if exists "Public access" on inventory;
create policy "Clinic members can manage inventory" on inventory
  for all
  using (clinic_id = get_my_clinic_id())
  with check (clinic_id = get_my_clinic_id());

-- 4. Appointments Table
alter table appointments enable row level security;
drop policy if exists "Public access" on appointments;
create policy "Clinic members can manage appointments" on appointments
  for all
  using (clinic_id = get_my_clinic_id())
  with check (clinic_id = get_my_clinic_id());

-- 5. Visits Table
alter table visits enable row level security;
drop policy if exists "Public access" on visits;
create policy "Clinic members can manage visits" on visits
  for all
  using (clinic_id = get_my_clinic_id())
  with check (clinic_id = get_my_clinic_id());

-- 6. Suppliers Table
alter table suppliers enable row level security;
drop policy if exists "Public access" on suppliers;
create policy "Clinic members can manage suppliers" on suppliers
  for all
  using (clinic_id = get_my_clinic_id())
  with check (clinic_id = get_my_clinic_id());
*/
