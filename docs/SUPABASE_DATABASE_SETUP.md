# Supabase Database Setup Guide

## Current Issue

You're getting: **"Error loading user profile from database. Please check connection."**

This means:
- ✅ Supabase credentials are configured correctly
- ❌ The `users` table doesn't exist or is not accessible

---

## Solution: Create Database Tables and Policies

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://tlraaxpemekmjpcbwpny.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

---

### Step 2: Create Tables and Enable RLS

Copy and paste this SQL into the editor:

```sql
-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  currency TEXT DEFAULT 'KES',
  timezone TEXT DEFAULT 'Africa/Nairobi',
  plan TEXT DEFAULT 'free',
  plan_seats INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'doctor',
  department TEXT,
  license_number TEXT,
  specialization TEXT,
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMP,
  last_active_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  clinic_id UUID REFERENCES clinics(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Policies for users table
-- Allow users to select their own data
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can manage all users"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- Policies for clinics table
-- Allow authenticated users to select clinics
CREATE POLICY "Authenticated users can view clinics"
ON clinics FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow service role to manage clinics
CREATE POLICY "Service role can manage clinics"
ON clinics FOR ALL
USING (auth.role() = 'service_role');

-- Allow clinic owners to update their own clinic
CREATE POLICY "Clinic owners can update their clinic"
ON clinics FOR UPDATE
USING (owner_id = auth.uid());
```

---

### Step 3: Run the SQL

1. Click the **Run** button (play icon) or press `Ctrl+Enter`
2. Wait for the query to complete
3. You should see: "Query succeeded" message

---

### Step 4: Create a Test User Profile

Now create a test user profile in the `users` table. You'll need:
1. Your Supabase auth user ID
2. Your email

**To get your user ID:**
- Go to **Authentication** > **Users** in Supabase dashboard
- Copy the UID of your user

**To create the user profile, run this SQL:**

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- Replace 'your-email@example.com' with your actual email
INSERT INTO users (id, email, full_name, role, status)
VALUES (
  'YOUR_USER_ID',
  'your-email@example.com',
  'Your Name',
  'admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Your Name',
  role = 'admin',
  status = 'active'
RETURNING *;
```

---

### Step 5: Verify Setup

1. Refresh your app (F5)
2. You should now see the dashboard load
3. Check browser console (F12 > Console) for messages like:
   ```
   ✅ Supabase Configuration Status: READY
   [useEnterpriseAuth] Profile fetch result: { found: true, elapsed: 1200ms }
   ```

---

## Troubleshooting

### Still Getting "Error loading user profile"?

**Issue**: RLS policy blocking access

**Solution**: Temporarily disable RLS for testing:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Then test. If it works, the issue is RLS policies. Re-enable and adjust policies.

---

### Getting "User profile not found in database"?

**Issue**: User doesn't have a profile record

**Solution**: Create one using the SQL from Step 4 above

---

### Getting "Supabase not configured"?

**Issue**: Environment variables not set

**Solution**: You already set them, but if you still see this:
1. Check DevServerControl status
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart the dev server

---

## Next Steps After Setup

Once the app loads:

1. **Verify Authentication Works**
   - Try signing out and signing back in
   - Check browser console for auth logs

2. **Create More Test Users**
   - Use the same SQL from Step 4
   - Change the role to 'doctor', 'nurse', 'receptionist', etc.

3. **Set Up Clinics** (Optional)
   - Create a clinic record in the `clinics` table
   - Link users to clinics using `clinic_id`

4. **Configure RLS Properly** (Production)
   - Make sure Row Level Security policies are appropriate
   - Test with different user roles to ensure access control works

---

## Quick Reference: Table Schema

### Users Table
- `id` - UUID from auth.users
- `email` - User's email
- `full_name` - Display name
- `role` - 'admin', 'doctor', 'nurse', 'receptionist', 'super_admin'
- `status` - 'active', 'invited', 'deactivated'
- `clinic_id` - FK to clinics table
- `last_active_at` - Updated automatically
- `preferences` - JSON object for user settings

### Clinics Table
- `id` - UUID
- `name` - Clinic name
- `owner_id` - FK to users.id
- `plan` - 'free', 'pro', 'enterprise'
- `status` - 'active', 'suspended'
- `currency` - 'KES', 'USD', etc.
- `timezone` - 'Africa/Nairobi', etc.

---

## Common Roles

- **admin** - Full access to clinic features
- **doctor** - Can view patients, appointments, prescriptions
- **nurse** - Can triage, record vitals
- **receptionist** - Can check in patients
- **super_admin** - System-wide administration

---

## Need Help?

1. Check browser console (F12) for error messages
2. Look at Supabase project logs: **Settings** > **Logs**
3. Verify table structure: **Table Editor** > select table and check columns
4. Test RLS policies by temporarily disabling them

Good luck! 🚀
