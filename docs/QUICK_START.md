# Quick Start - New Architecture

## For New Developers

Welcome! This project has been refactored to use a modern, simplified architecture. Here's what you need to know:

---

## Architecture Overview

```
API Data (Server State)     UI State (Local State)      Auth & Notifications
        ↓                           ↓                           ↓
  React Query              Zustand Store             React Contexts
useDashboardData()         useUIStore()              useAuth(), useToast()
        ↓                           ↓                           ↓
    Components ← ← ← ← ← ← ← ← ← ← ← ←
```

---

## Getting Data in Components

### 1. Server Data (API Data)

Use **React Query hooks** for any data from the backend:

```typescript
import { useDashboardData } from "@/hooks/useDashboardData";

const MyComponent = () => {
  // Automatic polling, caching, and error handling
  const { data, isLoading, error, refetch } = useDashboardData();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  const { employees, graphData, escalations } = data;
  
  return <div>{/* Use the data */}</div>;
};
```

**Available hooks:**
- `useDashboardData()` - All dashboard data
- `useEmployeesData()` - Just employees
- `useGraphData()` - Just graph data
- `useEscalationsData()` - Just escalations

### 2. UI State (Slides, Settings, Edit Mode)

Use **Zustand** for UI-related state:

```typescript
import { useUIStore } from "@/stores/useUIStore";

const MyComponent = () => {
  // Selective subscription (only re-renders when slides change)
  const slides = useUIStore(state => state.slides);
  const updateSlide = useUIStore(state => state.updateSlide);
  
  // Get display settings
  const displaySettings = useUIStore(state => state.displaySettings);
  
  // Update settings
  const updateSettings = useUIStore(state => state.updateDisplaySettings);
  
  return <div>{/* Use slides and settings */}</div>;
};
```

**Convenience hooks available:**
- `useActiveSlides()` - Get only active slides
- `useDisplaySettings()` - Get display settings
- `useSlideActions()` - Get slide management functions
- `useDatabaseActions()` - Get database sync functions

### 3. Authentication

Use **AuthContext** (unchanged):

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) return <Login />;
  
  return <div>Welcome {user?.username}</div>;
};
```

### 4. Toast Notifications

Use **ToastContext** (unchanged):

```typescript
import { useToast } from "@/contexts/ToastContext";

const MyComponent = () => {
  const { addToast } = useToast();
  
  const handleSave = () => {
    addToast("Saved successfully!", "success");
  };
  
  return <button onClick={handleSave}>Save</button>;
};
```

---

## Common Tasks

### Task 1: Display API Data in a Slide

```typescript
import { useEscalationsData } from "@/hooks/useDashboardData";

export const EscalationsSlide = () => {
  const { escalations, isLoading } = useEscalationsData();
  
  if (isLoading) return <Loading />;
  
  return (
    <table>
      {escalations.map(item => (
        <tr key={item.id}>
          <td>{item.summary}</td>
        </tr>
      ))}
    </table>
  );
};
```

### Task 2: Update Display Settings

```typescript
import { useDisplaySettings, useDisplaySettingsActions } from "@/stores/useUIStore";

export const SettingsPanel = () => {
  const displaySettings = useDisplaySettings();
  const { updateDisplaySettings } = useDisplaySettingsActions();
  
  const handleToggle = async () => {
    await updateDisplaySettings({
      showDateStamp: !displaySettings.showDateStamp
    });
  };
  
  return (
    <button onClick={handleToggle}>
      Toggle Date Stamp
    </button>
  );
};
```

### Task 3: Manage Slides

```typescript
import { useUIStore, useSlideActions } from "@/stores/useUIStore";

export const SlideManager = () => {
  const slides = useUIStore(state => state.slides);
  const { updateSlide, deleteSlide } = useSlideActions();
  
  const handleActivate = (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (slide) {
      updateSlide({ ...slide, active: !slide.active });
      // Auto-saves to database!
    }
  };
  
  return (
    <div>
      {slides.map(slide => (
        <div key={slide.id}>
          <span>{slide.name}</span>
          <button onClick={() => handleActivate(slide.id)}>
            {slide.active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => deleteSlide(slide.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Task 4: Manual Data Refresh

```typescript
import { useDashboardData } from "@/hooks/useDashboardData";

export const RefreshButton = () => {
  const { refetch, isFetching } = useDashboardData();
  
  return (
    <button onClick={() => refetch()} disabled={isFetching}>
      {isFetching ? "Refreshing..." : "Refresh Data"}
    </button>
  );
};
```

---

## File Structure

```
client/src/
├── api/
│   └── backendApi.ts           # ✨ Centralized Axios instance
│
├── hooks/
│   ├── useDashboardData.ts     # 🔄 React Query hook (server data)
│   └── useInitializeApp.ts     # 🚀 App initialization hook
│
├── stores/
│   └── useUIStore.ts           # 💾 Zustand store (UI state)
│
├── contexts/
│   ├── AuthContext.tsx         # ✅ Authentication (keep)
│   ├── ToastContext.tsx        # ✅ Notifications (keep)
│   ├── UnifiedContext.tsx      # ⚠️ Deprecated (compat layer)
│   └── SettingsContext.tsx     # ⚠️ Deprecated (compat layer)
│
├── components/
│   └── [all components]        # Use hooks directly
│
└── pages/
    └── [all pages]             # Use hooks directly
```

---

## Do's and Don'ts

### ✅ Do This

```typescript
// Get server data
const { data } = useDashboardData();

// Get UI state with selective subscription
const slides = useUIStore(state => state.slides);

// Update UI state
const updateSlide = useUIStore(state => state.updateSlide);
updateSlide(mySlide); // Auto-saves!

// Use convenience hooks
const { employees } = useEmployeesData();
const displaySettings = useDisplaySettings();
```

### ❌ Don't Do This

```typescript
// Don't use deprecated contexts (will be removed in v2.0.0)
const { slides } = useUnified();  // ❌ Deprecated
const { displaySettings } = useSettings();  // ❌ Deprecated

// Don't use old API service
import { fetchEmployeesData } from "./services/api";  // ❌ Deprecated

// Don't subscribe to entire store (causes unnecessary re-renders)
const store = useUIStore();  // ❌ Re-renders on ANY state change
const slides = store.slides;  // ❌ Bad

// Do this instead:
const slides = useUIStore(state => state.slides);  // ✅ Good
```

---

## Debugging

### React Query DevTools

Add to App.tsx in development:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  {process.env.NODE_ENV === "development" && (
    <ReactQueryDevtools initialIsOpen={false} />
  )}
</QueryClientProvider>
```

**Features:**
- View all queries and their state
- See cache status and freshness
- Manually trigger refetch
- Inspect query errors

### Redux DevTools (for Zustand)

Zustand automatically connects to Redux DevTools in development mode. Open Redux DevTools in Chrome and you'll see the "UI Store" with all state updates.

### Logger Utility

Use the built-in logger for consistent logging:

```typescript
import { logger } from "@/utils/logger";

logger.info("Component mounted");
logger.error("Failed to save", error);
logger.api("Fetching data from API");
logger.sync("Syncing to database");
logger.success("Operation completed");
```

**Note:** Logging only appears in development mode (controlled by `displaySettings.developmentMode`).

---

## Common Patterns

### Pattern 1: Read-Only Data Display

For components that only display server data:

```typescript
const GraphSlide = () => {
  const { graphData, isLoading } = useGraphData();
  
  if (isLoading) return <Loading />;
  
  return <Chart data={graphData} />;
};
```

### Pattern 2: User Input with Settings

For components that read and update settings:

```typescript
const SettingsPanel = () => {
  const settings = useDisplaySettings();
  const { updateDisplaySettings } = useDisplaySettingsActions();
  
  return (
    <Toggle
      checked={settings.showDateStamp}
      onChange={(checked) => updateDisplaySettings({ showDateStamp: checked })}
    />
  );
};
```

### Pattern 3: Slide Management

For components that manage slides:

```typescript
const SlideEditor = () => {
  // Server data (read-only)
  const { employees } = useEmployeesData();
  
  // UI state (read-write)
  const slides = useUIStore(state => state.slides);
  const { updateSlide, deleteSlide } = useSlideActions();
  
  const handleUpdate = (slide: Slide) => {
    updateSlide(slide); // Auto-saves to database
  };
  
  return <Editor slides={slides} onUpdate={handleUpdate} />;
};
```

---

## Performance Tips

### 1. Use Selective Subscriptions

```typescript
// BAD - Re-renders when ANY store state changes
const store = useUIStore();
const slides = store.slides;

// GOOD - Only re-renders when slides change
const slides = useUIStore(state => state.slides);
```

### 2. Use Convenience Hooks

```typescript
// Instead of:
const employees = useUIStore(state => state.employees);
const graphData = useUIStore(state => state.graphData);

// Use:
const { employees } = useEmployeesData();
const { graphData } = useGraphData();
```

### 3. Avoid Unnecessary Refetches

```typescript
// React Query automatically refetches every 60 seconds
// Don't manually refetch unless user explicitly requests it

const { refetch } = useDashboardData();

// Only call refetch() on user action (button click, etc.)
<button onClick={() => refetch()}>Refresh</button>
```

---

## FAQ

**Q: Where did UnifiedContext go?**  
A: Split into Zustand (UI state) + React Query (server data). Use `useUIStore()` and `useDashboardData()` instead.

**Q: How do I force a data refresh?**  
A: `const { refetch } = useDashboardData(); refetch();`

**Q: How do I know if data is loading?**  
A: `const { isLoading, isFetching } = useDashboardData();`

**Q: How do I update a slide?**  
A: `const updateSlide = useUIStore(state => state.updateSlide); updateSlide(mySlide);`

**Q: Does updateSlide auto-save to database?**  
A: Yes! Auto-saves after 1 second debounce.

**Q: Why am I getting "useUnified is deprecated" warnings?**  
A: Migrate to new hooks. See `docs/MIGRATION_GUIDE.md` for instructions.

---

## Next Steps

1. **Read** `docs/architecture.md` for full architecture details
2. **Review** `docs/MIGRATION_GUIDE.md` if migrating old code
3. **Check** `docs/REFACTORING_SUMMARY.md` for what changed
4. **Start coding** using the patterns above!

---

**Happy Coding!** 🚀

If you have questions, check the docs or ask a senior developer.

---

**Version:** v1.9.0  
**Last Updated:** January 8, 2025  
**Status:** ✅ Ready for Development

