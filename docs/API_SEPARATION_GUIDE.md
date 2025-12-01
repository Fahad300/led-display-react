# API Separation Guide: Team Performance Comparison vs Team Wise Data

## Overview

This document explains how to change the API endpoint for **Team Performance Comparison** to use a different API than **Team Wise Data**.

Previously, both slides used the same API endpoint (`/api/proxy/jira-chart`). Now they are separated:
- **Team Wise Data** → uses `graphData` → fetches from `/api/proxy/jira-chart`
- **Team Performance Comparison** → uses `teamComparisonData` → fetches from `/api/proxy/jira-chart` (you can change this)

## Architecture

### Backend (Server)

The backend fetches data from external APIs and consolidates it into a single response at `/api/dashboard`.

**File**: `server/src/routes/dashboard.ts`

#### Key Changes:

1. **Added `teamComparisonData` field** to the cache interface and response
2. **Separate API fetch** for team comparison data
3. **Automatic updates** via the existing 60-second cache refresh

#### Where to Change the Endpoint:

Find line 157 in `server/src/routes/dashboard.ts`:

```typescript
const [employeesResult, graphDataResult, teamComparisonResult, escalationsResult] = await Promise.allSettled([
    fetchFromExternalApi("celebrations", "employees data"),
    fetchFromExternalApi("jira-chart", "graph data"),
    fetchFromExternalApi("jira-chart", "team comparison data"), // ← CHANGE THIS
    fetchFromExternalApi("ongoing-escalations", "escalations data")
]);
```

**To change the API endpoint:**

Replace `"jira-chart"` on line 157 with your new endpoint name (e.g., `"team-performance"`):

```typescript
fetchFromExternalApi("team-performance", "team comparison data"),
```

Also update the error logging on line 226:

```typescript
logger.error("   Endpoint: /api/proxy/team-performance"); // Update this too
```

### Frontend (Client)

The frontend consumes the consolidated `/api/dashboard` endpoint and distributes the data to components.

#### Key Changes:

1. **Updated `DashboardData` interface** to include `teamComparisonData`
2. **Added `useTeamComparisonData()` hook** for convenience
3. **Updated `UnifiedContext`** to expose the new field
4. **Modified `TeamComparisonSlideComponent`** to use `teamComparisonData` instead of `graphData`

#### Files Modified:

1. **`client/src/hooks/useDashboardData.ts`**
   - Added `teamComparisonData: any` to `DashboardData` interface
   - Added `useTeamComparisonData()` convenience hook

2. **`client/src/contexts/UnifiedContext.tsx`**
   - Added `teamComparisonData` field to context
   - Exposed it for backward compatibility

3. **`client/src/components/slides/TeamComparisonSlide.tsx`**
   - Changed from using `graphData` to `teamComparisonData`
   - Added documentation explaining the separation

## How Updates Work

The system automatically polls for updates every 60 seconds:

1. **Backend**: Fetches fresh data from external APIs every 60 seconds
2. **Cache**: Stores the data with 60-second freshness
3. **Frontend**: React Query polls `/api/dashboard` every 60 seconds
4. **Display**: Automatically receives updates via Socket.IO or polling

### Update Flow:

```
External API → Backend Cache (60s) → /api/dashboard → React Query → UnifiedContext → Components
```

### Real-time Updates:

- **Socket.IO**: Instant updates when admin changes settings
- **Polling**: Fallback every 60 seconds to ensure freshness
- **Visibility Detection**: Refreshes when display becomes visible
- **Cache Strategy**: Always returns data (even if stale) for zero downtime

## Testing the Changes

### 1. Test the Backend

Check if the new endpoint is being fetched:

```bash
# View cache status
curl http://localhost:5000/api/dashboard/cache-status

# View full dashboard data
curl http://localhost:5000/api/dashboard
```

Look for the `teamComparisonData` field in the response.

### 2. Test the Frontend

1. Open the admin page (HomePage)
2. Open the display page in another tab
3. Enable the "Team Performance Comparison" slide
4. Check if it displays data from the new API

### 3. Monitor Logs

**Backend logs** (in terminal running the server):
```
✅ Successfully fetched team comparison data
```

**Frontend logs** (in browser console):
```javascript
// You should see teamComparisonData in the dashboard response
console.log(data.teamComparisonData);
```

## Data Format

Both `graphData` and `teamComparisonData` use the same internal format (`GraphSlideData`), but they come from different API endpoints:

### Internal Format (GraphSlideData)

```typescript
interface GraphSlideData {
    title: string;
    description: string;
    graphType: 'bar' | 'line' | 'pie';
    data: Array<{
        teamName: string;
        dataPoints: Array<{
            date: string;
            value: number;
            category: string;
        }>;
    }>;
    timeRange: string;
    lastUpdated: string;
    categories: string[];
}
```

### Team Wise Data API Format (jira-chart)

**Endpoint:** `/api/proxy/jira-chart`

```json
{
    "labels": ["Team 1", "Team 2", ...],
    "data": [[10, 5, 3, ...], [8, 12, 2, ...], ...],
    "priorities": ["C-Level", "P1", "P2", "P3", "P4"]
}
```

This is transformed by `transformJiraChartData()` function.

### Team Performance Comparison API Format (ssr-team-wise)

**Endpoint:** `/api/proxy/ssr-team-wise`

```json
{
    "from_month": "2025-09-01",
    "to_month": "2025-09-30 23:59:59",
    "data": [
        {
            "Team": "MOBILE TEAM",
            "Disaster": 0,
            "Code Blue": 2,
            "C-Level": 0,
            "Omega": 0,
            "P1": 0,
            "P2": 1,
            "P3": 0,
            "P4": 0,
            "P5": 0,
            "Total": 3,
            "Not an Issue": 1,
            "Overall Total With \"Not an Issue\"": 4
        },
        ...
    ]
}
```

This is transformed by `transformSsrTeamWiseData()` function.

### Priority Categories

The new `ssr-team-wise` endpoint supports **9 priority categories**:

1. **Disaster** - Most critical (purple background)
2. **Code Blue** - Emergency (dark red background)
3. **C-Level** - Top priority (red background)
4. **Omega** - High priority (pink background)
5. **P1** - Blocker (orange background)
6. **P2** - Critical (yellow background)
7. **P3** - Major (blue background)
8. **P4** - Minor (green background)
9. **P5** - Trivial (teal background)

### Adding a New API Endpoint

If you need to add another API endpoint with a different format:

1. Create a transformation function in `server/src/routes/dashboard.ts`:
   ```typescript
   const transformYourNewApi = (rawData: any): any => {
       // Transform to GraphSlideData format
       return {
           title: "...",
           data: [...],
           categories: [...],
           // ... other fields
       };
   };
   ```

2. Update `fetchAllDashboardData()` to fetch from the new endpoint
3. Use the transformation function before storing in cache
4. Update TypeScript types if needed

## Rollback

If you need to revert the changes:

1. Change line 157 in `dashboard.ts` back to use the same endpoint:
   ```typescript
   fetchFromExternalApi("jira-chart", "team comparison data"),
   ```

2. The frontend will automatically receive the same data for both slides

## Future Improvements

1. **Custom transformation functions**: Add specific data transformers for each endpoint
2. **Independent polling intervals**: Configure different refresh rates per endpoint
3. **Selective updates**: Only refresh changed data instead of all endpoints
4. **WebSocket events**: Send targeted updates for specific slide types
5. **Caching strategies**: Implement per-endpoint cache TTLs

## Summary

✅ **Backend**: Added separate fetch for `teamComparisonData`
✅ **Frontend**: Updated to consume the new field
✅ **Component**: Modified to use `teamComparisonData` instead of `graphData`
✅ **Updates**: Automatic via existing polling mechanism (60 seconds)

**To change the API endpoint**, simply update line 157 in `server/src/routes/dashboard.ts` with your new endpoint name!

