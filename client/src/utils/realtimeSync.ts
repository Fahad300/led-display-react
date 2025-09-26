/**
 * Real-time synchronization utility for HomePage to DisplayPage communication
 * This ensures immediate updates without page reloads or polling delays
 */

export interface SyncEvent {
    type: 'slides' | 'settings' | 'api-data' | 'force-reload';
    data: any;
    timestamp: string;
    source: 'homepage' | 'api' | 'system';
}

export interface SlidesChangeEvent extends SyncEvent {
    type: 'slides';
    data: {
        slides: any[];
        activeSlides: any[];
        totalCount: number;
        activeCount: number;
        changes: string[];
    };
}

export interface SettingsChangeEvent extends SyncEvent {
    type: 'settings';
    data: {
        displaySettings: any;
        changes: string[];
    };
}

export interface ApiDataChangeEvent extends SyncEvent {
    type: 'api-data';
    data: {
        employees: any[];
        graphData: any;
        changes: string[];
    };
}

export interface ForceReloadEvent extends SyncEvent {
    type: 'force-reload';
    data: {
        reason: string;
    };
}

class RealtimeSyncManager {
    private eventTarget: EventTarget;
    private listeners: Map<string, Set<Function>> = new Map();

    constructor() {
        this.eventTarget = new EventTarget();
        this.setupGlobalEventListeners();
    }

    /**
     * Set up global event listeners for cross-tab communication
     */
    private setupGlobalEventListeners() {
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (event) => {
            if (event.key === 'realtime-sync-event' && event.newValue) {
                try {
                    const syncEvent: SyncEvent = JSON.parse(event.newValue);
                    this.handleSyncEvent(syncEvent);
                } catch (error) {
                    console.error('Failed to parse sync event:', error);
                }
            }
        });

        // Listen for custom events within the same tab
        window.addEventListener('realtime-sync', (event: any) => {
            const syncEvent: SyncEvent = event.detail;
            this.handleSyncEvent(syncEvent);
        });
    }

    /**
     * Handle incoming sync events
     */
    private handleSyncEvent(syncEvent: SyncEvent) {
        console.log(`🔄 RealtimeSync: Received ${syncEvent.type} event from ${syncEvent.source}`, syncEvent.data);

        // Notify specific listeners for this event type
        const typeListeners = this.listeners.get(syncEvent.type);
        if (typeListeners) {
            typeListeners.forEach(listener => {
                try {
                    listener(syncEvent);
                } catch (error) {
                    console.error(`Error in ${syncEvent.type} listener:`, error);
                }
            });
        }

        // Notify generic listeners
        const allListeners = this.listeners.get('*');
        if (allListeners) {
            allListeners.forEach(listener => {
                try {
                    listener(syncEvent);
                } catch (error) {
                    console.error('Error in generic listener:', error);
                }
            });
        }
    }

    /**
     * Dispatch a sync event to all listeners
     */
    public dispatchSyncEvent(syncEvent: SyncEvent) {
        console.log(`📡 RealtimeSync: Dispatching ${syncEvent.type} event`, syncEvent.data);

        // Dispatch within the same tab
        const customEvent = new CustomEvent('realtime-sync', { detail: syncEvent });
        window.dispatchEvent(customEvent);

        // Dispatch to other tabs via localStorage
        localStorage.setItem('realtime-sync-event', JSON.stringify(syncEvent));
        // Clear immediately to avoid confusion
        setTimeout(() => {
            localStorage.removeItem('realtime-sync-event');
        }, 100);
    }

    /**
     * Listen for specific event types
     */
    public addEventListener(eventType: string, listener: Function): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }

        const typeListeners = this.listeners.get(eventType)!;
        typeListeners.add(listener);

        // Return unsubscribe function
        return () => {
            typeListeners.delete(listener);
            if (typeListeners.size === 0) {
                this.listeners.delete(eventType);
            }
        };
    }

    /**
     * Dispatch slides change event
     */
    public dispatchSlidesChange(slides: any[], changes: string[] = [], source: 'homepage' | 'api' | 'system' = 'homepage') {
        const activeSlides = slides.filter(slide => slide.active);

        const event: SlidesChangeEvent = {
            type: 'slides',
            data: {
                slides,
                activeSlides,
                totalCount: slides.length,
                activeCount: activeSlides.length,
                changes
            },
            timestamp: new Date().toISOString(),
            source
        };

        this.dispatchSyncEvent(event);
    }

    /**
     * Dispatch settings change event
     */
    public dispatchSettingsChange(displaySettings: any, changes: string[] = [], source: 'homepage' | 'api' | 'system' = 'homepage') {
        const event: SettingsChangeEvent = {
            type: 'settings',
            data: {
                displaySettings,
                changes
            },
            timestamp: new Date().toISOString(),
            source
        };

        this.dispatchSyncEvent(event);
    }

    /**
     * Dispatch API data change event
     */
    public dispatchApiDataChange(employees: any[], graphData: any, changes: string[] = [], source: 'homepage' | 'api' | 'system' = 'api') {
        const event: ApiDataChangeEvent = {
            type: 'api-data',
            data: {
                employees,
                graphData,
                changes
            },
            timestamp: new Date().toISOString(),
            source
        };

        this.dispatchSyncEvent(event);
    }

    /**
     * Dispatch force reload event
     */
    public dispatchForceReload(reason: string, source: 'homepage' | 'api' | 'system' = 'system') {
        const event: ForceReloadEvent = {
            type: 'force-reload',
            data: {
                reason
            },
            timestamp: new Date().toISOString(),
            source
        };

        this.dispatchSyncEvent(event);
    }

    /**
     * Remove all listeners (cleanup)
     */
    public cleanup() {
        this.listeners.clear();
    }
}

// Create singleton instance
export const realtimeSync = new RealtimeSyncManager();

// Export convenience functions
export const dispatchSlidesChange = realtimeSync.dispatchSlidesChange.bind(realtimeSync);
export const dispatchSettingsChange = realtimeSync.dispatchSettingsChange.bind(realtimeSync);
export const dispatchApiDataChange = realtimeSync.dispatchApiDataChange.bind(realtimeSync);
export const dispatchForceReload = realtimeSync.dispatchForceReload.bind(realtimeSync);

export default realtimeSync;
