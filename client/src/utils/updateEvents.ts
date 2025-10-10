/**
 * Central Update Events System
 * 
 * This module provides a unified way to trigger display updates across all tabs/windows.
 * Currently uses BroadcastChannel for cross-tab communication.
 * 
 * TODO: When WebSocket is enabled, replace BroadcastChannel with socket.emit("broadcastUpdate", { type })
 * The rest of the app won't need changes - just swap the broadcast mechanism here.
 */

import { QueryClient } from "@tanstack/react-query";
import { logger } from "./logger";

/**
 * Types of updates that can be broadcast
 */
export type UpdateType =
    | "slides"          // Slides were added/edited/reordered
    | "settings"        // Display settings changed
    | "api-data"        // External API data updated
    | "force-reload"    // Force full page reload
    | "all";            // Everything changed

/**
 * Update event payload
 */
export interface UpdateEvent {
    type: UpdateType;
    timestamp: string;
    source: string; // Which component triggered the update
    data?: any;     // Optional metadata about the change
}

/**
 * BroadcastChannel for cross-tab communication
 * Falls back to localStorage for browsers that don't support BroadcastChannel
 */
class UpdateEventsManager {
    private broadcastChannel: BroadcastChannel | null = null;
    private listeners: Set<(event: UpdateEvent) => void> = new Set();
    private readonly CHANNEL_NAME = "led-display-updates";
    private readonly STORAGE_KEY = "led-display-update-event";

    constructor() {
        this.initializeBroadcastChannel();
        this.setupStorageFallback();
    }

    /**
     * Initialize BroadcastChannel if supported
     */
    private initializeBroadcastChannel(): void {
        if (typeof BroadcastChannel !== "undefined") {
            try {
                this.broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
                this.broadcastChannel.onmessage = (event) => {
                    this.handleIncomingEvent(event.data);
                };
                logger.info("✅ BroadcastChannel initialized for cross-tab updates");
            } catch (error) {
                logger.warn("⚠️ BroadcastChannel not available, using localStorage fallback", error);
                this.broadcastChannel = null;
            }
        }
    }

    /**
     * Setup localStorage fallback for cross-tab communication
     */
    private setupStorageFallback(): void {
        if (typeof window !== "undefined") {
            window.addEventListener("storage", (e) => {
                if (e.key === this.STORAGE_KEY && e.newValue) {
                    try {
                        const event = JSON.parse(e.newValue);
                        this.handleIncomingEvent(event);
                    } catch (error) {
                        logger.error("Failed to parse storage event", error);
                    }
                }
            });
        }
    }

    /**
     * Handle incoming update event
     */
    private handleIncomingEvent(event: UpdateEvent): void {
        logger.info(`📡 Received update event: ${event.type} from ${event.source}`);

        // Notify all listeners
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                logger.error("Error in update event listener", error);
            }
        });
    }

    /**
     * Broadcast an update to all tabs/windows
     * TODO: Replace with socket.emit("broadcastUpdate", event) when WebSocket is enabled
     */
    public broadcast(event: UpdateEvent): void {
        logger.info(`📤 Broadcasting update: ${event.type} from ${event.source}`);

        // BroadcastChannel (preferred)
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(event);
            } catch (error) {
                logger.error("Failed to broadcast via BroadcastChannel", error);
            }
        }

        // localStorage fallback for cross-tab communication
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(event));
                // Clear immediately to allow repeated broadcasts of same type
                setTimeout(() => {
                    localStorage.removeItem(this.STORAGE_KEY);
                }, 100);
            } catch (error) {
                logger.error("Failed to broadcast via localStorage", error);
            }
        }

        // Also notify local listeners
        this.handleIncomingEvent(event);
    }

    /**
     * Subscribe to update events
     * @returns Unsubscribe function
     */
    public subscribe(listener: (event: UpdateEvent) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }
        this.listeners.clear();
    }
}

// Singleton instance
const updateEventsManager = new UpdateEventsManager();

/**
 * Trigger a display update across all tabs/windows
 * 
 * This is the main function you should use to broadcast updates.
 * 
 * @param type - Type of update (slides, settings, api-data, etc.)
 * @param source - Component that triggered the update (for debugging)
 * @param queryClient - Optional React Query client to invalidate queries
 * @param data - Optional metadata about the change
 * 
 * @example
 * ```ts
 * // After saving slides
 * await triggerDisplayUpdate("slides", "HomePage", queryClient);
 * 
 * // After changing settings
 * await triggerDisplayUpdate("settings", "SettingsModal", queryClient);
 * 
 * // With metadata
 * await triggerDisplayUpdate("slides", "AdminPage", queryClient, { 
 *   slideId: "123", 
 *   action: "created" 
 * });
 * ```
 * 
 * TODO: When WebSocket is enabled, add:
 * ```ts
 * if (socket?.connected) {
 *   socket.emit("broadcastUpdate", { type, source, data });
 * }
 * ```
 */
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

    // Broadcast to all tabs/windows
    updateEventsManager.broadcast(event);

    // Invalidate React Query cache if provided
    if (queryClient) {
        try {
            // Invalidate appropriate queries based on update type
            switch (type) {
                case "slides":
                    // Slides changed, but API data is still fresh
                    logger.info("🔄 Invalidating slides data");
                    break;

                case "settings":
                    // Settings changed
                    logger.info("🔄 Invalidating settings data");
                    break;

                case "api-data":
                    // External API data updated
                    await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
                    logger.info("🔄 Invalidated React Query cache: dashboardData");
                    break;

                case "all":
                case "force-reload":
                    // Everything changed, invalidate all
                    await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
                    logger.info("🔄 Invalidated all React Query caches");
                    break;
            }
        } catch (error) {
            logger.error("Failed to invalidate React Query cache", error);
        }
    }
};

/**
 * Subscribe to display update events
 * 
 * @param listener - Callback to handle update events
 * @returns Unsubscribe function
 * 
 * @example
 * ```ts
 * useEffect(() => {
 *   const unsubscribe = onDisplayUpdate((event) => {
 *     console.log("Update received:", event.type);
 *     if (event.type === "slides") {
 *       syncFromDatabase();
 *     }
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */
export const onDisplayUpdate = (
    listener: (event: UpdateEvent) => void
): (() => void) => {
    return updateEventsManager.subscribe(listener);
};

/**
 * Cleanup update events system
 * Call this when the app unmounts (rarely needed)
 */
export const cleanupUpdateEvents = (): void => {
    updateEventsManager.cleanup();
};

// Export the manager for advanced usage
export { updateEventsManager };

