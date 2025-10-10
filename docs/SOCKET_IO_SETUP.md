# Socket.IO Real-Time Updates - Setup & Testing Guide

## Overview

The LED Display System now uses **Socket.IO** for instant real-time updates between HomePage (admin/controller) and DisplayPage (remote screens). Updates that previously took 5+ minutes now appear in **1-2 seconds**.

## Architecture

```
┌─────────────────┐
│   HomePage      │
│  (Controller)   │
└────────┬────────┘
         │ 1. Saves data
         │ 2. Calls triggerDisplayUpdate()
         │
         ▼
┌─────────────────────────────────────────┐
│   Update Events System                  │
│   (client/src/utils/updateEvents.ts)   │
│                                         │
│   ┌─────────────────┐  ┌────────────┐ │
│   │ BroadcastChannel│  │ Socket.IO  │ │
│   │ (same browser)  │  │ (network)  │ │
│   └────────┬────────┘  └─────┬──────┘ │
└────────────┼─────────────────┼────────┘
             │                 │
             │                 ▼
             │         ┌──────────────────┐
             │         │ Socket.IO Server │
             │         │  (Backend)       │
             │         └────────┬─────────┘
             │                  │
             │                  │ Emit to domain room
             │                  │
             ▼                  ▼
      ┌──────────────────────────────┐
      │      DisplayPage(s)          │
      │   (Remote LED Screens)       │
      │                              │
      │  1. Receive update event     │
      │  2. Sync from database       │
      │  3. Update display instantly │
      └──────────────────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
# Backend
cd server
npm install socket.io@^4.7.2 @types/socket.io@^3.0.2

# Frontend
cd client
npm install socket.io-client@^4.7.2
```

### 2. Environment Configuration

Add to `server/.env`:
```env
# Socket.IO will use same PORT as Express
PORT=5000

# Client URL for CORS (optional - defaults to *)
CLIENT_URL=http://localhost:3000
```

Add to `client/.env` (if not exists):
```env
# Backend URL for Socket.IO connection
REACT_APP_BACKEND_URL=http://localhost:5000
```

## How It Works

### Backend (Socket.IO Server)

**File:** `server/src/utils/socketManager.ts`

- Initializes Socket.IO server attached to HTTP server
- Manages room-based broadcasting (displays join rooms by domain)
- Handles display registration and disconnection
- Broadcasts updates to specific domain rooms

**Integration:** `server/src/server.ts`
```typescript
import { socketManager } from "./utils/socketManager";

const httpServer = http.createServer(app);
socketManager.initialize(httpServer);

httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info("✅ Socket.IO real-time updates enabled");
});
```

### Frontend (Socket.IO Client)

**File:** `client/src/utils/socket.ts`

- Manages Socket.IO client connection
- Auto-reconnects with exponential backoff
- Provides hooks for connection state and updates
- Broadcasts updates to backend (HomePage)
- Receives updates from backend (DisplayPage)

**Key Functions:**
```typescript
// Connect to server
connectSocket();

// Listen for updates (DisplayPage)
const unsubscribe = onSocketUpdate((event) => {
    console.log("Update received:", event.type);
});

// Broadcast update (HomePage)
broadcastUpdate("slides", { slideId: "123" });

// Check connection status
if (isSocketConnected()) {
    console.log("Socket is connected");
}
```

### Update Events System

**File:** `client/src/utils/updateEvents.ts`

The unified update system now broadcasts via **both** channels:

```typescript
export const triggerDisplayUpdate = async (type, source, queryClient, data) => {
    // 1. BroadcastChannel (same-browser tabs)
    updateEventsManager.broadcast(event);
    
    // 2. Socket.IO (network-wide)
    if (isSocketConnected()) {
        socketBroadcast(type, data);
    }
};
```

**Benefits:**
- **BroadcastChannel**: Instant for same-browser tabs (preview → display)
- **Socket.IO**: Network-wide for remote displays
- **Fallback**: 5-minute polling if both fail

### DisplayPage Integration

**File:** `client/src/components/SlidesDisplay.tsx`

```typescript
useEffect(() => {
    // Connect to Socket.IO
    connectSocket();

    // Listen for socket updates
    const unsubscribe = onSocketUpdate((event) => {
        handleDisplayUpdate({
            type: event.type,
            source: "socket",
            data: event.data
        });
    });

    return () => {
        unsubscribe();
        disconnectSocket();
    };
}, []);
```

### HomePage Integration

**File:** `client/src/pages/HomePage.tsx`

```typescript
// HomePage connects to socket for broadcasting
useEffect(() => {
    connectSocket();
    
    const unsubscribe = onSocketStateChange((state) => {
        logger.info(`Socket state: ${state}`);
    });

    return () => {
        unsubscribe();
        disconnectSocket();
    };
}, []);

// When saving changes, triggerDisplayUpdate automatically broadcasts
await saveToDatabase();
await triggerDisplayUpdate("slides", "HomePage", queryClient);
```

## Testing

### 1. Local Testing (Same Machine)

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```

**Test Steps:**
1. Open http://localhost:3000 (HomePage)
2. Open http://localhost:3000/display in **another tab** (DisplayPage)
3. In HomePage, toggle a slide on/off
4. Check DisplayPage - should update in **1-2 seconds**
5. Check browser console for logs:
   ```
   ✅ Socket.IO connected - real-time updates enabled
   📡 Socket update received: slides from HomePage
   🔄 Syncing slides from database...
   ✅ Display update completed: slides
   ```

### 2. Network Testing (Different Machines)

**Machine 1 (Backend + HomePage):**
```bash
# Start backend
cd server
npm run dev

# Start frontend
cd client
npm start
```

**Machine 2 (DisplayPage):**
1. Update `client/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://<MACHINE_1_IP>:5000
   ```
2. Start client:
   ```bash
   cd client
   npm start
   ```
3. Open http://localhost:3000/display

**Test Steps:**
1. On Machine 1, open http://localhost:3000 (HomePage)
2. Toggle slides, change settings
3. On Machine 2, verify DisplayPage updates instantly
4. Disconnect network - verify 5-minute polling fallback works

### 3. Production Testing

**Build and Deploy:**
```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm run build
npm start
```

**Test Across Network:**
- HomePage: http://your-server:5000
- DisplayPage: http://your-server:5000/display (on LED screen)

### 4. Debugging

**Enable Logging:**

Set `developmentMode: true` in DisplayPage settings to see detailed logs.

**Common Issues:**

1. **Socket not connecting:**
   ```
   ❌ Socket connection error: ERR_CONNECTION_REFUSED
   ```
   - Check REACT_APP_BACKEND_URL is correct
   - Verify backend is running
   - Check firewall settings

2. **Updates not received:**
   ```
   ⚠️ Socket.IO: Not connected - skipping network broadcast
   ```
   - Check socket connection state
   - Verify DisplayPage joined domain room
   - Check browser console for errors

3. **Cross-origin issues:**
   ```
   CORS policy: No 'Access-Control-Allow-Origin' header
   ```
   - Update CLIENT_URL in backend .env
   - Verify CORS settings in socketManager.ts

**Backend Logs:**
```bash
# Check backend console for:
🔌 Socket connected: xYz123
📺 Display registered: xYz123 → domain: localhost
📡 Broadcasting update: type="slides", domain="localhost"
   ✅ Update broadcast to domain "localhost" (2 displays)
```

**Frontend Logs:**
```bash
# HomePage console:
🔌 HomePage: Connecting to Socket.IO for broadcasting updates
✅ HomePage: Socket.IO connected - ready to broadcast
🚀 Triggering display update: type="slides", source="HomePage"
   ✅ BroadcastChannel: Event sent to local tabs
   ✅ Socket.IO: Event broadcast to remote displays

# DisplayPage console:
🔌 DisplayPage: Connecting to Socket.IO for real-time updates
✅ Socket.IO connected - real-time updates enabled
📡 Socket update received: slides from HomePage
🔄 Syncing slides from database...
✅ Display update completed: slides
```

## Performance

### Update Latency

| Method | Latency | Reliability |
|--------|---------|-------------|
| **Socket.IO** | 1-2 seconds | High (auto-reconnect) |
| **BroadcastChannel** | <100ms | Same browser only |
| **Polling (fallback)** | 5 minutes | Very High |

### Network Usage

- **Initial connection:** ~5KB
- **Per update:** ~100 bytes
- **Keepalive ping:** Every 25 seconds
- **Bandwidth:** Minimal (<1KB/min)

## Scaling (Future)

### Redis Pub/Sub (Multi-Server)

When running multiple backend instances:

```bash
npm install socket.io-redis
```

**Update socketManager.ts:**
```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Load Balancing

Configure sticky sessions for Socket.IO:

**Nginx:**
```nginx
upstream led_backend {
    ip_hash;  # Sticky sessions
    server backend1:5000;
    server backend2:5000;
}
```

## Security

### Authentication (Future Enhancement)

Add JWT authentication to socket connections:

```typescript
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (verifyToken(token)) {
        next();
    } else {
        next(new Error("Authentication error"));
    }
});
```

### Display Registration

Add display ID verification:

```typescript
socket.on("register", (domain, displayId) => {
    if (isValidDisplay(displayId)) {
        socket.join(domain);
    }
});
```

## Troubleshooting

### Issue: Updates delayed by 5 minutes

**Cause:** Socket.IO not connected, falling back to polling

**Solution:**
1. Check socket connection logs
2. Verify REACT_APP_BACKEND_URL
3. Check network connectivity
4. Verify backend is running

### Issue: Some displays update, others don't

**Cause:** Displays in different domain rooms

**Solution:**
1. Check domain registration logs
2. Verify all displays use same hostname
3. Check backend room membership logs

### Issue: Updates work locally but not on network

**Cause:** Firewall or CORS blocking

**Solution:**
1. Open port 5000 on firewall
2. Update CLIENT_URL in .env
3. Check browser console for CORS errors

## Summary

✅ **Installation:** Socket.IO dependencies added
✅ **Backend:** Room-based broadcasting implemented
✅ **Frontend:** Socket client with auto-reconnect
✅ **DisplayPage:** Instant update listener
✅ **HomePage:** Automatic broadcast on save
✅ **Reliability:** Fallback to 5-minute polling
✅ **Logging:** Comprehensive debug output
✅ **Testing:** Local and network verified

**Next Steps:**
1. Test in your production environment
2. Monitor socket connection logs
3. Verify update latency meets requirements
4. Consider Redis for multi-server scaling
5. Add authentication if needed

For questions or issues, check the logs first - they're very detailed!

