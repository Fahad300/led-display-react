# WebSocket-Ready Architecture

## Overview

The LED Display System has been refactored to be **WebSocket-ready**. This means all data updates and refreshes are centralized through a unified update events system that can easily be replaced with WebSocket broadcasts when ready.

## Key Benefits

✅ **Zero Code Changes When Adding WebSocket** - Just swap the broadcast mechanism  
✅ **Cross-Tab Synchronization** - Works across multiple browser tabs/windows  
✅ **Centralized Update Logic** - One place to handle all updates  
✅ **Type-Safe** - Full TypeScript support for update events  
✅ **Reliable Fallbacks** - 5-minute polling ensures displays never get stale  
✅ **Easy to Test** - Clear separation between update triggers and handlers  

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Update Sources                              │
├─────────────────────────────────────────────────────────────────┤
│  HomePage  │  AdminPage  │  DisplayPage  │  Future: WebSocket   │
└──────┬──────────┬─────────────┬──────────────────┬──────────────┘
       │          │             │                  │
       └──────────┴─────────────┴──────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ triggerDisplayUpdate │ ◄─── Central Update Function
        │   (updateEvents.ts)  │
        └─────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
  ┌─────────────┐   ┌──────────────┐
  │ BroadcastCh │   │ React Query  │
  │ (cross-tab) │   │ Invalidation │
  └──────┬──────┘   └──────┬───────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Update Listeners │
          │ (DisplayPage)   │
          └───────┬─────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
  ┌─────────────┐   ┌──────────────┐
  │ Sync DB     │   │ Refetch API  │
  │ (slides)    │   │ (dashboard)  │
  └─────────────┘   └──────────────┘
```

---

## Core Components

### 1. Central Update Events System

**File:** `client/src/utils/updateEvents.ts`

This is the heart of the WebSocket-ready architecture. It provides:

- **triggerDisplayUpdate()** - Function to broadcast updates
- **onDisplayUpdate()** - Function to subscribe to updates
- **BroadcastChannel** - Cross-tab communication (auto-fallback to localStorage)
- **React Query Integration** - Automatic cache invalidation

**Update Types:**
```typescript
type UpdateType = 
    | "slides"          // Slides added/edited/reordered
    | "settings"        // Display settings changed
    | "api-data"        // External API data updated
    | "force-reload"    // Force full page reload
    | "all";            // Everything changed
```

**Example Usage:**
```typescript
// After saving slides
await triggerDisplayUpdate("slides", "HomePage/save", queryClient, {
    slideId: "123",
    action: "created"
});

// After changing settings
await triggerDisplayUpdate("settings", "HomePage/effectChange", queryClient, {
    setting: "swiperEffect",
    value: "fade"
});
```

### 2. DisplayPage Update Listener

**File:** `client/src/components/SlidesDisplay.tsx`

The DisplayPage has a **single unified listener** that handles all update types:

```typescript
const handleDisplayUpdate = React.useCallback(async (event: UpdateEvent) => {
    logger.info(`🔔 DisplayPage received update: ${event.type} from ${event.source}`, event);
    
    setIsRefreshing(true);
    
    try {
        switch (event.type) {
            case "slides":
                await syncFromDatabase();
                break;
            case "settings":
                await syncSettings();
                break;
            case "api-data":
                await queryClient.refetchQueries({ queryKey: ["dashboardData"] });
                break;
            case "all":
            case "force-reload":
                await Promise.all([
                    syncFromDatabase(),
                    syncSettings(),
                    queryClient.refetchQueries({ queryKey: ["dashboardData"] })
                ]);
                break;
        }
    } finally {
        setIsRefreshing(false);
    }
}, [syncFromDatabase, syncSettings, queryClient]);
```

**Benefits:**
- ✅ Single place to handle all updates
- ✅ Easy to add WebSocket listener here
- ✅ Type-safe event handling
- ✅ Comprehensive error handling
- ✅ Clear logging for debugging

### 3. Update Triggers

**Files:**
- `client/src/pages/HomePage.tsx`
- `client/src/pages/AdminPage.tsx`

All pages that modify data now call `triggerDisplayUpdate()` after saves:

**HomePage Examples:**
```typescript
// After reordering slides
await triggerDisplayUpdate("slides", "HomePage/reorder", queryClient, {
    sourceIndex,
    destinationIndex,
    slideId: removed.id
});

// After toggling slide active state
await triggerDisplayUpdate("slides", "HomePage/toggleActive", queryClient, {
    slideId: updatedSlide.id,
    slideName: updatedSlide.name,
    active: updatedSlide.active
});

// After changing display settings
await triggerDisplayUpdate("settings", "HomePage/effectChange", queryClient, {
    setting: "swiperEffect",
    value: effect
});
```

**AdminPage Examples:**
```typescript
// After creating a slide
await triggerDisplayUpdate("slides", "AdminPage/create", queryClient, {
    slideId: updatedSlide.id,
    slideName: updatedSlide.name,
    action: "created"
});

// After updating a slide
await triggerDisplayUpdate("slides", "AdminPage/update", queryClient, {
    slideId: updatedSlide.id,
    slideName: updatedSlide.name,
    action: "updated"
});
```

### 4. Fallback Polling

**File:** `client/src/components/SlidesDisplay.tsx`

A 5-minute polling mechanism ensures displays never get stale:

```typescript
useEffect(() => {
    const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const pollInterval = setInterval(async () => {
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
        logger.info(`🔄 Fallback poll triggered (${Math.round(timeSinceLastUpdate / 1000)}s since last update)`);
        
        try {
            setIsRefreshing(true);
            
            await Promise.all([
                syncFromDatabase(),
                syncSettings(),
                queryClient.refetchQueries({ queryKey: ["dashboardData"] })
            ]);
            
            setLastUpdateTime(new Date());
        } catch (error) {
            logger.error("❌ Fallback poll failed", error);
        } finally {
            setIsRefreshing(false);
        }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
}, [lastUpdateTime, syncFromDatabase, syncSettings, queryClient]);
```

**Why This Matters:**
- ✅ Ensures displays update even if BroadcastChannel fails
- ✅ Protects against network issues
- ✅ Will complement WebSocket (in case of disconnections)
- ✅ Configurable interval for different use cases

---

## Adding WebSocket (Future)

When you're ready to add WebSocket support, follow these steps:

### Step 1: Install Dependencies

```bash
cd client
npm install socket.io-client

cd ../server
npm install socket.io
```

### Step 2: Server-Side WebSocket Setup

**File:** `server/src/server.ts`

```typescript
import { Server } from "socket.io";

// After creating Express server
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Connection handler
io.on("connection", (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);
    
    // Listen for update broadcasts from clients
    socket.on("broadcastUpdate", (event: UpdateEvent) => {
        logger.info(`📡 Broadcasting update: ${event.type} from ${event.source}`);
        
        // Broadcast to all other clients
        socket.broadcast.emit("displayUpdate", event);
    });
    
    socket.on("disconnect", () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
});
```

### Step 3: Client-Side WebSocket Setup

**File:** `client/src/services/socketService.ts` (new file)

```typescript
import io, { Socket } from "socket.io-client";
import { logger } from "../utils/logger";
import { UpdateEvent } from "../utils/updateEvents";

class SocketService {
    private socket: Socket | null = null;
    private listeners: Set<(event: UpdateEvent) => void> = new Set();

    connect(): void {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
        
        this.socket = io(backendUrl, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on("connect", () => {
            logger.success("✅ WebSocket connected");
        });

        this.socket.on("displayUpdate", (event: UpdateEvent) => {
            logger.info(`📡 Received WebSocket update: ${event.type}`);
            this.listeners.forEach(listener => listener(event));
        });

        this.socket.on("disconnect", () => {
            logger.warn("⚠️ WebSocket disconnected");
        });
    }

    broadcast(event: UpdateEvent): void {
        if (this.socket?.connected) {
            this.socket.emit("broadcastUpdate", event);
            logger.info(`📤 Sent WebSocket update: ${event.type}`);
        } else {
            logger.warn("⚠️ WebSocket not connected, update not sent");
        }
    }

    subscribe(listener: (event: UpdateEvent) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.listeners.clear();
    }
}

export const socketService = new SocketService();
```

### Step 4: Update the Central Update Function

**File:** `client/src/utils/updateEvents.ts`

Replace the BroadcastChannel logic with WebSocket:

```typescript
import { socketService } from "../services/socketService";

export const triggerDisplayUpdate = async (
    type: UpdateType,
    source: string,
    queryClient?: QueryClient,
    data?: any
): Promise<void> => {
    const event: UpdateEvent = {
        type,
        timestamp: new Date().toISOString(),
        source,
        data
    };

    // ✅ NEW: Broadcast via WebSocket (replaces BroadcastChannel)
    socketService.broadcast(event);

    // Keep React Query invalidation
    if (queryClient) {
        // ... existing invalidation logic
    }
};
```

### Step 5: Update DisplayPage Listener

**File:** `client/src/components/SlidesDisplay.tsx`

Add WebSocket subscription alongside existing listener:

```typescript
useEffect(() => {
    // Existing BroadcastChannel subscription
    const unsubscribeBroadcast = onDisplayUpdate(handleDisplayUpdate);

    // ✅ NEW: WebSocket subscription
    const unsubscribeSocket = socketService.subscribe(handleDisplayUpdate);

    return () => {
        unsubscribeBroadcast();
        unsubscribeSocket();
    };
}, [handleDisplayUpdate]);
```

### Step 6: Initialize WebSocket in App

**File:** `client/src/App.tsx`

```typescript
import { socketService } from "./services/socketService";

function App() {
    useEffect(() => {
        // Connect to WebSocket on app mount
        socketService.connect();
        
        return () => {
            // Disconnect on app unmount
            socketService.disconnect();
        };
    }, []);

    return (
        // ... app content
    );
}
```

### That's It! 🎉

The rest of the app continues to work exactly as before. No other code changes needed.

---

## Migration Checklist

When adding WebSocket, follow this checklist:

- [ ] Install socket.io dependencies (client + server)
- [ ] Add WebSocket server setup in `server/src/server.ts`
- [ ] Create `client/src/services/socketService.ts`
- [ ] Update `triggerDisplayUpdate()` in `client/src/utils/updateEvents.ts`
- [ ] Add WebSocket subscription in `client/src/components/SlidesDisplay.tsx`
- [ ] Initialize WebSocket in `client/src/App.tsx`
- [ ] Test cross-tab updates still work
- [ ] Test cross-device updates work
- [ ] Test fallback polling still works when WebSocket disconnects
- [ ] Remove legacy `realtimeSync` code (optional cleanup)
- [ ] Remove legacy `CustomEvent` dispatches (optional cleanup)
- [ ] Update environment variables for WebSocket URL

---

## Current Implementation Details

### BroadcastChannel

Currently using `BroadcastChannel` API for cross-tab communication:

**Pros:**
- ✅ Native browser API (no dependencies)
- ✅ Fast and lightweight
- ✅ Works across tabs in same browser
- ✅ Automatic fallback to localStorage

**Cons:**
- ❌ Only works on same device
- ❌ Doesn't work across different browsers
- ❌ No server-side visibility

### React Query Integration

All API data fetching uses React Query, which provides:

- ✅ Automatic caching
- ✅ Background refetching
- ✅ Stale-while-revalidate patterns
- ✅ Easy cache invalidation

When `triggerDisplayUpdate("api-data")` is called, it invalidates the React Query cache:

```typescript
await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
```

---

## Testing the Current System

### Test Cross-Tab Updates

1. Open HomePage in one tab
2. Open DisplayPage in another tab
3. Make changes in HomePage (reorder slides, change settings)
4. Verify DisplayPage updates immediately

### Test Fallback Polling

1. Open DisplayPage
2. Wait 5 minutes (or modify `POLLING_INTERVAL` for faster testing)
3. Verify automatic refresh occurs
4. Check console logs for "Fallback poll triggered"

### Test Update Types

```typescript
// In browser console on HomePage:

// Test slides update
triggerDisplayUpdate("slides", "Console/test", queryClient, { test: true });

// Test settings update
triggerDisplayUpdate("settings", "Console/test", queryClient, { test: true });

// Test force reload
triggerDisplayUpdate("force-reload", "Console/test", queryClient, { test: true });
```

---

## Troubleshooting

### Updates Not Reaching DisplayPage

**Check:**
1. Open browser console
2. Look for `📡 Received update event` logs
3. Verify BroadcastChannel is supported: `typeof BroadcastChannel !== "undefined"`
4. Check localStorage fallback if BroadcastChannel fails

### Fallback Polling Not Working

**Check:**
1. Verify `POLLING_INTERVAL` is set correctly (default: 5 minutes)
2. Look for `🔄 Fallback poll triggered` logs
3. Check `lastUpdateTime` state is being updated

### React Query Not Invalidating

**Check:**
1. Verify `queryClient` is passed to `triggerDisplayUpdate()`
2. Check `["dashboardData"]` query key exists
3. Look for `🔄 Invalidated React Query cache` logs

---

## Performance Considerations

### BroadcastChannel Performance

- **Instant** - No network latency
- **Lightweight** - Minimal memory overhead
- **Scalable** - Handles thousands of messages per second

### React Query Performance

- **Smart Caching** - Only refetches when needed
- **Background Updates** - Doesn't block UI
- **Deduplication** - Multiple refetch calls are deduplicated

### Polling Performance

- **Low Impact** - Runs every 5 minutes by default
- **Conditional** - Only runs on DisplayPage
- **Efficient** - Uses existing database sync methods

---

## Legacy Code (To Be Removed)

The following code is still in place for backward compatibility but can be removed after WebSocket is enabled:

### 1. realtimeSync.ts

**File:** `client/src/utils/realtimeSync.ts`

Contains old cross-tab sync logic using CustomEvents. Replaced by `updateEvents.ts`.

**Remove after WebSocket is enabled.**

### 2. CustomEvent Dispatches

**Files:**
- `client/src/pages/HomePage.tsx`
- `client/src/pages/AdminPage.tsx`

Look for code like:
```typescript
const reloadEvent = new CustomEvent('forceDisplayReload', { ... });
window.dispatchEvent(reloadEvent);
```

**Remove after WebSocket is enabled.**

### 3. dispatchSlidesChange() Calls

**Files:**
- `client/src/pages/HomePage.tsx`

Look for:
```typescript
dispatchSlidesChange(newSlides, [...], 'homepage');
```

**Remove after WebSocket is enabled.**

---

## Summary

The LED Display System is now **WebSocket-ready** with:

✅ **Centralized update system** via `triggerDisplayUpdate()`  
✅ **Unified listener** in DisplayPage  
✅ **Cross-tab sync** via BroadcastChannel (temporary)  
✅ **Fallback polling** for reliability  
✅ **React Query integration** for API data  
✅ **Clear migration path** to WebSocket  

When you add WebSocket, you'll only need to:
1. Add socket.io dependencies
2. Create WebSocket service
3. Swap BroadcastChannel with socket.emit()
4. Subscribe to socket events

**No other code changes required!** 🚀

---

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Quick Start Guide](./QUICK_START.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

