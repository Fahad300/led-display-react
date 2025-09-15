import React, { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { sessionService } from '../services/sessionService';
import { SlideshowData } from '../types';

/**
 * Unified Polling Context - Intelligent, less aggressive syncing
 * Prevents settings reversion and reduces excessive database calls
 */

interface PollingState {
    isPolling: boolean;
    lastSync: Date | null;
    lastUserAction: Date | null;
    hasUnsavedChanges: boolean;
    syncInProgress: boolean;
}

interface UnifiedPollingContextType {
    // State
    pollingState: PollingState;

    // Actions
    markUserAction: () => void;
    markUnsavedChanges: (hasChanges: boolean) => void;
    forceSync: () => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;

    // Sync functions
    syncFromDatabase: () => Promise<SlideshowData | null>;
    syncToDatabase: (data: SlideshowData) => Promise<void>;
}

const UnifiedPollingContext = createContext<UnifiedPollingContextType | undefined>(undefined);

interface UnifiedPollingProviderProps {
    children: ReactNode;
}

// Configuration constants - Balanced polling
const POLLING_INTERVALS = {
    NORMAL: 30000,      // 30 seconds - normal polling
    IDLE: 60000,        // 60 seconds - when no user activity
    ACTIVE: 15000,      // 15 seconds - when user is actively making changes
    MINIMUM: 5000       // 5 seconds - minimum interval
};

const USER_ACTION_GRACE_PERIOD = 15000; // 15 seconds after user action before normal polling

export const UnifiedPollingProvider: React.FC<UnifiedPollingProviderProps> = ({ children }) => {
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const userActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [pollingState, setPollingState] = React.useState<PollingState>({
        isPolling: false,
        lastSync: null,
        lastUserAction: null,
        hasUnsavedChanges: false,
        syncInProgress: false
    });

    // Mark when user makes changes
    const markUserAction = useCallback(() => {
        const now = new Date();
        setPollingState(prev => ({
            ...prev,
            lastUserAction: now,
            hasUnsavedChanges: true
        }));

        // Clear existing timeout
        if (userActionTimeoutRef.current) {
            clearTimeout(userActionTimeoutRef.current);
        }

        // Set timeout to reset to normal polling after grace period
        userActionTimeoutRef.current = setTimeout(() => {
            setPollingState(prev => ({
                ...prev,
                lastUserAction: null
            }));
        }, USER_ACTION_GRACE_PERIOD);
    }, []);

    // Mark if there are unsaved changes
    const markUnsavedChanges = useCallback((hasChanges: boolean) => {
        setPollingState(prev => ({
            ...prev,
            hasUnsavedChanges: hasChanges
        }));
    }, []);

    // Determine appropriate polling interval based on current state
    const getPollingInterval = useCallback((): number => {
        const now = Date.now();
        const lastUserActionTime = pollingState.lastUserAction?.getTime() || 0;
        const timeSinceUserAction = now - lastUserActionTime;

        // If user just made changes, use active polling
        if (timeSinceUserAction < USER_ACTION_GRACE_PERIOD) {
            return POLLING_INTERVALS.ACTIVE;
        }

        // If there are unsaved changes, use shorter interval
        if (pollingState.hasUnsavedChanges) {
            return POLLING_INTERVALS.NORMAL;
        }

        // If no recent user activity, use longer interval
        return POLLING_INTERVALS.IDLE;
    }, [pollingState.lastUserAction, pollingState.hasUnsavedChanges]);

    // Track last known data hash to detect changes
    const lastDataHashRef = useRef<string>("");

    // Sync from database (read-only, doesn't overwrite user changes)
    const syncFromDatabase = useCallback(async (): Promise<SlideshowData | null> => {
        try {
            console.log("📥 Polling: Syncing from database...");
            const data = await sessionService.loadSlideshowData();

            setPollingState(prev => ({
                ...prev,
                lastSync: new Date(),
                syncInProgress: false
            }));

            if (data) {
                // Create a hash of the current data to detect changes
                const currentDataHash = JSON.stringify({
                    slides: data.slides?.map(slide => ({
                        id: slide.id,
                        name: slide.name,
                        type: slide.type,
                        active: slide.active,
                        duration: slide.duration,
                        data: slide.data
                    })) || [],
                    displaySettings: data.displaySettings,
                    lastUpdated: data.lastUpdated
                });

                // Always proceed if this is the first load (empty hash) or if data has changed
                if (lastDataHashRef.current === "" || currentDataHash !== lastDataHashRef.current) {
                    console.log("📥 Polling: Data changed, updating:", {
                        slidesCount: data.slides?.length || 0,
                        activeSlidesCount: data.slides?.filter((slide: any) => slide.active).length || 0,
                        hasDisplaySettings: !!data.displaySettings,
                        isFirstLoad: lastDataHashRef.current === ""
                    });

                    lastDataHashRef.current = currentDataHash;

                    // Dispatch event to notify UnifiedContext of data change
                    const event = new CustomEvent('dataChanged', {
                        detail: { data, source: 'polling' }
                    });
                    window.dispatchEvent(event);

                    return data;
                } else {
                    console.log("📥 Polling: No changes detected, skipping update");
                    return null;
                }
            }

            return null;
        } catch (error) {
            console.error("❌ Polling: Error syncing from database:", error);
            setPollingState(prev => ({
                ...prev,
                syncInProgress: false
            }));
            return null;
        }
    }, []);

    // Sync to database (saves user changes)
    const syncToDatabase = useCallback(async (data: SlideshowData): Promise<void> => {
        try {
            console.log("📤 Polling: Syncing to database...");
            setPollingState(prev => ({
                ...prev,
                syncInProgress: true
            }));

            await sessionService.saveSlideshowData(data);

            setPollingState(prev => ({
                ...prev,
                lastSync: new Date(),
                hasUnsavedChanges: false,
                syncInProgress: false
            }));

            console.log("✅ Polling: Successfully synced to database");
        } catch (error) {
            console.error("❌ Polling: Error syncing to database:", error);
            setPollingState(prev => ({
                ...prev,
                syncInProgress: false
            }));
            throw error;
        }
    }, []);

    // Force immediate sync
    const forceSync = useCallback(async (): Promise<void> => {
        if (pollingState.syncInProgress) {
            console.log("⏳ Polling: Sync already in progress, skipping...");
            return;
        }

        console.log("🔄 Polling: Force sync requested");

        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Perform sync and restart polling
        await syncFromDatabase();
        startPolling();
    }, [pollingState.syncInProgress, syncFromDatabase]);

    // Start intelligent polling
    const startPolling = useCallback(() => {
        if (pollingState.isPolling) {
            console.log("⚠️ Polling: Already polling, skipping start");
            return;
        }

        console.log("🚀 Polling: Starting intelligent polling...");

        setPollingState(prev => ({
            ...prev,
            isPolling: true
        }));

        const poll = async () => {
            if (pollingState.syncInProgress) {
                console.log("⏳ Polling: Sync in progress, skipping poll cycle");
                return;
            }

            // Check if user is currently editing - if so, skip polling completely
            const isCurrentlyEditing = document.querySelector('[data-editing="true"]') !== null;
            if (isCurrentlyEditing) {
                console.log("✏️ Polling: User is editing, skipping poll cycle to preserve changes");
                return;
            }

            const interval = getPollingInterval();
            console.log(`🔄 Polling: Next poll in ${interval / 1000}s (${pollingState.hasUnsavedChanges ? 'has changes' : 'no changes'})`);

            // Always try to sync from database to check for changes
            // The syncFromDatabase function will only return data if it actually changed
            const data = await syncFromDatabase();
            if (data) {
                console.log("🔄 Polling: Data changed, triggering update");
                // Dispatch custom event to notify components of data change
                window.dispatchEvent(new CustomEvent('dataChanged', {
                    detail: { data, source: 'polling' }
                }));
            } else {
                console.log("📥 Polling: No changes detected, skipping update");
            }
        };

        // Initial poll
        poll();

        // Set up recurring polling with dynamic interval
        const scheduleNextPoll = () => {
            const interval = getPollingInterval();
            pollingIntervalRef.current = setTimeout(() => {
                poll().then(() => {
                    if (pollingState.isPolling) {
                        scheduleNextPoll();
                    }
                });
            }, interval);
        };

        scheduleNextPoll();
    }, [pollingState.isPolling, pollingState.syncInProgress, pollingState.hasUnsavedChanges, getPollingInterval, syncFromDatabase]);

    // Stop polling
    const stopPolling = useCallback(() => {
        console.log("🛑 Polling: Stopping polling...");

        setPollingState(prev => ({
            ...prev,
            isPolling: false
        }));

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // Start polling on mount and immediately sync data
    useEffect(() => {
        const initializePolling = async () => {
            // First, immediately sync data from database
            console.log("🔄 Polling: Initial sync on mount...");
            await syncFromDatabase();

            // Then start regular polling
            startPolling();
        };

        initializePolling();
    }, [startPolling, syncFromDatabase]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (userActionTimeoutRef.current) {
                clearTimeout(userActionTimeoutRef.current);
            }
        };
    }, []);

    const contextValue: UnifiedPollingContextType = {
        pollingState,
        markUserAction,
        markUnsavedChanges,
        forceSync,
        startPolling,
        stopPolling,
        syncFromDatabase,
        syncToDatabase
    };

    return (
        <UnifiedPollingContext.Provider value={contextValue}>
            {children}
        </UnifiedPollingContext.Provider>
    );
};

export const useUnifiedPolling = (): UnifiedPollingContextType | undefined => {
    const context = useContext(UnifiedPollingContext);
    return context;
};
