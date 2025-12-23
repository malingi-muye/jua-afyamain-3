# 🔍 Role Issue Debugging & Fixes

## ✅ **Fixes Applied:**

### 1. **Dashboard - Removed Hardcoded "Dr. Andrew"** ✅
- **Lines changed**: 46, 282, 445-446
- **Before**: Showed "Dr.  Andrew" and "andrew@juaafya.com"
- **After**: Shows `currentUser?.name` and `currentUser?.email` from store

### 2. **Added Role Debugging** ✅
- Added console.log in `useEnterpriseAuth.ts` to show:
  - Raw role from database
  - Mapped role after conversion
  - Full user object

---

## 🐛 **Current Issue:**

The user is still showing as **"Doctor"** instead of **"SuperAdmin"**.

### **Root Cause Analysis:**

From the console logs:
\`\`\`
[AppLayout] Syncing user to store: {role: 'Doctor', status: 'Inactive', ...}
\`\`\`

This means either:
1. ❌ **Database has wrong role value** - The `role` column in Supabase `users` table might not be `super_admin`
2. ❌ **Role mapping is failing** - `NEW_ROLE_MAP[user.role]` is returning "Doctor" when it shouldn't

---

## 🔧 **Next Steps - PLEASE DO THIS:**

### **Step 1: Clear Browser Cache**
\`\`\`javascript
// In browser console (F12):
localStorage.clear()
location.reload()
\`\`\`

### **Step 2: Log Out and Log In Again**
- This will trigger fresh data fetch from Supabase

### **Step 3: Check Console for New Logs**
After logging in, look for this in the console:
\`\`\`
[useEnterpriseAuth] Mapped user role: {
  rawRole: '???',  // <-- Tell me what this says!
  mappedRole: '???',  // <-- And this!
  fullUser: {...}
}
\`\`\`

**Please copy and send me:**
- What `rawRole` shows
- What `mappedRole` shows

### **Step 4: Check Supabase Database**
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **users** table
3. Find the row for `superadmin@juaafya.com`
4. Check the `role` column - **it should say `super_admin`** (not `doctor`, not `Doctor`, not `SuperAdmin`)

**If it doesn't say `super_admin`:**
\`\`\`sql
-- Run this in Supabase SQL Editor:
UPDATE users 
SET role = 'super_admin',
    status = 'active'
WHERE email = 'superadmin@juaafya.com';
\`\`\`

---

## 📊 **Expected Role Flow:**

| Database (`users.role`) | Enterprise Type | Legacy Role (shown in UI) |
|------------------------|-----------------|---------------------------|
| `super_admin` | `super_admin` | `SuperAdmin` |
| `admin` | `admin` | `Admin` |
| `doctor` | `doctor` | `Doctor` |

The mapping happens in two steps:
1. **Database → Enterprise**: `profile.role` → `User.role` (should be `super_admin`)
2. **Enterprise → Legacy**: `NEW_ROLE_MAP[user.role]` → `TeamMember.role` (should be `SuperAdmin`)

---

## ⚠️ **Other Issues Found:**

### **User has no `clinic_id`**
\`\`\`
[teamService] User has no clinic_id, returning only current user
\`\`\`

**To fix:**
\`\`\`sql
-- In Supabase SQL Editor:
UPDATE users
SET clinic_id = (SELECT id FROM clinics LIMIT 1)
WHERE email = 'superadmin@juaafya.com';
\`\`\`

Or if no clinic exists yet:
\`\`\`sql
-- Create a clinic first:
INSERT INTO clinics (name, email, phone)
VALUES ('JuaAfya Medical Centre', 'admin@juaafya.com', '+254 712 345 678')
RETURNING id;

-- Then update user with the returned clinic id:
UPDATE users
SET clinic_id = '<clinic_id_from_above>'
WHERE email = 'superadmin@juaafya.com';
\`\`\`

---

## ✅ **Verification Checklist:**

After fixes:
- [ ] Dashboard shows "Malingi" instead of "Dr. Andrew"
- [ ] Profile dropdown shows `superadmin@juaafya.com` instead of `andrew@juaafya.com`
- [ ] User role shows as "SuperAdmin" (not "Doctor")
- [ ] User status shows as "Active" (not "Inactive")
- [ ] Team members load from Supabase (not hardcoded)
- [ ] No demo data visible

---

## 🚀 **Test Now:**

1. **Logout** (clear cache if needed)
2. **Login** with `superadmin@juaafya.com`
3. **Check console** for the new role mapping log
4. **Report back** what `rawRole` and `mappedRole` show

---

**Once I know what the raw role value is, I can fix the remaining issue!**
