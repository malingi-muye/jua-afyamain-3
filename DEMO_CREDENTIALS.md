# JuaAfya Demo Credentials

This document provides demo credentials for testing the JuaAfya healthcare management system with multitenancy and RBAC features.

## Database Setup

Before using these credentials, run the database migration scripts in order:

\`\`\`bash
# Run these scripts via the Supabase SQL editor or using the CLI
1. scripts/01_create_schema.sql
2. scripts/02_create_multitenancy_schema.sql
3. scripts/03_seed_demo_data.sql
\`\`\`

## Creating Supabase Auth Users

Since Supabase Auth users cannot be created directly via SQL, you must create them using one of these methods:

### Method 1: Using the App UI (Recommended)
1. Go to http://localhost:3000/auth/signup
2. Enter email and password from the credentials below
3. Submit to create the user and automatically link it to the organization

### Method 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create with these emails/passwords
4. Then use the app's API to link the user to an organization

## Super Admin Account (System Admin Portal)

**Email:** `superadmin@juaafya.com`  
**Password:** `JuaAfya@Demo123`  
**Role:** `super_admin`  
**Access:** System admin portal at `/admin`  
**Permissions:**
- View all clinics/organizations
- Create new organizations
- View all audit logs
- Login as any tenant user for support/testing
- Manage all organizations

### Login as Tenant Feature
After logging in as super admin:
1. Go to the Admin Dashboard
2. Find the demo clinic in the organizations list
3. Click "Login as Tenant" button
4. You'll be authenticated as an admin of that clinic

---

## Demo Clinic Credentials

### Organization: Demo Clinic
**Organization ID:** `10000000-0000-0000-0000-000000000001`

#### Admin Account
**Email:** `admin@democlinic.com`  
**Password:** `Clinic@Demo123`  
**Role:** `admin`  
**Access:** Clinic dashboard and management panel  
**Permissions:**
- Manage users within the clinic
- View all patients
- Generate reports
- Access clinic settings

#### Doctor Account
**Email:** `doctor@democlinic.com`  
**Password:** `Doctor@Demo123`  
**Role:** `doctor`  
**Access:** Clinical dashboard  
**Permissions:**
- View all patients in the clinic
- Create/update patient records
- Create appointments
- View medical history
- Write prescriptions

#### Receptionist Account
**Email:** `receptionist@democlinic.com`  
**Password:** `Receptionist@Demo123`  
**Role:** `receptionist`  
**Access:** Reception dashboard  
**Permissions:**
- Schedule appointments
- Check-in patients
- View basic patient info
- Manage appointment calendar

---

## Test Hospital Credentials

### Organization: Test Hospital
**Organization ID:** `20000000-0000-0000-0000-000000000001`

#### Admin Account
**Email:** `admin@testhospital.com`  
**Password:** `Hospital@Demo123`  
**Role:** `admin`  
**Access:** Hospital management panel  
**Permissions:**
- Same as clinic admin (for testing multitenancy isolation)

---

## Testing Multitenancy & Data Isolation

To verify that multitenancy is working correctly:

1. **Login as Demo Clinic Admin** (`admin@democlinic.com`)
   - Note the patients and data visible
   - You can only see Demo Clinic data

2. **Logout and login as Test Hospital Admin** (`admin@testhospital.com`)
   - Verify you see completely different data
   - Confirm Test Hospital data is isolated

3. **Login as Super Admin** (`superadmin@juaafya.com`)
   - Go to `/admin` portal
   - Verify you can see both organizations
   - Use "Login as Tenant" to switch between organizations

---

## Testing Role-Based Access Control

### Doctor Permissions
- ✅ View all patients in clinic
- ✅ Create patient records
- ✅ Create appointments
- ❌ Delete patients (admin only)
- ❌ Manage other users (admin only)

### Receptionist Permissions
- ✅ Schedule appointments
- ✅ Check-in patients
- ❌ View full medical records (doctor only)
- ❌ Manage users (admin only)

### Admin Permissions
- ✅ Manage all users
- ✅ Create organizations
- ✅ View all reports
- ✅ Access audit logs

---

## Audit Logging

All actions are logged for compliance:

- View logs via API: `GET /api/audit-logs`
- Logs include: user, action, resource, timestamp, organization context
- Super admin can view logs from all organizations
- Regular users see only their organization's logs

---

## API Testing

### Authentication Flow
\`\`\`bash
# Signup (creates user and organization)
POST /api/auth/sign-up
{
  "email": "newuser@clinic.com",
  "password": "SecurePass123",
  "organizationName": "My Clinic",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
{
  "email": "admin@democlinic.com",
  "password": "Clinic@Demo123"
}
\`\`\`

### User Management
\`\`\`bash
# Add user to organization (requires admin role)
POST /api/organizations/{organizationId}/users
{
  "email": "newdoctor@clinic.com",
  "role": "doctor",
  "firstName": "Jane",
  "lastName": "Smith"
}

# List organization users
GET /api/organizations/{organizationId}/users
\`\`\`

### Super Admin Operations
\`\`\`bash
# Create organization (super admin only)
POST /api/organizations
{
  "name": "New Clinic",
  "type": "clinic"
}

# Login as tenant (super admin only)
POST /api/admin/login-as-tenant
{
  "organizationId": "10000000-0000-0000-0000-000000000001",
  "userId": "user-uuid-here"
}

# View audit logs
GET /api/audit-logs
\`\`\`

---

## Security Notes

- ⚠️ These are DEMO credentials only - change in production
- ⚠️ All passwords should be changed after first login
- ⚠️ Row-Level Security (RLS) policies enforce tenant isolation at the database level
- ⚠️ Super admin "login as tenant" creates a temporary session - not a permanent privilege escalation
- ✅ All API routes verify authorization server-side
- ✅ All queries include tenant context via RLS

---

## Troubleshooting

### "Multiple GoTrueClient instances" Warning
This is a non-fatal warning about Supabase client initialization. To resolve:
- Ensure only one Supabase client instance is created using singleton pattern
- Check that `createBrowserClient` is only called once in your app

### User cannot login
- Verify the user exists in Supabase Auth (check dashboard)
- Verify the user is linked to an organization in the database
- Check that the user's role is set correctly

### Getting "Unauthorized" on API calls
- Verify you have a valid session token
- Check that your user has the required role for the action
- Verify the organization ID matches your user's organization

---

## Next Steps

1. ✅ Run all SQL scripts to set up the database
2. ✅ Create Supabase Auth users using the signup form
3. ✅ Test login with different roles
4. ✅ Verify data isolation between organizations
5. ✅ Test super admin portal features
6. ✅ Run API tests with the credentials above
