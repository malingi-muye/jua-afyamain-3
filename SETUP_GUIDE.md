# JuaAfya Setup Guide

## Prerequisites

- Supabase project connected
- Environment variables configured

## Step 1: Run Database Migrations

Execute the SQL scripts in order in your Supabase SQL editor:

1. `scripts/02_create_multitenancy_schema.sql` - Creates multitenancy tables and RLS policies
2. `scripts/03_seed_demo_data.sql` - Seeds demo clinic and user data

## Step 2: Initialize Demo Users

Run this command to create the demo authentication accounts:

\`\`\`bash
curl -X POST http://localhost:3000/api/admin/init-demo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
\`\`\`

Or visit: `http://localhost:3000/api/admin/init-demo`

This creates the following test accounts:

### Super Admin Portal
- Email: `superadmin@juaafya.com`
- Password: `JuaAfya@Demo123`
- Access: `/admin`

### Demo Clinic Accounts
- **Admin**: `admin@democlinic.com` / `Clinic@Demo123`
- **Doctor**: `doctor@democlinic.com` / `Doctor@Demo123`
- **Receptionist**: `receptionist@democlinic.com` / `Receptionist@Demo123`

### Test Hospital
- **Admin**: `admin@testhospital.com` / `Hospital@Demo123`

## Step 3: Test the System

1. Login to super admin at `/auth/login` with superadmin credentials
2. Navigate to `/admin` to see all clinics
3. Use "Login as Tenant" to test clinic portals
4. Try different roles to verify RBAC

## Troubleshooting

### Multiple GoTrueClient Warnings
This is a known issue with multiple Supabase client instances. It's non-critical and won't affect functionality.

### Login Fails with "Invalid Credentials"
- Make sure demo users were created (run step 2)
- Check that database migrations were executed
- Verify environment variables are set correctly

### Supabase Environment Variables Missing
Add these to your Vercel project environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Architecture Overview

**Multitenancy**: Each clinic is a separate tenant with isolated data
- Row-Level Security (RLS) enforces data isolation at database level
- Tenant context automatically determined from authenticated user

**RBAC**: Role-based access control with 8 roles
- super_admin: System administrator
- admin: Clinic administrator
- doctor, nurse, receptionist, lab_tech, pharmacist, accountant: Clinic staff

**Authentication**: Supabase Auth with email/password
- Session stored in HTTP-only cookies
- Automatic session refresh via middleware

**API Routes**: All protected with authorization checks
- Tenant context verified server-side
- RLS policies enforced for all database queries
