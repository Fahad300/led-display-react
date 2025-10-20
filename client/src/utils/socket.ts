/**
 * Socket.IO Client for Real-Time Display Updates
 * 
 * Provides WebSocket connection management for instant push notifications
 * between HomePage (admin) and DisplayPage (remote screens).
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Room-based updates (domain-specific)
 * - Connection state management
 * - Fallback to polling if WebSocket fails
 */

import { io, Socket } from "socket.io-client";
import { logger } from "./logger";

/**
 * Update event types
 */
export type UpdateType =
    | "slides"          // Slide changes
    | "settings"        // Display settings changed
    | "api-data"        // External API data refreshed
    | "force-reload"    // Force full page reload
    | "all";            // Everything changed

/**
 * Update event payload
 */
export interface UpdateEvent {
    type: UpdateType;
    timestamp: number;
    source?: string;
    data?: any;
}

/**
 * Connection state
 */
export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

/**
 * Socket Manager Class
 */
class SocketManager {
    private socket: Socket | null = null;
    private domain: string = "";
    private connectionState: ConnectionState = "disconnected";
    private updateListeners: Set<(event: UpdateEvent) => void> = new Set();
    private stateListeners: Set<(state: ConnectionState) => void> = new Set();
    private autoReconnect: boolean = true;

    /**
     * Get backend WebSocket URL
     */
    private getSocketUrl(): string {
        // Use environment variable or default to localhost
        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
        return backendUrl;
    }

    /**
     * Get current domain/hostname for room joining
     */
    private getDomain(): string {
        // Use hostname as domain identifier
        return window.location.hostname || "localhost";
    }

    /**
     * Initialize socket connection
     */
    public connect(): void {
        if (this.socket && this.socket.connected) {
            logger.info("Socket already connected");
            return;
        }

        this.domain = this.getDomain();
        this.setConnectionState("connecting");

        const socketUrl = this.getSocketUrl();
        logger.info(`🔌 Connecting to Socket.IO server: ${socketUrl}`);
        logger.info(`   Domain: ${this.domain}`);

        // Create socket connection with 24/7 reliability settings
        this.socket = io(socketUrl, {
            transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,       // Keep trying forever for 24/7 operation
            timeout: 20000,
            // CRITICAL: Force reconnection if connection drops
            autoConnect: true,
            // ADDED: Keep-alive settings for 24/7 operation
            forceNew: false,                      // Reuse connection when possible
        });

        // Set up event handlers
        this.setupEventHandlers();
    }

    /**
     * Set up socket event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        // Connection successful
        this.socket.on("connect", () => {
            logger.success(`✅ Socket connected: ${this.socket?.id}`);
            this.setConnectionState("connected");

            // Register with domain room
            this.registerDisplay();
        });

        // Registration confirmed
        this.socket.on("registered", (data: { domain: string; timestamp: number; message: string }) => {
            logger.success(`📺 Display registered to domain "${data.domain}"`);
            logger.info(`   ${data.message}`);
        });

        // Receive update from server
        this.socket.on("update", (event: UpdateEvent) => {
            logger.info(`📡 Update received: type="${event.type}", source="${event.source}"`);
            this.notifyUpdateListeners(event);
        });

        // Reconnection attempt
        this.socket.on("reconnect_attempt", (attemptNumber: number) => {
            logger.info(`🔄 Reconnecting... (attempt ${attemptNumber})`);
            this.setConnectionState("reconnecting");
        });

        // Reconnection successful
        this.socket.on("reconnect", (attemptNumber: number) => {
            logger.success(`✅ Reconnected after ${attemptNumber} attempts`);
            this.setConnectionState("connected");
            this.registerDisplay();
        });

        // Reconnection failed
        this.socket.on("reconnect_failed", () => {
            logger.error("❌ Reconnection failed - max attempts reached");
            this.setConnectionState("error");
        });

        // Disconnection
        this.socket.on("disconnect", (reason: string) => {
            logger.warn(`🔌 Socket disconnected: ${reason}`);
            this.setConnectionState("disconnected");

            // Automatic reconnection for certain reasons
            if (reason === "io server disconnect") {
                // Server initiated disconnect - try to reconnect
                logger.info("   Server disconnected - attempting reconnect...");
                this.socket?.connect();
            }
        });

        // Connection error
        this.socket.on("connect_error", (error: Error) => {
            logger.error(`❌ Socket connection error: ${error.message}`);
            this.setConnectionState("error");
        });

        // General error
        this.socket.on("error", (error: Error) => {
            logger.error(`❌ Socket error: ${error.message}`);
        });
    }

    /**
     * Register display with domain room
     */
    private registerDisplay(): void {
        if (!this.socket || !this.socket.connected) {
            logger.warn("Cannot register: socket not connected");
            return;
        }

        logger.info(`📺 Registering display with domain: ${this.domain}`);
        this.socket.emit("register", this.domain);
    }

    /**
     * Broadcast update to all displays in domain
     * (Called from HomePage)
     */
    public broadcastUpdate(type: UpdateType, data?: any): void {
        if (!this.socket || !this.socket.connected) {
            logger.warn("Cannot broadcast: socket not connected");
            return;
        }

        const event: UpdateEvent = {
            type,
            timestamp: Date.now(),
            source: "HomePage",
            data
        };

        logger.info(`📡 Broadcasting update: type="${type}", domain="${this.domain}"`);

        this.socket.emit("broadcastUpdate", {
            ...event,
            domain: this.domain
        });
    }

    /**
     * Subscribe to update events
     */
    public onUpdate(listener: (event: UpdateEvent) => void): () => void {
        this.updateListeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.updateListeners.delete(listener);
        };
    }

    /**
     * Subscribe to connection state changes
     */
    public onStateChange(listener: (state: ConnectionState) => void): () => void {
        this.stateListeners.add(listener);

        // Immediately notify current state
        listener(this.connectionState);

        // Return unsubscribe function
        return () => {
            this.stateListeners.delete(listener);
        };
    }

    /**
     * Notify all update listeners
     */
    private notifyUpdateListeners(event: UpdateEvent): void {
        this.updateListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                logger.error("Error in update listener:", error);
            }
        });
    }

    /**
     * Set connection state and notify listeners
     */
    private setConnectionState(state: ConnectionState): void {
        this.connectionState = state;
        this.stateListeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                logger.error("Error in state listener:", error);
            }
        });
    }

    /**
     * Get current connection state
     */
    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Check if socket is connected
     */
    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Disconnect socket
     */
    public disconnect(): void {
        if (this.socket) {
            logger.info("🔌 Disconnecting socket...");
            this.autoReconnect = false;
            this.socket.disconnect();
            this.socket = null;
            this.setConnectionState("disconnected");
        }
    }

    /**
     * Cleanup all listeners
     */
    public cleanup(): void {
        this.updateListeners.clear();
        this.stateListeners.clear();
        this.disconnect();
    }
}

// Export singleton instance
export const socketManager = new SocketManager();

/**
 * Hook-friendly helpers
 */

/**
 * Connect to Socket.IO server
 */
export const connectSocket = (): void => {
    socketManager.connect();
};

/**
 * Disconnect from Socket.IO server
 */
export const disconnectSocket = (): void => {
    socketManager.disconnect();
};

/**
 * Subscribe to update events
 */
export const onSocketUpdate = (listener: (event: UpdateEvent) => void): (() => void) => {
    return socketManager.onUpdate(listener);
};

/**
 * Subscribe to connection state changes
 */
export const onSocketStateChange = (listener: (state: ConnectionState) => void): (() => void) => {
    return socketManager.onStateChange(listener);
};

/**
 * Broadcast update to all displays
 */
export const broadcastUpdate = (type: UpdateType, data?: any): void => {
    socketManager.broadcastUpdate(type, data);
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
    return socketManager.isConnected();
};

/**
 * Get current connection state
 */
export const getSocketState = (): ConnectionState => {
    return socketManager.getConnectionState();
};

