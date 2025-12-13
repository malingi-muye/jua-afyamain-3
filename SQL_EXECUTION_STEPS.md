# JuaAfya Database Setup - Step by Step

## ⚠️ Important: Execute Scripts in Order

The SQL scripts must be executed in the **exact order** below in your Supabase SQL Editor:

### Step 1: Create Complete Schema
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy the entire content of **`scripts/001-create-complete-schema.sql`**
5. Paste it into the SQL editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for the message: **"Success. No rows returned"**

### Step 2: Seed Demo Data
1. Click **"New Query"** again
2. Copy the entire content of **`scripts/002_seed_demo_clinics.sql`**
3. Paste it into the SQL editor
4. Click **"Run"**
5. Wait for the message: **"Success. No rows returned"**

### Step 3: Create Demo Auth Users
1. Navigate to **`/api/admin/init-demo`** in your application
2. Or call the endpoint: `POST http://localhost:3000/api/admin/init-demo`
3. This will create the Supabase Auth users for the demo accounts

## ✅ Verification

After running the scripts, verify in your Supabase dashboard:

1. **Check Tables**: Go to **Database → Tables** and confirm you see:
   - `clinics`
   - `users`
   - `patients`
   - `appointments`
   - `medical_records`
   - `inventory`
   - `suppliers`
   - `visits`
   - `audit_logs`
   - `activities`

2. **Check Demo Data**: Click on the `clinics` table and verify you see:
   - "Demo Clinic" (slug: demo-clinic)
   - "Test Hospital" (slug: test-hospital)

3. **Check Columns**: Click on the `clinics` table and scroll right to verify the `slug` column exists

## 🔴 Troubleshooting

### Error: "column 'slug' does not exist"
- **Cause**: Step 1 (schema creation) hasn't been run yet
- **Fix**: Make sure you ran `001-create-complete-schema.sql` FIRST and it completed successfully

### Error: "duplicate key value violates unique constraint"
- **Cause**: The seed script was run twice
- **Fix**: Run the schema script again to reset all tables

### Error: "relation 'clinics' does not exist"
- **Cause**: The schema wasn't created
- **Fix**: Go back to Step 1 and run the schema script

## 📝 Demo Credentials

After all scripts are run, you can login with:

**Super Admin:**
- Email: `superadmin@juaafya.com`
- Password: `JuaAfya@Demo123`

**Demo Clinic Admin:**
- Email: `admin@democlinic.com`
- Password: `Clinic@Demo123`

**Doctor:**
- Email: `doctor@democlinic.com`
- Password: `Doctor@Demo123`

## 🚀 Next Steps

1. Login to the app with the credentials above
2. Access the clinic dashboard at `/dashboard`
3. Try creating patients, appointments, and inventory items
4. Check the admin portal at `/admin` (super admin only)
