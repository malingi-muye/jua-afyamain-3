# Fixing Missing Clinic Registrations in Super Admin Dashboard

## Problem
New clinic registrations are not appearing in the Super Admin Dashboard because:
1. The signup process only creates an auth user, not the corresponding clinic and user profile records
2. Without these database records, `getAllClinics()` returns empty results

## Root Cause
The `signUp` function in `useEnterpriseAuth.ts` calls `supabase.auth.signUp()` which creates a user in the `auth.users` table, but there's no automatic trigger to create:
- A record in the `public.clinics` table
- A record in the `public.users` table

## Solution
A database trigger has been created that automatically:
1. Creates a new clinic with `status='pending'` when a user signs up with `clinic_name` in metadata
2. Creates a user profile linked to that clinic
3. Logs the signup activity

## Implementation Steps

### Step 1: Run the Migration
Execute the new migration file in your Supabase SQL Editor:

\`\`\`bash
# The migration file is located at:
supabase/migrations/20260110000000_auto_create_clinic_on_signup.sql
\`\`\`

**To apply it:**
1. Go to your Supabase Dashboard: https://tlraaxpemekmjpcbwpny.supabase.co
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20260110000000_auto_create_clinic_on_signup.sql`
5. Paste and click **Run**

### Step 2: Verify the Trigger
After running the migration, verify it was created:

\`\`\`sql
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
\`\`\`

You should see:
- `trigger_name`: `on_auth_user_created`
- `event_object_table`: `users`
- `event_manipulation`: `INSERT`

### Step 3: Test the Signup Flow
1. Sign up a new clinic through the application
2. Check the `clinics` table - you should see a new record with `status='pending'`
3. Check the `users` table - you should see the user profile linked to the clinic
4. Log in as Super Admin and check the dashboard - the new clinic should appear in "Pending Approvals"

### Step 4: Verify Data Mapping
The code changes already handle case-insensitive status mapping in `services/db.ts`:

\`\`\`typescript
status: (c.status || '').toLowerCase() === 'pending' ? 'Pending' : ...
\`\`\`

This ensures that `'pending'` from the database is correctly displayed as `'Pending'` in the UI.

## What the Trigger Does

When a user signs up with this payload:
\`\`\`javascript
{
  email: "clinic@example.com",
  password: "SecurePass123!",
  options: {
    data: {
      full_name: "Dr. John Doe",
      clinic_name: "City Health Clinic",
      role: "admin"
    }
  }
}
\`\`\`

The trigger automatically:
1. **Creates a clinic** in `public.clinics`:
   - `name`: "City Health Clinic"
   - `slug`: "city-health-clinic" (auto-generated, unique)
   - `owner_id`: The new user's ID
   - `email`: "clinic@example.com"
   - `status`: **"pending"** (awaiting Super Admin approval)
   - `plan`: "free" (default)

2. **Creates a user profile** in `public.users`:
   - `id`: Same as auth user ID
   - `clinic_id`: Links to the newly created clinic
   - `email`: "clinic@example.com"
   - `full_name`: "Dr. John Doe"
   - `role`: "admin"
   - `status`: "active"

3. **Logs the activity** in `public.activities`:
   - Records the clinic signup event for audit purposes

## Additional Fixes Applied

### 1. Optimized Data Loading for Super Admins
**File**: `store/index.ts`

Modified `fetchData` to skip loading clinic-specific data (patients, inventory, etc.) for Super Admins, preventing unnecessary background requests.

\`\`\`typescript
if (currentUser.role === 'SuperAdmin' || currentUser.role === 'super_admin' as any) {
    set({ isAppLoading: false })
    return
}
\`\`\`

### 2. Fixed Status Mapping
**File**: `services/db.ts`

Updated `getAllClinics` to handle case-insensitive status comparison:

\`\`\`typescript
status: (c.status || '').toLowerCase() === 'pending' ? 'Pending' : ...
\`\`\`

This ensures clinics with `status='pending'` (lowercase in DB) are correctly identified as `'Pending'` (PascalCase in UI).

## Troubleshooting

### Issue: Trigger not firing
**Check**: Ensure the trigger was created successfully
\`\`\`sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
\`\`\`

### Issue: Clinic created but status is not 'pending'
**Check**: Verify the trigger function
\`\`\`sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user_signup';
\`\`\`

### Issue: Existing signups not showing
**Solution**: The trigger only works for NEW signups. For existing test accounts, manually update:
\`\`\`sql
-- Find orphaned auth users (no profile)
SELECT au.id, au.email, au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Manually create clinic and profile for a specific user
-- Replace 'USER_ID' with actual ID from above query
DO $$
DECLARE
  v_user_id UUID := 'USER_ID';
  v_clinic_id UUID;
BEGIN
  -- Create clinic
  INSERT INTO public.clinics (name, slug, owner_id, email, status, plan)
  VALUES ('Test Clinic', 'test-clinic-' || substring(v_user_id::text from 1 for 8), v_user_id, 'test@example.com', 'pending', 'free')
  RETURNING id INTO v_clinic_id;
  
  -- Create user profile
  INSERT INTO public.users (id, clinic_id, email, full_name, role, status)
  VALUES (v_user_id, v_clinic_id, 'test@example.com', 'Test User', 'admin', 'active');
END $$;
\`\`\`

## Expected Behavior After Fix

1. **New Signup**:
   - User fills out signup form with clinic name
   - Auth user is created
   - Trigger fires automatically
   - Clinic record created with `status='pending'`
   - User profile created and linked to clinic

2. **Super Admin Dashboard**:
   - `getAllClinics()` returns all clinics including pending ones
   - Status mapping correctly identifies `'pending'` → `'Pending'`
   - Pending clinics appear in "Approvals" tab
   - Super Admin can approve/reject

3. **User Experience**:
   - After signup, user sees "Pending Approval" screen (already implemented)
   - Cannot access dashboard until Super Admin approves
   - Once approved, status changes to `'active'` and user can log in

## Files Modified

1. `supabase/migrations/20260110000000_auto_create_clinic_on_signup.sql` - New trigger
2. `store/index.ts` - Optimized data loading for Super Admins
3. `services/db.ts` - Fixed case-insensitive status mapping

## Next Steps

1. ✅ Run the migration in Supabase
2. ✅ Test with a new signup
3. ✅ Verify in Super Admin dashboard
4. Consider adding email notifications when new clinics register
5. Consider adding a "Resend Verification Email" option for pending users
