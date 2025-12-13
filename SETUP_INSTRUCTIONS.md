# JuaAfya System Setup Guide

## Overview
JuaAfya is a clinic management system with clinic-based multitenancy, RBAC, and Supabase authentication.

## Database Setup

### Step 1: Run Initial Schema
Execute the main schema creation script to set up all tables and RLS policies:
\`\`\`bash
# Run in Supabase SQL Editor
scripts/001-create-complete-schema.sql
\`\`\`

This creates:
- `clinics` - Tenant table for clinic multitenancy
- `users` - User accounts with clinic context
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `medical_records` - Patient medical history
- `inventory` - Medicine and equipment tracking
- `suppliers` - Supplier management
- `visits` - Patient visit tracking (queue management)
- `audit_logs` - Compliance and audit trails
- `activities` - User activity tracking

### Step 2: Seed Demo Data
Execute the demo data script to create test clinics:
\`\`\`bash
scripts/002_seed_demo_clinics.sql
\`\`\`

## User Setup

### Super Admin (System Admin)
- **Email:** superadmin@juaafya.com
- **Password:** JuaAfya@Demo123
- Access: Can see all clinics and login as any user

### Demo Clinic Users
- **Admin:** admin@democlinic.com / Clinic@Demo123
- **Doctor:** doctor@democlinic.com / Doctor@Demo123
- **Receptionist:** receptionist@democlinic.com / Receptionist@Demo123

### Test Hospital Users
- **Admin:** admin@testhospital.com / Hospital@Demo123

## Creating Users via API

To create new users after the system is running:

\`\`\`bash
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "Full Name",
  "clinicId": "clinic-uuid-here",
  "role": "doctor"
}
\`\`\`

## System Architecture

### Multitenancy
- Each clinic is a separate tenant
- Data is completely isolated at the database level using RLS policies
- `clinic_id` field ensures data belongs to only one clinic

### RBAC Roles
1. **super_admin** - System administrator, can manage all clinics
2. **admin** - Clinic administrator, manages clinic users and settings
3. **doctor** - Can view all patients in their clinic
4. **nurse** - Can view patients and update vitals
5. **receptionist** - Can manage appointments and patient check-in
6. **lab_tech** - Can manage lab orders
7. **pharmacist** - Can dispense medications
8. **accountant** - Can view billing and reports

### Authentication
- Uses Supabase Auth for user authentication
- Session is stored in secure HTTP-only cookies
- Automatic token refresh

### API Security
- All endpoints check user authentication via Supabase
- Server-side RBAC validation ensures users can only access their clinic data
- RLS policies provide database-level security

## Troubleshooting

### Multiple GoTrueClient Warning
If you see: "Multiple GoTrueClient instances detected..."
- This is resolved by using the singleton Supabase client in `lib/supabase/client.ts`
- The warning can be safely ignored

### Users can't login
- Ensure the user exists in Supabase Auth
- Check that the user profile is created in the `users` table
- Verify the clinic exists in the `clinics` table

### Missing clinic context
- Super admin users don't require a clinic assignment
- Regular users must have a clinic_id in their profile
- Check RLS policies are enabled on all tables
