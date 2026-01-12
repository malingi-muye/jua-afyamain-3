# Gemini AI Testing Guide

This document provides comprehensive testing procedures for all Gemini AI features in JuaAfya.

## Quick Test Summary

Use this checklist to verify the Gemini integration is working correctly:

- [ ] Chat button appears after page load
- [ ] Chat window opens/closes properly
- [ ] Chat message sends and receives response
- [ ] Error messages are user-friendly and actionable
- [ ] Retry logic works when errors occur
- [ ] Chat disappears gracefully when Gemini not available
- [ ] Console shows proper logging and no errors
- [ ] Setup documentation is accessible

## Test Scenarios

### Scenario 1: Gemini Properly Configured ✅

**Setup**: GEMINI_API_KEY is set in Supabase secrets, edge function is deployed

**Expected Behavior**:
1. Page loads
2. Console shows: `✅ Gemini Configuration Status: READY`
3. Chat button appears in bottom-right corner
4. Chat window shows welcome message
5. Can send messages and receive responses
6. No error toasts or warnings

**Test Steps**:
```bash
# 1. Verify API key is set
# Check Supabase Dashboard → Settings → Edge Function Secrets
# Should see GEMINI_API_KEY listed

# 2. Verify edge function is deployed
supabase functions list
# Should show gemini-chat in the list

# 3. Start dev server
npm run dev

# 4. Open browser to http://localhost:3000
# Look for chat button in bottom-right

# 5. Open browser console (F12)
# Should see: ✅ Gemini Configuration Status: READY

# 6. Click chat button
# Should see welcome message

# 7. Send test message
# Type: "Hello, how are you?"
# Should receive AI response within 3-5 seconds

# 8. Verify console has clean logs
# Should see: [Gemini] Chat response received
# No error messages
```

**Pass Criteria**:
- ✅ Chat button visible and functional
- ✅ Console shows "READY" status
- ✅ Messages send and receive responses
- ✅ No console errors

---

### Scenario 2: Gemini Not Configured ❌

**Setup**: GEMINI_API_KEY is NOT set in Supabase secrets

**Expected Behavior**:
1. Page loads normally
2. Console shows warning about Gemini not being configured
3. Chat button does NOT appear
4. No error messages to user
5. App functions normally (Gemini features just unavailable)

**Test Steps**:
```bash
# 1. Remove or comment out the GEMINI_API_KEY in Supabase
# Supabase Dashboard → Settings → Edge Function Secrets
# Delete the GEMINI_API_KEY secret

# 2. Restart dev server
# Stop current server (Ctrl+C)
npm run dev

# 3. Open browser to http://localhost:3000
# Chat button should NOT be visible

# 4. Open browser console (F12)
# Look for warning message starting with "⚠️ Gemini Configuration Status"
# Should mention API_KEY_NOT_CONFIGURED

# 5. Try to access Gemini-dependent features
# (if there are any buttons/links that use Gemini)
# Should show "Feature unavailable" message instead of error

# 6. Verify app is fully functional otherwise
# All other features should work normally
```

**Pass Criteria**:
- ✅ Chat button is hidden (not shown, not disabled)
- ✅ Console shows warning about not being configured
- ✅ No error toasts to user
- ✅ App continues to function normally
- ✅ Setup documentation link visible if trying to use Gemini features

---

### Scenario 3: Invalid API Key ❌

**Setup**: GEMINI_API_KEY is set but with an invalid/fake value

**Expected Behavior**:
1. Chat button appears initially (hasn't been tested yet)
2. When user sends a message or on retry check:
   - Chat button disappears after failed authentication
   - Error message shows "The Gemini API key is invalid or expired"
   - Console shows `INVALID_API_KEY` error type
3. Retry button becomes available
4. Setup documentation link shown

**Test Steps**:
```bash
# 1. Set invalid API key in Supabase
# Supabase Dashboard → Settings → Edge Function Secrets
# GEMINI_API_KEY = "invalid-key-12345"

# 2. Restart dev server
npm run dev

# 3. Open browser to http://localhost:3000
# Chat button appears

# 4. Open browser console
# Should eventually show warning about invalid API key

# 5. Open chat window
# Click send with a test message

# 6. Observe error handling:
# Error message should appear in chat
# Console shows proper error categorization
# Retry button appears

# 7. Click Retry button
# Should re-check configuration and update status

# 8. Chat button should disappear after retry confirms key is invalid
```

**Pass Criteria**:
- ✅ Error message is user-friendly (not technical error code)
- ✅ Console shows proper error type (`INVALID_API_KEY`)
- ✅ Retry button works
- ✅ Feature gracefully degrades after repeated failures

---

### Scenario 4: Network Timeout / Temporary Unavailable 🔄

**Setup**: Valid API key set, but network is slow or Gemini API is down

**Expected Behavior**:
1. User sends message
2. App shows loading state
3. After timeout (3 attempts with backoff):
   - Error message: "temporarily unavailable, please try again in a moment"
   - Retry button appears
4. Retry works when service is back up

**Test Steps**:

#### Option A: Simulate Network Failure (Chrome DevTools)
```bash
# 1. Start dev server with valid API key
npm run dev

# 2. Open browser to http://localhost:3000
# Chat window opens

# 3. Open Chrome DevTools (F12)
# Go to Network tab

# 4. Open Chat and send a message
# Pause the network request to gemini-chat function:
# Right-click on the request → throttle to offline

# 5. Observe:
# "Loading..." spinner appears
# After 30 seconds, timeout error shown
# Console shows "NETWORK_TIMEOUT"

# 6. Resume the network request
# Retry button should now work
```

#### Option B: Wait for Actual Timeout
```bash
# 1. Send multiple messages rapidly
# If you hit rate limiting or Gemini API is slow:
# You'll see timeout errors naturally

# 2. Verify error handling:
# Error message is clear
# Retry logic works
# Console shows proper categorization
```

**Pass Criteria**:
- ✅ Loading state shows for reasonable time
- ✅ Timeout error is clear and actionable
- ✅ Retry button works and re-attempts
- ✅ Exponential backoff is working (console shows delays)

---

### Scenario 5: Rate Limiting 🚫

**Setup**: Valid API key, but make many rapid requests

**Expected Behavior**:
1. First few messages work fine
2. After exceeding rate limit (~60 requests/minute):
   - Error: "Too many requests, the AI service is temporarily busy"
   - Console shows `RATE_LIMITED` error
3. Automatic retry with exponential backoff
4. Messages succeed again after the rate limit window passes

**Test Steps**:
```bash
# 1. Start dev server with valid API key
npm run dev

# 2. Open chat
# Send 10-15 messages very rapidly
# (Use Retry button multiple times or just keep typing)

# 3. On 60+ requests within a minute, observe:
# Error message about "too many requests"
# App shows "temporarily busy" message
# Console shows rate limiting error

# 4. Wait 1-2 minutes

# 5. Try sending message again
# Should work fine (rate limit window has passed)

# 6. Check console
# Should show exponential backoff delays: 1s, 2s, 4s
```

**Pass Criteria**:
- ✅ Error message is clear (not technical error)
- ✅ Backoff delays are present (exponential: 1s, 2s, 4s)
- ✅ Max 3 retry attempts
- ✅ Messages work again after cooldown period

---

### Scenario 6: Edge Function Not Deployed ❌

**Setup**: API key is set, but edge function hasn't been deployed

**Expected Behavior**:
1. Chat button may appear initially
2. When sending message:
   - Error: "Failed to invoke Gemini edge function"
   - Console shows `EDGE_FUNCTION_ERROR`
3. User sees actionable error message

**Test Steps**:
```bash
# 1. Verify edge function is NOT deployed
supabase functions list
# Should NOT show gemini-chat in the list

# 2. Set a valid API key in Supabase
# (so it's not a configuration error)

# 3. Start dev server
npm run dev

# 4. Try to send a chat message
# Error appears: "Failed to invoke Gemini edge function"

# 5. Deploy the function
supabase functions deploy gemini-chat

# 6. Restart dev server
npm run dev

# 7. Send chat message again
# Should now work
```

**Pass Criteria**:
- ✅ Error indicates deployment issue (not just "failed")
- ✅ Instructions mention deploying function
- ✅ Works after deployment

---

### Scenario 7: Browser Console Logging

**Objective**: Verify that logging is clean and informative

**Test Steps**:
```bash
# 1. Open browser to http://localhost:3000
# Open Console (F12 → Console tab)

# 2. Clear console (click clear button)
# Reload page

# 3. Observe initial logs:
# Should see:
# - [Gemini] Checking configuration status...
# - [Gemini] Configuration check passed - Gemini is available
# - [ChatBot] Checking Gemini availability...
# - [ChatBot] Gemini is available

# 4. Open chat and send message
# Should see:
# - [Gemini] Invoking edge function (attempt 1/3)
# - [Gemini] Response received (X chars)
# - [ChatBot] Sending message to Gemini...

# 5. Verify NO console errors
# - Should be no red error messages
# - Should be no undefined references
# - Should be no stack traces
```

**Pass Criteria**:
- ✅ All logs have consistent prefix (`[Gemini]`, `[ChatBot]`, etc.)
- ✅ Logs show progress (not overwhelming)
- ✅ No console errors
- ✅ Can understand flow from logs

---

### Scenario 8: Caching Behavior

**Objective**: Verify that configuration checks are cached to avoid repeated calls

**Test Steps**:
```bash
# 1. Start dev server
npm run dev

# 2. Open browser console
# Filter for "[Gemini]" logs

# 3. Load page
# Should see "Checking configuration status..."

# 4. Reload page multiple times (F5)
# After first load:
# - First reload: Checks configuration
# - Subsequent reloads: Uses cached status (says "Returning cached status")
# - After 5 minutes: Checks again (cache expired)

# 5. Click Retry button in chat
# Clear cache is called: "[Gemini] Cache cleared"
# Configuration is checked again

# 6. Verify caching works
# Config checks should not spam the console
# Each page load should only check once
```

**Pass Criteria**:
- ✅ Configuration is checked on page load
- ✅ Cached status is used on subsequent loads
- ✅ Clear cache works via retry button
- ✅ Cache expires after 5 minutes

---

## Component-Specific Tests

### ChatBot Component Tests

#### Test 1: Mounting and Initialization
```typescript
// Expected behavior:
// 1. Component mounts
// 2. Checks Gemini availability immediately
// 3. Updates state based on result
// 4. Renders appropriate UI (button or nothing)

// Verification:
// - In console, see "[ChatBot] Checking Gemini availability..."
// - Chat button appears if available, hidden if not
// - No React errors in console
```

#### Test 2: Opening and Closing Chat
```
// Send a message
// Verify history is maintained
// Close and reopen chat
// History should still be there (session memory)
// Reload page
// History should be cleared (new session)
```

#### Test 3: Error Recovery
```
// Simulate error (invalid key or offline)
// Send message - error appears
// Click Retry button
// Should recheck configuration
// If fixed, chat should work now
```

### GeminiFeatureGuard Component Tests

#### Test 1: Available Feature
```
// Wrap a component with GeminiFeatureGuard
// <GeminiFeatureGuard>
//   <SomeFeature />
// </GeminiFeatureGuard>

// If Gemini is available: Should render <SomeFeature />
// If not available: Should show warning message with setup link
```

#### Test 2: Custom Fallback
```
// <GeminiFeatureGuard
//   featureName="Analysis Feature"
//   fallback={<CustomMessage />}
// >
//   <Analysis />
// </GeminiFeatureGuard>

// Should render custom fallback when unavailable
```

---

## Error Handling Tests

### Test 1: All Error Types Are Handled

Check that each error type shows appropriate message:

| Error Type | Expected User Message | Console Shows |
|------------|----------------------|---------------|
| `API_KEY_NOT_CONFIGURED` | "contact administrator" | API_KEY_NOT_CONFIGURED |
| `INVALID_API_KEY` | "API key is invalid" | INVALID_API_KEY |
| `RATE_LIMITED` | "service is busy, try later" | RATE_LIMITED |
| `NETWORK_TIMEOUT` | "connection timeout" | NETWORK_TIMEOUT |
| `TEMPORARY_UNAVAILABLE` | "temporarily unavailable" | TEMPORARY_UNAVAILABLE |
| `EDGE_FUNCTION_ERROR` | "failed to connect" | EDGE_FUNCTION_ERROR |
| `INVALID_REQUEST` | "issue with request" | INVALID_REQUEST |
| `UNKNOWN_ERROR` | "unexpected error" | UNKNOWN_ERROR |

### Test 2: Retry Logic

For each retryable error:
1. Send message when error occurs
2. Verify error appears in chat
3. Verify console shows "Retrying in Xms..."
4. Verify up to 3 attempts are made
5. Verify exponential backoff: 1s, 2s, 4s delays

---

## Performance Tests

### Test 1: Response Time

Measure response time for typical interactions:

```
Chat Message: 1-3 seconds
Patient Notes Analysis: 2-5 seconds
SMS Draft: 1-2 seconds
Daily Briefing: 2-4 seconds
Staff Assistant: 2-4 seconds
```

If times are consistently longer:
- Check internet connection
- Check Gemini API status
- Consider optimizing prompts

### Test 2: No Memory Leaks

1. Open chat
2. Send 20+ messages
3. Monitor DevTools Memory usage
4. Should remain stable (not continuously growing)
5. Close chat
6. Memory should be freed

### Test 3: Large Input Handling

1. Send very long message (>1000 chars)
2. Should handle without errors
3. Response time should increase proportionally
4. No UI freezing

---

## Accessibility Tests

### Test 1: Keyboard Navigation

- Tab through chat components
- Send message with Enter key
- Close with Escape key
- Open with keyboard (if applicable)

### Test 2: Screen Reader

- Chat messages are announced
- Error messages are announced
- Button purposes are clear
- Focus indicators are visible

### Test 3: Dark Mode

- All messages readable in dark mode
- Buttons have sufficient contrast
- No unreadable text on dark backgrounds

---

## Deployment Checklist

Before deploying to production:

- [ ] Gemini API key is set in Supabase secrets
- [ ] Edge function is deployed: `supabase functions deploy gemini-chat`
- [ ] All error scenarios tested and working
- [ ] Chat button appears correctly for authenticated users
- [ ] No console errors in production builds
- [ ] Logging is at appropriate verbosity level
- [ ] Rate limiting is configured on Google Cloud if needed
- [ ] Users have access to GEMINI_SETUP.md documentation
- [ ] Support team knows how to troubleshoot Gemini issues
- [ ] Monitoring/alerting is set up for edge function failures

---

## Continuous Testing

### Daily
- Test basic chat functionality
- Verify no new console errors
- Check that appropriate users can access features

### Weekly
- Run through all error scenarios
- Verify logging is clean
- Check error messages for clarity

### Monthly
- Review Google Cloud API usage
- Test with different network conditions (throttle, offline)
- Verify documentation is up to date

---

## Debugging Tips

### Enable Verbose Logging

Set in `vite.config.ts`:
```typescript
define: {
  'import.meta.env.VITE_VERBOSE_LOGS': JSON.stringify(true),
}
```

Then check console for more detailed logs.

### Check Network Tab

1. Open DevTools → Network tab
2. Filter for "gemini" or "edge"
3. Click on the request to see:
   - Request payload (what was sent)
   - Response (what came back)
   - Status code
   - Headers
   - Timing

### Check Edge Function Logs

```bash
# View real-time logs from edge function
supabase functions logs gemini-chat

# Or check in Supabase Dashboard:
# → Functions → gemini-chat → Logs
```

### Test API Directly

```bash
# Test the edge function directly
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/gemini-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "gemini-2.0-flash"}'
```

---

## Reporting Test Results

When reporting issues, include:
1. **Test scenario**: Which scenario failed
2. **Expected vs Actual**: What should happen vs what happened
3. **Reproduction steps**: Exact steps to reproduce
4. **Console logs**: Error messages and relevant logs
5. **Browser/Device**: Browser type, version, OS
6. **Timing**: When it happened, how often
7. **Screenshots**: If visual issue

---

## Success Criteria

The Gemini integration is considered complete when:

✅ **Functionality**
- Chat works with valid API key
- All error types are handled gracefully
- Retry logic works correctly
- Features degrade gracefully when unavailable

✅ **User Experience**
- Clear, actionable error messages
- No confusing technical errors
- Fast response times (1-3 seconds typical)
- Smooth animations and transitions

✅ **Reliability**
- No console errors
- Edge function deployments work reliably
- Proper logging for debugging
- Cache works correctly

✅ **Documentation**
- Setup guide is clear and complete
- Troubleshooting section addresses common issues
- Testing guide covers all scenarios
- FAQs answer user questions

✅ **Code Quality**
- Proper error handling throughout
- Consistent logging patterns
- No hardcoded API keys or secrets
- Well-commented code

Once all criteria are met, the implementation is production-ready.
