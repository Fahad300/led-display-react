# LED Display System - Architecture Documentation

## Overview

This document describes the simplified architecture of the LED Display System after the major refactoring completed in January 2025.

## Architecture Goals

1. **Centralized Data Fetching**: Single source of truth for API data using React Query
2. **Simplified State Management**: Zustand for UI state, React Query for server state
3. **Clear Separation of Concerns**: API, UI state, and business logic are clearly separated
4. **Optimized Performance**: Reduced re-renders, better caching, minimal prop drilling
5. **Easy Debugging**: Clear data flow, minimal layers, comprehensive logging

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      REACT APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Slides     │      │
│  │              │  │              │  │              │      │
│  │ • HomePage   │  │ • SlideCard  │  │ • GraphSlide │      │
│  │ • AdminPage  │  │ • Swiper     │  │ • EventSlide │      │
│  │ • DisplayPage│  │ • Editors    │  │ • NewsSlide  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                        ▼                            │   │
│  │              DATA LAYER (STATE MANAGEMENT)          │   │
│  │                                                      │   │
│  │  ┌──────────────────┐      ┌──────────────────┐    │   │
│  │  │  React Query     │      │  Zustand Store   │    │   │
│  │  │  (Server State)  │      │  (UI State)      │    │   │
│  │  │                  │      │                  │    │   │
│  │  │ • useDashboard   │      │ • currentSlide   │    │   │
│  │  │ • useEmployees   │      │ • displayMode    │    │   │
│  │  │ • useGraphData   │      │ • isEditing      │    │   │
│  │  │ • useEscalations │      │ • transitions    │    │   │
│  │  │                  │      │ • settings       │    │   │
│  │  │ [Auto-caching]   │      │ [Local State]    │    │   │
│  │  │ [Auto-refetch]   │      │ [Fast Updates]   │    │   │
│  │  └─────────┬────────┘      └──────────────────┘    │   │
│  └────────────┼──────────────────────────────────────┘   │
│               │                                           │
│  ┌────────────┼──────────────────────────────────────┐   │
│  │            ▼                                       │   │
│  │              API LAYER                             │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         /src/api/backendApi.ts               │  │   │
│  │  │                                              │  │   │
│  │  │  • Axios instance with auth interceptor     │  │   │
│  │  │  • Base URL configuration                   │  │   │
│  │  │  • Error handling                           │  │   │
│  │  │  • Request/response transformation          │  │   │
│  │  └──────────────────┬───────────────────────────┘  │   │
│  └────────────────────┼──────────────────────────────┘   │
│                       │                                   │
│  ┌────────────────────┼──────────────────────────────┐   │
│  │                    ▼                              │   │
│  │              MINIMAL CONTEXTS                     │   │
│  │                                                    │   │
│  │  • AuthContext    - Authentication only          │   │
│  │  • ToastContext   - Toast notifications only     │   │
│  │  • ThemeContext   - Theme/styling (if needed)    │   │
│  │                                                    │   │
│  │  ✗ UnifiedContext - REMOVED (merged to Zustand)  │   │
│  │  ✗ SettingsContext - REMOVED (merged to Zustand) │   │
│  │  ✗ UnifiedPollingContext - REMOVED (React Query) │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                        │
│                                                              │
│  /api/dashboard      - Consolidated dashboard data          │
│  /api/proxy/*        - External API proxy                   │
│  /api/auth/*         - Authentication                       │
│  /api/files/*        - File management                      │
│  /api/sessions/*     - Session management                   │
│                                                              │
│  ✅ In-memory caching (60s fresh, infinite stale fallback)  │
│  ✅ Zero-downtime error handling                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Before Refactoring (Complex)

```
Component
   ↓
useUnified() → UnifiedContext
   ↓           ↓
   ↓      UnifiedPollingContext
   ↓           ↓
   ↓      SettingsContext
   ↓           ↓
   └──→ services/api.ts → Manual Polling
                ↓
           Multiple setIntervals
                ↓
           Backend API
```

### After Refactoring (Simple)

```
Component
   ↓
   ├─→ useDashboardData() → React Query → Backend API (auto-polling)
   │                             ↓
   │                        Auto-cache & refetch
   │
   └─→ useUIStore() → Zustand → Local state (slides, settings, UI)
                        ↓
                   Fast updates, no re-renders
```

---

## New Project Structure

```
client/src/
├── api/
│   └── backendApi.ts              # ✨ NEW - Centralized Axios instance
│
├── hooks/
│   ├── useDashboardData.ts        # ✅ EXISTING - React Query hook
│   ├── useEmployeesData.ts        # ✨ NEW - Convenience wrapper
│   ├── useGraphData.ts            # ✨ NEW - Convenience wrapper
│   ├── useEscalationsData.ts      # ✨ NEW - Convenience wrapper
│   └── useVideoPlayback.ts        # ✅ EXISTING - Video utilities
│
├── stores/
│   └── useUIStore.ts              # ✨ NEW - Zustand store for UI state
│
├── contexts/
│   ├── AuthContext.tsx            # ✅ KEEP - Authentication only
│   ├── ToastContext.tsx           # ✅ KEEP - Toast notifications only
│   ├── UnifiedContext.tsx         # ⚠️ DEPRECATED - Migration wrapper only
│   ├── SettingsContext.tsx        # ⚠️ DEPRECATED - Merged to Zustand
│   └── UnifiedPollingContext.tsx  # ❌ DELETE - React Query handles this
│
├── services/
│   ├── sessionService.ts          # ✅ KEEP - Backend session integration
│   ├── api.ts                     # ⚠️ DEPRECATED - Backward compat only
│   └── [other services]           # ✅ KEEP - Specific integrations
│
├── components/
│   └── [all components]           # ✅ UPDATED - Use new hooks/store
│
├── pages/
│   └── [all pages]                # ✅ UPDATED - Use new hooks/store
│
└── utils/
    └── [utilities]                # ✅ KEEP - Helper functions
```

---

## State Management Strategy

### 1. Server State (React Query)

**What it manages:**
- API data (employees, escalations, graphs)
- Automatic caching (5 minutes garbage collection, 30s stale time)
- Automatic refetching (60s interval)
- Background updates
- Error handling with retry logic

**How to use:**
```typescript
import { useDashboardData } from "@/hooks/useDashboardData";

const MyComponent = () => {
  const { data, isLoading, error, refetch } = useDashboardData();
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  const { employees, graphData, escalations } = data;
  // Use the data...
};
```

**Advantages:**
- ✅ Automatic caching - no manual cache management
- ✅ Automatic refetching - no manual intervals
- ✅ Stale-while-revalidate - always show data
- ✅ Background updates - UI stays responsive
- ✅ Deduplication - multiple components share same request

### 2. UI State (Zustand)

**What it manages:**
- Current slide index
- Display settings (effect, pagination, arrows, logo, date)
- Edit mode state
- Slideshow control (play/pause)
- Fullscreen state
- Testing/development mode

**How to use:**
```typescript
import { useUIStore } from "@/stores/useUIStore";

const MyComponent = () => {
  // Select specific state (prevents unnecessary re-renders)
  const currentSlide = useUIStore(state => state.currentSlide);
  const setCurrentSlide = useUIStore(state => state.setCurrentSlide);
  
  // Or use multiple
  const { displaySettings, updateDisplaySettings } = useUIStore();
  
  // Update state
  setCurrentSlide(5);
  updateDisplaySettings({ swiperEffect: "fade" });
};
```

**Advantages:**
- ✅ No Context Provider needed
- ✅ Selective subscriptions - only re-render when used state changes
- ✅ Simple API - easier to understand than Context
- ✅ DevTools support - better debugging
- ✅ TypeScript-friendly - full type safety

### 3. Minimal Contexts

Only keep contexts for features that truly need to be app-wide and don't change often:

- **AuthContext**: User authentication state and methods
- **ToastContext**: Toast notification system (visual feedback)

---

## API Layer

### Centralized Axios Instance (`/src/api/backendApi.ts`)

All API calls go through a single, configured Axios instance:

```typescript
import axios from "axios";

export const backendApi = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Request interceptor - add auth token
backendApi.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors globally
backendApi.interceptors.response.use(
  response => response,
  error => {
    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## React Query Configuration

### Global Settings (`App.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,        // 5 minutes cache
      staleTime: 30 * 1000,          // 30 seconds fresh
      refetchOnWindowFocus: false,   // Don't refetch on focus
      retry: 3,                      // Retry failed requests
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

### Dashboard Hook (`/src/hooks/useDashboardData.ts`)

```typescript
export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 60 * 1000,           // Refetch every 60s
    staleTime: 30 * 1000,                 // Fresh for 30s
    refetchOnWindowFocus: false,
    retry: 3,
    placeholderData: previousData => previousData  // Keep old data while refetching
  });
};
```

---

## Zustand Store

### UI Store (`/src/stores/useUIStore.ts`)

```typescript
interface UIState {
  // Slides management
  slides: Slide[];
  setSlides: (slides: Slide[]) => void;
  updateSlide: (slide: Slide) => void;
  reorderSlides: (slides: Slide[]) => void;
  
  // Display settings
  displaySettings: DisplaySettings;
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  
  // UI state
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  
  // Actions
  saveToDatabase: () => Promise<void>;
  syncFromDatabase: () => Promise<void>;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      slides: [],
      displaySettings: DEFAULT_SETTINGS,
      isEditing: false,
      currentSlideIndex: 0,
      
      setSlides: (slides) => set({ slides }),
      updateSlide: (slide) => set(state => ({
        slides: state.slides.map(s => s.id === slide.id ? slide : s)
      })),
      // ... other actions
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        displaySettings: state.displaySettings
      })
    }
  )
);
```

---

## Migration Path

### Phase 1: ✅ Install Dependencies
- [x] Install Zustand
- [x] Verify React Query is installed

### Phase 2: ✅ Create New Architecture
- [ ] Create centralized API client (`/src/api/backendApi.ts`)
- [ ] Create Zustand store (`/src/stores/useUIStore.ts`)
- [ ] Create convenience hooks for data access

### Phase 3: ⏳ Migrate Components
- [ ] Update components to use `useDashboardData()` instead of contexts
- [ ] Update components to use `useUIStore()` for UI state
- [ ] Remove old context consumers

### Phase 4: ⏳ Cleanup
- [ ] Mark old contexts as deprecated
- [ ] Remove `UnifiedPollingContext.tsx`
- [ ] Clean up `services/api.ts`
- [ ] Update imports across the project

### Phase 5: ⏳ Testing
- [ ] Test all slides still display correctly
- [ ] Test data updates still work
- [ ] Test settings persistence
- [ ] Test cross-device sync

---

## Key Benefits

### Before Refactoring

**Problems:**
- 5 different contexts (`UnifiedContext`, `UnifiedPollingContext`, `SettingsContext`, `AuthContext`, `ToastContext`)
- Manual polling logic spread across multiple files
- Nested Context Providers causing re-render cascades
- Difficult to debug data flow
- Redundant API calls
- Complex state synchronization

**Example Component Usage (OLD):**
```typescript
const MyComponent = () => {
  const { employees, graphData, escalations, isLoading } = useUnified();
  const { displaySettings, updateDisplaySettings } = useSettings();
  
  // Multiple context dependencies
  // Hard to track where data comes from
  // Many unnecessary re-renders
};
```

### After Refactoring

**Solutions:**
- 2 contexts only (`AuthContext`, `ToastContext`) + Zustand + React Query
- Automatic polling via React Query
- Flat provider structure - minimal nesting
- Clear data flow - easy to debug
- Single API call per endpoint (cached)
- Simple state updates via Zustand

**Example Component Usage (NEW):**
```typescript
const MyComponent = () => {
  // Server state from React Query
  const { data, isLoading } = useDashboardData();
  const { employees, graphData, escalations } = data || {};
  
  // UI state from Zustand (only re-renders if displaySettings changes)
  const displaySettings = useUIStore(state => state.displaySettings);
  const updateDisplaySettings = useUIStore(state => state.updateDisplaySettings);
  
  // Clear separation: server data vs UI state
  // Optimized re-renders via selectors
  // Easy to understand and debug
};
```

---

## API Endpoints

### Consolidated Dashboard Endpoint

**Endpoint:** `GET /api/dashboard`

**Purpose:** Single endpoint that fetches all dashboard data in parallel

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [...],      // Birthday/anniversary data
    "graphData": {...},      // Chart data
    "escalations": [...],    // Current escalations
    "failures": []           // Any API failures
  },
  "cached": true,
  "fresh": true,
  "timestamp": "2025-01-08T12:00:00Z",
  "cacheAge": 15000
}
```

**Caching Strategy:**
- Fresh cache (< 60s): Serve immediately ✅
- Expired cache: Attempt fresh fetch
- Fetch fails + cache exists: Serve stale cache with warning ⚠️
- Fetch fails + no cache: Return error (first request only) ❌

**Key Feature:** Zero downtime - once cache is populated, users NEVER see missing data

---

## Component Integration

### How Components Access Data

#### 1. API Data (Server State)

Use React Query hooks:

```typescript
// Option A: Get all data
import { useDashboardData } from "@/hooks/useDashboardData";
const { data, isLoading, error } = useDashboardData();

// Option B: Get specific data
import { useEmployeesData } from "@/hooks/useDashboardData";
const { employees, isLoading } = useEmployeesData();

// Option C: Get graph data only
import { useGraphData } from "@/hooks/useDashboardData";
const { graphData, isLoading } = useGraphData();
```

#### 2. UI State (Local State)

Use Zustand store:

```typescript
import { useUIStore } from "@/stores/useUIStore";

// Selective subscription (optimal)
const currentSlide = useUIStore(state => state.currentSlideIndex);
const setSlide = useUIStore(state => state.setCurrentSlideIndex);

// Multiple selectors
const { displaySettings, isEditing } = useUIStore(
  state => ({
    displaySettings: state.displaySettings,
    isEditing: state.isEditing
  })
);

// Update state
const updateSettings = useUIStore(state => state.updateDisplaySettings);
updateSettings({ swiperEffect: "fade" });
```

#### 3. Authentication

Use AuthContext (unchanged):

```typescript
import { useAuth } from "@/contexts/AuthContext";
const { user, isAuthenticated, login, logout } = useAuth();
```

---

## Removed/Deprecated Files

### Removed Completely

1. **`UnifiedPollingContext.tsx`** ❌
   - **Why:** React Query handles polling automatically
   - **Replaced by:** `refetchInterval` in `useDashboardData`

### Deprecated (Kept for Backward Compatibility)

1. **`UnifiedContext.tsx`** ⚠️
   - **Status:** Deprecated, provides compatibility layer
   - **Why:** Functionality split between Zustand (UI state) and React Query (server state)
   - **Migration:** Components should use `useUIStore` + `useDashboardData` directly
   - **TODO:** Remove after all components migrated

2. **`SettingsContext.tsx`** ⚠️
   - **Status:** Deprecated, provides compatibility layer
   - **Why:** Merged into Zustand store
   - **Migration:** Use `useUIStore(state => state.displaySettings)`
   - **TODO:** Remove after all components migrated

3. **`services/api.ts`** ⚠️
   - **Status:** Deprecated, most functions are no-ops
   - **Why:** React Query handles all API polling
   - **Migration:** Use `backendApi` directly or React Query hooks
   - **TODO:** Clean up after migration

---

## Performance Optimizations

### 1. Reduced Re-renders

**Before:**
- Context changes trigger re-renders in ALL consumers
- Even if component only needs one piece of data
- Cascading re-renders through nested providers

**After:**
- Zustand selectors - only re-render if selected state changes
- React Query - automatic deduplication and caching
- No nested providers - flat structure

### 2. Better Caching

**Before:**
- Manual cache management in `services/api.ts`
- Hard to invalidate or update
- No automatic refetching
- No stale-while-revalidate

**After:**
- React Query automatic caching
- Smart refetching based on staleness
- Automatic invalidation
- Stale-while-revalidate built-in

### 3. Optimized API Calls

**Before:**
- Multiple components calling same API
- No deduplication
- Manual polling intervals
- Race conditions possible

**After:**
- Single query per endpoint (deduplication)
- Automatic polling via `refetchInterval`
- Request batching
- No race conditions

---

## Future Improvements

### Short Term (Next Sprint)

1. **Complete Migration**
   - Migrate all components to new architecture
   - Remove deprecated contexts
   - Clean up old service files

2. **Add Tests**
   - Unit tests for Zustand store
   - Integration tests for React Query hooks
   - E2E tests for critical flows

### Long Term (Future)

1. **WebSocket Integration** 🚀
   ```typescript
   // TODO: Replace React Query polling with WebSocket
   // Benefits:
   // - Instant updates (no 60s delay)
   // - Reduced server load (no polling)
   // - Better user experience
   ```

2. **Redis Caching** 💾
   ```typescript
   // TODO: Replace in-memory cache with Redis
   // Benefits:
   // - Distributed caching
   // - Persists across server restarts
   // - Better scalability
   ```

3. **Server-Sent Events (SSE)** 📡
   ```typescript
   // TODO: Consider SSE for one-way real-time updates
   // Simpler than WebSocket for dashboard data
   ```

---

## Developer Guide

### Adding a New Slide Type

1. **Define the type** in `/src/types/index.ts`
2. **Create the component** in `/src/components/slides/`
3. **Use the hooks** to access data:
   ```typescript
   const { employees } = useEmployeesData();
   const settings = useUIStore(state => state.displaySettings);
   ```
4. **Register in slide renderer** (e.g., `SwiperSlideshow.tsx`)

### Adding a New API Endpoint

1. **Add backend endpoint** in `/server/src/routes/`
2. **Add to dashboard aggregation** in `/server/src/routes/dashboard.ts`
3. **Create React Query hook** in `/src/hooks/`
4. **Use in components** via the new hook

### Modifying Display Settings

1. **Update Zustand store** action in `/src/stores/useUIStore.ts`
2. **Use in component**:
   ```typescript
   const updateSettings = useUIStore(state => state.updateDisplaySettings);
   updateSettings({ showDateStamp: true });
   ```
3. **Persistence** handled automatically by Zustand persist middleware

---

## Debugging

### React Query DevTools

Add React Query DevTools in development:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
</QueryClientProvider>
```

**Features:**
- View all queries and their state
- See cache status
- Manually trigger refetch
- Inspect errors

### Zustand DevTools

Zustand has built-in Redux DevTools support:

```typescript
import { devtools } from "zustand/middleware";

export const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        // store implementation
      }),
      { name: "ui-store" }
    ),
    { name: "UI Store" }
  )
);
```

### Logger Utility

Use the existing logger for consistent logging:

```typescript
import { logger } from "@/utils/logger";

logger.info("Data fetched successfully");
logger.error("Failed to fetch data", error);
logger.api("API request initiated");
logger.sync("Syncing to database");
```

---

## Backward Compatibility

### Compatibility Layer

Old components can still use deprecated contexts during migration:

```typescript
// OLD WAY (still works during migration)
const { employees } = useUnified();

// NEW WAY (preferred)
const { employees } = useEmployeesData();
```

The deprecated `UnifiedContext` provides a compatibility layer:

```typescript
// UnifiedContext.tsx (compatibility layer)
export const useUnified = () => {
  // Internally uses new hooks
  const { data } = useDashboardData();
  const slides = useUIStore(state => state.slides);
  
  return {
    employees: data?.employees || [],
    graphData: data?.graphData || null,
    escalations: data?.escalations || [],
    slides,
    // ... other state
  };
};
```

### Deprecation Warnings

Deprecated files include clear warnings:

```typescript
/**
 * @deprecated This context is deprecated and will be removed in v2.0.0
 * 
 * Migration guide:
 * - Replace `useUnified()` with `useDashboardData()` + `useUIStore()`
 * - Server data: `useDashboardData()` from "@/hooks/useDashboardData"
 * - UI state: `useUIStore()` from "@/stores/useUIStore"
 * 
 * See docs/architecture.md for full migration guide
 */
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test Zustand store
import { useUIStore } from "@/stores/useUIStore";

test("should update slide", () => {
  const { getState } = useUIStore;
  const slide = { id: "1", name: "Test" };
  
  getState().updateSlide(slide);
  
  expect(getState().slides.find(s => s.id === "1")).toEqual(slide);
});
```

### Integration Tests

```typescript
// Test React Query + Component
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData } from "@/hooks/useDashboardData";

test("should fetch dashboard data", async () => {
  const { result } = renderHook(() => useDashboardData());
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  expect(result.current.data.employees).toBeDefined();
});
```

---

## Common Patterns

### Pattern 1: Read-Only Data Display

```typescript
const GraphSlide = () => {
  // Just read server data
  const { graphData, isLoading } = useGraphData();
  
  if (isLoading) return <Loading />;
  
  return <Chart data={graphData} />;
};
```

### Pattern 2: User Settings

```typescript
const SettingsPanel = () => {
  // Read and update UI state
  const displaySettings = useUIStore(state => state.displaySettings);
  const updateSettings = useUIStore(state => state.updateDisplaySettings);
  
  return (
    <Toggle
      checked={displaySettings.showDateStamp}
      onChange={(checked) => updateSettings({ showDateStamp: checked })}
    />
  );
};
```

### Pattern 3: Slide Management

```typescript
const SlideEditor = () => {
  // Server data (read-only)
  const { employees } = useEmployeesData();
  
  // UI state (read-write)
  const slides = useUIStore(state => state.slides);
  const updateSlide = useUIStore(state => state.updateSlide);
  
  const handleSave = (slide) => {
    updateSlide(slide);
  };
};
```

---

## FAQ

### Q: Why Zustand instead of Context?

**A:** Zustand provides:
- Better performance (selective subscriptions)
- Simpler API (no Provider needed)
- Built-in persistence
- DevTools support
- TypeScript-friendly

### Q: Why React Query instead of manual polling?

**A:** React Query provides:
- Automatic caching
- Automatic refetching
- Background updates
- Error handling with retries
- Request deduplication
- Stale-while-revalidate

### Q: Can I still use the old hooks during migration?

**A:** Yes! Backward compatibility layer is maintained. Old hooks internally use new system.

### Q: How do I force a data refresh?

**A:** 
```typescript
const { refetch } = useDashboardData();
refetch(); // Manually trigger refetch
```

### Q: How do I know if data is stale?

**A:**
```typescript
const { data, isStale, isFetching } = useDashboardData();

if (isStale) {
  // Data is older than staleTime (30s)
}

if (isFetching) {
  // Currently fetching fresh data in background
}
```

---

## Summary

The refactored architecture provides:

✅ **Clearer Data Flow**: API → React Query → Components  
✅ **Better Performance**: Selective subscriptions, automatic caching  
✅ **Easier Debugging**: Fewer layers, clear state ownership  
✅ **Type Safety**: Full TypeScript support  
✅ **Future-Proof**: Easy to migrate to WebSocket/SSE  
✅ **Developer Experience**: Simple APIs, good DevTools  

---

**Last Updated:** January 8, 2025  
**Version:** 2.0.0  
**Status:** ✅ Architecture Defined, 🚧 Implementation In Progress

