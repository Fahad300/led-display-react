# API Debugging Guide

## Issue: Graph Slide (jira-chart) Not Showing Data

This guide helps you identify why the jira-chart API is failing while escalations API works.

---

## What Was Changed

### Backend (`server/src/routes/dashboard.ts`)
1. **Enhanced Error Logging**: Each API endpoint now logs success ✅ or failure ❌ with detailed error messages
2. **Failure Tracking**: Returns an array of `failures` showing which endpoints failed and why
3. **Warning Messages**: Response includes warnings when any API fails
4. **ZERO DOWNTIME Caching**: Stale cache is ALWAYS served when fresh fetch fails (regardless of age)
   - **Before**: Cache expired → fetch fails → no data for 1-2 minutes ❌
   - **After**: Cache expired → fetch fails → serve stale cache ✅

### Frontend (`client/src/hooks/useDashboardData.ts`)
1. **Failure Detection**: Logs which specific APIs failed in the browser console
2. **Error Details**: Shows the exact error message for each failed endpoint

---

## How to Debug

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and look for these messages:

**Good (All APIs Working):**
```
✅ Successfully fetched employees data
✅ Successfully fetched graph data (jira-chart)
✅ Successfully fetched escalations data
```

**Problem Detected:**
```
❌ API Endpoint Failures Detected:
   - jira-chart: [error message here]
⚠️ Some slide data may be incomplete. Check the backend logs for details.
```

### Step 2: Check Backend Server Logs

Look for these log entries when the dashboard is fetched:

**Successful:**
```
✅ Successfully fetched employees data
✅ Successfully fetched graph data (jira-chart)
✅ Successfully fetched escalations data
```

**Failed:**
```
❌ Failed to fetch graph data (jira-chart): [error message]
   Endpoint: /api/proxy/jira-chart
⚠️  1 API endpoint(s) failed. Returning partial data.
```

### Step 3: Test Individual Endpoints

Test each proxy endpoint directly to isolate the issue:

```bash
# Test escalations (working)
curl http://localhost:5000/api/proxy/ongoing-escalations

# Test jira-chart (possibly failing)
curl http://localhost:5000/api/proxy/jira-chart

# Test employees
curl http://localhost:5000/api/proxy/celebrations
```

### Step 4: Common Issues & Solutions

#### Issue: "Connection refused" or "Network error"
**Cause**: The external API service is down or unreachable
**Solution**: 
- Check if the external API URL is correct in `server/src/routes/proxy.ts`
- Verify the external service is running
- Check firewall/network settings

#### Issue: "401 Unauthorized" or "403 Forbidden"
**Cause**: Missing or invalid API credentials
**Solution**:
- Check if API keys/tokens are configured in `.env`
- Verify credentials are valid and not expired

#### Issue: "404 Not Found"
**Cause**: The API endpoint URL is incorrect
**Solution**:
- Verify the endpoint path in `server/src/routes/proxy.ts`
- Check the external API documentation for correct endpoint

#### Issue: "500 Internal Server Error"
**Cause**: The external API has an internal error
**Solution**:
- Check the external API's status page
- Look at the external API's logs if you have access

#### Issue: "Timeout"
**Cause**: The external API is responding too slowly
**Solution**:
- Increase the timeout in `fetchFromExternalApi()` function
- Check network latency to the external API

---

## Expected Response Format

### Dashboard Endpoint (`/api/dashboard`)

**Successful Response (all APIs working):**
```json
{
  "success": true,
  "data": {
    "employees": [...],
    "graphData": {...},
    "escalations": [...]
  },
  "cached": false,
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

**Partial Failure Response (jira-chart failing):**
```json
{
  "success": true,
  "data": {
    "employees": [...],
    "graphData": null,
    "escalations": [...],
    "failures": [
      {
        "endpoint": "jira-chart",
        "error": "Connection timeout after 30000ms"
      }
    ]
  },
  "cached": false,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "warning": "1 API endpoint(s) failed: jira-chart. Some data may be incomplete."
}
```

---

## Quick Debugging Checklist

- [ ] Check browser console for "❌ API Endpoint Failures"
- [ ] Check backend logs for specific error messages
- [ ] Test `/api/proxy/jira-chart` endpoint directly
- [ ] Verify external API is reachable
- [ ] Check API credentials/tokens
- [ ] Verify endpoint URL is correct
- [ ] Check network connectivity
- [ ] Review external API documentation

---

## Next Steps

1. **Enable Development Mode** (if not already enabled):
   - Go to HomePage → Settings
   - Toggle "Development Mode" to see detailed logs

2. **Check the actual error message** from the logs above

3. **Compare with working endpoint**:
   - Why does `ongoing-escalations` work but `jira-chart` doesn't?
   - Are they using different authentication?
   - Different base URLs?

4. **Check the proxy configuration** in `server/src/routes/proxy.ts`:
   ```typescript
   // Find the jira-chart route configuration
   router.get("/jira-chart", async (req, res) => {
     // Check the URL and any auth headers here
   });
   ```

---

## Need More Help?

If the issue persists:
1. Share the **exact error message** from browser console (❌ section)
2. Share the **backend log output** when fetching dashboard
3. Share the **response** from testing `/api/proxy/jira-chart` directly
4. Share the **configuration** in `server/src/routes/proxy.ts` for jira-chart

---

## Technical Details

### How the System Works Now

1. **Frontend** calls `/api/dashboard` every 60 seconds
2. **Backend** fetches from 3 endpoints in parallel:
   - `/api/proxy/celebrations` → employees
   - `/api/proxy/jira-chart` → graphData
   - `/api/proxy/ongoing-escalations` → escalations
3. If any endpoint fails, it's logged and tracked in `failures` array
4. Working data is still returned with a warning
5. Failed endpoints return `null` or `[]` so slides don't crash

### Why This Design?

- **Zero Downtime**: Stale cache is ALWAYS served when APIs fail - users never see missing data
- **Resilient**: One API failure doesn't break the entire dashboard
- **Transparent**: You can see exactly which API failed and why
- **Cached**: Fresh data served within 60 seconds, stale data used as fallback forever
- **Fast**: Parallel requests mean faster overall response time

### Caching Strategy (ZERO DOWNTIME)

1. **Cache Fresh (< 60 seconds)**: Serve immediately ✅
2. **Cache Expired**: Attempt fresh fetch
3. **Fresh Fetch Success**: Update cache and serve ✅
4. **Fresh Fetch Fails + Cache Exists**: Serve stale cache with warning ⚠️
5. **Fresh Fetch Fails + No Cache**: Return error (first request only) ❌

**Key Point**: Once cache is populated, users NEVER see missing data, even if APIs are down for hours.

