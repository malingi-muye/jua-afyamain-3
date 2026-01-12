# Supabase Configuration Guide

## Problem
If you see the error "Auth user fetch timeout after 15-20s", it means **Supabase is not configured** with proper credentials.

The app will work in **demo mode** without Supabase, but authentication and database features will not be available.

## Solution: Configure Supabase

### Step 1: Create a Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in with your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Choose a name for your project
   - **Database Password**: Set a strong password
   - **Region**: Select the region closest to you (e.g., us-east-1)
5. Click "Create new project" and wait for it to be provisioned (2-3 minutes)

### Step 2: Get Your Credentials
1. Once the project is ready, go to **Settings > API**
2. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon key** (a long alphanumeric string)

### Step 3: Set Environment Variables
You have two options:

#### Option A: Using Environment Variables (Recommended for Development)

1. Create a `.env.local` file in your project root (same level as `package.json`)
2. Add these lines:
\`\`\`bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
\`\`\`

Replace:
- `YOUR_PROJECT_URL` with your actual project URL (just the subdomain, not the full path)
- `YOUR_ANON_KEY_HERE` with your actual anon key

3. Save the file

#### Option B: Using DevServerControl (For Current Session)

If you want to set environment variables for the current session without creating a file, you can ask the Assistant to use:
\`\`\`
DevServerControl tool with set_env_variable:
- VITE_SUPABASE_URL: https://YOUR_PROJECT_URL.supabase.co
- VITE_SUPABASE_ANON_KEY: YOUR_ANON_KEY_HERE
\`\`\`

### Step 4: Restart the Dev Server

After setting environment variables, restart the dev server:
\`\`\`bash
npm run dev
\`\`\`

The app should now:
- ✅ No longer show timeout errors
- ✅ Allow user authentication
- ✅ Store and retrieve data from Supabase

## Verification

Check the browser console (F12 > Console tab) to see:
- ✅ `✅ Supabase Configuration Status: READY` - means it's working
- ⚠️ `⚠️ Supabase Configuration Status: NOT CONFIGURED` - means you still need to set credentials

## Demo Mode

If you don't configure Supabase, the app will:
- ✅ Run in demo mode with mock data
- ✅ Show all UI features
- ❌ Not save data persistently
- ❌ Not allow real authentication

This is useful for testing the interface, but production deployments must have Supabase configured.

## Troubleshooting

### Still getting timeout errors?
1. Check the browser console (F12 > Console) for the exact error message
2. Verify your credentials are correct:
   - Go back to Supabase dashboard > Settings > API
   - Copy and paste the values again (watch for extra spaces)
3. Make sure the `.env.local` file is in the project root
4. Restart the dev server with `npm run dev`

### Environment variables not being read?
1. Stop the dev server (Ctrl+C)
2. Delete `.env.local` if it exists and create a new one
3. Add the variables again
4. Start the dev server with `npm run dev`
5. The console should show "✅ Supabase Configuration Status: READY"

### Getting "User profile not found in database" error?
This means Supabase is configured, but:
1. You haven't created a user profile in the database
2. The user is signed in but doesn't have a matching profile record

Solution:
- Create a new user profile in Supabase:
  - Go to your Supabase project
  - Find the `users` table in the SQL editor
  - Insert a record with the current user's ID

## Database Setup

If you need to set up the database schema, check the schema SQL instructions in `lib/supabaseClient.ts`. You can run this SQL in your Supabase SQL Editor to create all necessary tables and policies.

## Need Help?

- Check the logs in the browser console (F12)
- Look at the "Supabase Configuration Status" message
- Verify your Project URL and anon key one more time
- Make sure you're using VITE_ prefix for environment variables (not NEXT_PUBLIC_)
