# Database Setup Guide for JuaAfya

## Overview
JuaAfya uses a clinic-based multitenancy architecture with role-based access control (RBAC) and row-level security (RLS) policies.

## Prerequisites
- Supabase project created
- Access to Supabase dashboard

## Setup Steps

### Step 1: Create Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `scripts/001-create-complete-schema.sql`
5. Click **Run**
6. Wait for completion (you should see success message)

**Expected Tables Created:**
- clinics
- users
- patients
- appointments
- medical_records
- inventory
- suppliers
- visits
- audit_logs
- activities

### Step 2: Seed Demo Data
1. In SQL Editor, click **New Query**
2. Copy and paste the entire contents of `scripts/002_seed_demo_clinics.sql`
3. Click **Run**
4. Wait for completion

**Expected Result:**
- 2 demo clinics created (Demo Clinic and Test Hospital)

### Step 3: Create Supabase Auth Users
The database is now ready! You need to create auth users through the application signup or Supabase dashboard.

#### Option A: Use Application Signup (Recommended)
1. Navigate to `http://localhost:3000/auth/signup` in your app
2. Sign up with the following credentials:

**Super Admin:**
- Email: `superadmin@juaafya.com`
- Password: `JuaAfya@Demo123`

**Demo Clinic Users:**
- Admin: `admin@democlinic.com` / `Clinic@Demo123`
- Doctor: `doctor@democlinic.com` / `Doctor@Demo123`
- Receptionist: `receptionist@democlinic.com` / `Receptionist@Demo123`

**Test Hospital Users:**
- Admin: `admin@testhospital.com` / `Hospital@Demo123`

#### Option B: Use Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Create each user manually

### Step 4: Verify Setup
1. Login with any demo credentials
2. You should see the clinic dashboard
3. Check that multitenancy is working by viewing different user contexts

## Troubleshooting

### Error: "column 'slug' does not exist"
- The schema script (001-create-complete-schema.sql) hasn't been executed yet
- Solution: Run the schema script in SQL Editor before the seed script

### Error: "relation 'clinics' does not exist"
- The schema table creation failed
- Solution: Check the SQL Editor output for errors and try running the schema script again

### Error: "duplicate key value violates unique constraint"
- The seed script has already been run
- Solution: This is harmless - the ON CONFLICT clause handles this automatically

### GoTrueClient Multiple Instances Warning
- This is a known Supabase warning that appears during development
- It doesn't affect functionality
- It will be automatically resolved in production deployments

## Database Structure

### Clinics (Multi-tenant Root)
- Each clinic is a completely isolated tenant
- Contains clinic metadata, plan info, and settings

### Users (with Clinic Context)
- Users belong to clinics (except super_admin)
- Roles: super_admin, admin, doctor, nurse, receptionist, lab_tech, pharmacist, accountant
- Row-level security ensures users only see their clinic's data

### Patients
- Belong to a specific clinic
- Include medical history, allergies, chronic conditions
- Unique MRN per clinic

### Appointments
- Connect doctors and patients
- Track appointment status
- Enable clinic scheduling

### Medical Records
- Track consultations, diagnoses, prescriptions, lab results
- Securely store patient medical history
- Linked to clinics for isolation

### Inventory
- Manage clinic supplies, medicines, equipment
- Track stock levels with reorder alerts
- Support multiple categories

### Audit & Activities
- Log all system changes for compliance
- Track user activities for accountability
- Implement complete audit trails

## Security Features

1. **Row-Level Security (RLS):** Database-enforced tenant isolation
2. **Multitenancy:** Each clinic has completely isolated data
3. **RBAC:** Role-based access control with 8 different roles
4. **Audit Logging:** Complete change tracking for compliance
5. **Encryption:** Sensitive data encryption in transit and at rest

## Next Steps

After setup:
1. Explore the admin dashboard at `/admin`
2. Create your first clinic
3. Add clinic staff users
4. Start managing patients and appointments
