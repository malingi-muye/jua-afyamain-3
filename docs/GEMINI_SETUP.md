# Gemini AI Setup Guide

This guide will help you enable AI features in JuaAfya by setting up the Gemini API.

## Overview

JuaAfya uses Google's Gemini API to power AI features such as:
- **Chat Assistant**: Answer general medical and operational questions
- **Patient Notes Analysis**: Convert unstructured notes to SOAP format
- **SMS Reminders**: Draft appointment reminders and broadcast messages
- **Daily Briefing**: Generate executive summaries for clinic managers
- **Staff Assistant**: WhatsApp-based operational commands

## Prerequisites

- A Google account
- Access to the JuaAfya Supabase project
- Administrator access to Supabase project settings

## Step-by-Step Setup

### Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "**Create API key**" or "**Get API key**"
3. Follow the prompts to create a new API key
4. **Copy the API key** (you'll need it in the next step)

> ⚠️ **Important**: Keep this API key secret. Do not share it publicly or commit it to git.

### Step 2: Add the API Key to Supabase

There are two ways to add your Gemini API key to Supabase:

#### Option A: Via Supabase Dashboard (Recommended for Production)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your JuaAfya project
3. Navigate to **Settings** → **Edge Function Secrets** (or **Database Secrets** if using scheduled functions)
4. Click **New Secret**
5. Fill in:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Paste your API key from Step 1
6. Click **Save**
7. Proceed to Step 3

#### Option B: Via Supabase CLI (For Local Development)

1. Create a `.env.local` file in your project root (same directory as `package.json`)
2. Add the following line:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
3. Save the file
4. The CLI will automatically pick up this variable when running the dev server

### Step 3: Deploy the Edge Function

The Gemini Chat edge function needs to be deployed to access the API key:

1. Open your terminal
2. Navigate to your project directory
3. Run the following command:
   ```bash
   supabase functions deploy gemini-chat
   ```
4. Wait for the deployment to complete
5. You should see a message like: `✓ Function deployed successfully`

### Step 4: Restart the Development Server

1. Stop the dev server (press `Ctrl+C`)
2. Restart it:
   ```bash
   npm run dev
   ```
3. The browser should automatically reload

## Verification

Once you've completed the setup, verify that Gemini is working:

### Check the Console

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the **Console** tab
3. Look for a message like:
   ```
   ✅ Gemini Configuration Status: READY
   AI features are enabled and ready to use
   ```

### Test a Feature

1. **Chat Assistant**: Look for the "JuaAfya AI" floating button in the bottom-right corner of the dashboard
2. Click it to open the chat
3. Send a test message (e.g., "Hello!")
4. You should receive an AI-generated response

If you see an error or the chat button doesn't appear, see the **Troubleshooting** section below.

## Troubleshooting

### Issue: Chat Button Not Appearing

**Causes**:
- Gemini is still being checked on page load
- Gemini API key is not configured
- The edge function failed to deploy

**Solution**:
1. Check the browser console (F12 → Console tab)
2. Look for error messages starting with `[Gemini]`
3. Check the specific error type in the message

### Issue: "GEMINI_API_KEY is not configured in environment variables"

**Cause**: The API key was not added to Supabase secrets or the edge function wasn't deployed.

**Solution**:
1. Verify you added the secret in Supabase Dashboard:
   - Settings → Edge Function Secrets
   - Secret name should be exactly: `GEMINI_API_KEY`
   - Secret value should be your Google API key
2. Re-deploy the edge function:
   ```bash
   supabase functions deploy gemini-chat
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

### Issue: "The Gemini API key is invalid or expired"

**Cause**: The API key you provided is invalid or has expired.

**Solution**:
1. Go back to [Google AI Studio](https://aistudio.google.com/)
2. Check if your API key is still active
3. If needed, create a new API key
4. Update the secret in Supabase with the new key:
   - Settings → Edge Function Secrets
   - Click on the `GEMINI_API_KEY` secret
   - Click **Edit** and paste the new key
5. Re-deploy the edge function:
   ```bash
   supabase functions deploy gemini-chat
   ```

### Issue: "Gemini API rate limit exceeded"

**Cause**: You've made too many requests to the Gemini API within a short time period.

**Solution**:
- Wait a few minutes before trying again
- Consider upgrading your Google AI plan if this happens frequently
- The app will automatically retry with exponential backoff

### Issue: Chat Sends but Shows "AI assistant is temporarily unavailable"

**Cause**: Network timeout or Gemini API is temporarily unavailable.

**Solution**:
1. Check your internet connection
2. Wait a moment and try again
3. The app includes automatic retry logic - it will attempt up to 3 times
4. If the problem persists, check the Google AI status page

### Issue: "Edge Function returned a non-2xx status code"

**Cause**: The edge function is deployed but encounters an error when running.

**Solution**:
1. Check the Supabase logs:
   - Go to Supabase Dashboard
   - Select your project
   - Go to Logs or Edge Function details
   - Look for error messages
2. Most common causes:
   - API key not configured (see "not configured" error above)
   - API key is invalid (see "invalid" error above)
   - Timeout (edge function took too long - usually temporary)

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `API_KEY_NOT_CONFIGURED` | Gemini API key is not set | Follow Step 2 to add the API key |
| `INVALID_API_KEY` | API key is invalid or expired | Generate a new key from Google AI Studio |
| `RATE_LIMITED` | Too many requests | Wait a moment and try again |
| `NETWORK_TIMEOUT` | Connection took too long | Check internet and try again |
| `TEMPORARY_UNAVAILABLE` | Gemini API is down | Wait and try again in a few minutes |
| `EDGE_FUNCTION_ERROR` | Function deployment issue | Re-run `supabase functions deploy gemini-chat` |

## Advanced Configuration

### Using Different Gemini Models

The app currently uses `gemini-2.0-flash` which is optimized for speed. You can change this in:
- `services/geminiService.ts` - Change the `model` parameter in function calls
- `supabase/functions/gemini-chat/index.ts` - Change the default model

Available models:
- `gemini-2.0-flash` (default, fast & efficient)
- `gemini-2.0-flash-exp` (experimental, latest features)
- `gemini-1.5-pro` (slower but more powerful)

### Monitoring API Usage

To monitor your Gemini API usage:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your project
4. Go to **APIs & Services** → **Quotas**
5. Filter for "Generative Language API"

### Setting API Quotas

To prevent unexpected costs:
1. In Google Cloud Console, go to **APIs & Services** → **Quotas**
2. Find "Generative Language API"
3. Set daily quotas for your API key

## Support

### Need Help?

- Check the troubleshooting section above
- Review the error message in the browser console
- Check the Supabase edge function logs
- Contact your administrator

### Reporting Issues

When reporting an issue, include:
- The exact error message (from browser console or toast notification)
- Steps to reproduce
- Browser type and version
- Whether setup was just completed or was working before

## Security Best Practices

1. **Never commit the API key** to git or version control
2. **Use environment variables** - Store keys in Supabase secrets, not in code
3. **Rotate keys regularly** - Generate new keys monthly or quarterly
4. **Monitor usage** - Check API usage to detect unusual activity
5. **Use minimal permissions** - Only grant the API access needed for AI features

## Disabling AI Features

If you want to completely disable AI features:

1. Delete the `GEMINI_API_KEY` secret from Supabase:
   - Settings → Edge Function Secrets
   - Click the trash icon next to `GEMINI_API_KEY`
2. The app will automatically:
   - Hide the chat button
   - Disable AI-dependent features
   - Show "unavailable" messages where applicable

No code changes are needed.

## FAQ

**Q: Is there a free tier?**
A: Yes! Google offers a free tier with 60 requests per minute. This is sufficient for most clinic use cases. See [Google AI pricing](https://ai.google.dev/pricing) for details.

**Q: Can I use a different AI provider?**
A: The current implementation is Gemini-specific. To use a different provider, you would need to modify the edge function and service layer.

**Q: How long do requests take?**
A: Typically 1-3 seconds. The app has a 30-second timeout before showing an error.

**Q: Are messages stored?**
A: Chat messages are stored in memory for the current session only. They are not persisted to the database by default. Each new session starts fresh.

**Q: Can I use this offline?**
A: No, the Gemini API requires an internet connection. The app will gracefully handle offline scenarios.

**Q: What data is sent to Google?**
A: Only the user's query and any context provided (like patient data if you include it in the prompt). Google stores this data for a limited time for security and abuse prevention purposes.
