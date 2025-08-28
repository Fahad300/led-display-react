import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import sessionService from "../services/sessionService";

interface DisplaySettings {
    swiperEffect: string;
    showDateStamp: boolean;
    hidePagination: boolean;
    hideArrows: boolean;
    hidePersiviaLogo: boolean;
}

interface DisplaySettingsContextType {
    settings: DisplaySettings;
    updateSettings: (newSettings: Partial<DisplaySettings>) => void;
    setSettings: (settings: DisplaySettings | ((prevSettings: DisplaySettings) => DisplaySettings)) => void;
    forceRefresh: () => void;
    onRefreshRequest: (callback: () => void) => void;
}

const defaultSettings: DisplaySettings = {
    swiperEffect: "slide",
    showDateStamp: true,
    hidePagination: false,
    hideArrows: false,
    hidePersiviaLogo: false,
};

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [settings, setSettings] = useState<DisplaySettings>(defaultSettings);

    const [refreshCallbacks, setRefreshCallbacks] = useState<(() => void)[]>([]);
    const [lastSyncTime, setLastSyncTime] = useState<number>(0);

    // BroadcastChannel for cross-tab communication
    const [broadcastChannel] = useState(() => {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            return new BroadcastChannel("led-display-settings");
        }
        return null;
    });

    // Initialize session and sync settings from database only
    useEffect(() => {
        const initializeSession = async () => {
            try {

                await sessionService.initializeSession();

                // Always try to load settings from database
                const serverData = await sessionService.syncFromServer();
                if (serverData?.displaySettings) {
                    setSettings(prev => ({ ...prev, ...serverData.displaySettings }));
                    setLastSyncTime(Date.now());

                } else {

                }
            } catch (error) {
                console.error("Error initializing session:", error);

            }
        };

        // Always initialize from database
        initializeSession();
    }, [isAuthenticated, user]);

    // Listen for settings updates from other tabs and devices
    useEffect(() => {
        // Local tab communication via BroadcastChannel
        if (broadcastChannel) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === "SETTINGS_UPDATE") {

                    setSettings(event.data.settings);
                } else if (event.data.type === "FORCE_REFRESH") {

                    // Trigger all refresh callbacks
                    refreshCallbacks.forEach(callback => callback());
                }
            };

            broadcastChannel.addEventListener("message", handleMessage);
            return () => broadcastChannel.removeEventListener("message", handleMessage);
        }
    }, [broadcastChannel, refreshCallbacks]);

    // Cross-device synchronization now handled by UnifiedPollingContext

    // Save settings to server and broadcast to other tabs
    const updateSettings = useCallback(async (newSettings: Partial<DisplaySettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        // Sync to server if authenticated
        if (isAuthenticated) {
            try {
                await sessionService.updateDisplaySettings(updatedSettings);

            } catch (error) {
                console.error("Error syncing settings to server:", error);
            }
        } else {
            // For unauthenticated displays, we can't update server settings
            // but we can still broadcast to other tabs
            console.debug("Settings updated (unauthenticated display)");
        }

        // Broadcast to other tabs
        if (broadcastChannel) {
            broadcastChannel.postMessage({
                type: "SETTINGS_UPDATE",
                settings: updatedSettings,
            });
        }
    }, [settings, broadcastChannel, isAuthenticated]);

    // Force refresh all display pages
    const forceRefresh = useCallback(async () => {


        // Create a timeout promise to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Force refresh timeout")), 10000); // 10 second timeout
        });

        try {
            // Immediately sync with server with timeout protection
            const serverData = await Promise.race([
                sessionService.syncFromServer(),
                timeoutPromise
            ]) as {
                displaySettings: any;
                slideData: any[];
                appSettings: any;
            } | null;

            if (serverData?.displaySettings) {
                setSettings(prev => {
                    const newSettings = { ...prev, ...serverData.displaySettings };

                    setLastSyncTime(Date.now());
                    return newSettings;
                });
            }
        } catch (error) {
            console.error("Error during force refresh sync:", error);
            // Don't throw the error, continue with local refresh
        }

        // Broadcast refresh request to other tabs with enhanced cache clearing
        if (broadcastChannel) {
            try {
                broadcastChannel.postMessage({
                    type: "FORCE_REFRESH",
                    timestamp: Date.now(),
                    clearCache: true
                });

            } catch (error) {
                console.error("Error broadcasting force refresh:", error);
            }
        }

        // Execute all refresh callbacks with enhanced cache clearing
        try {
            refreshCallbacks.forEach((callback, index) => {
                try {
                    callback();

                } catch (error) {
                    console.error(`Error in force refresh callback ${index}:`, error);
                }
            });
        } catch (error) {
            console.error("Error executing refresh callbacks:", error);
        }


    }, [broadcastChannel, refreshCallbacks]);

    // Register refresh callback
    const onRefreshRequest = useCallback((callback: () => void) => {
        setRefreshCallbacks(prev => [...prev, callback]);

        // Return cleanup function
        return () => {
            setRefreshCallbacks(prev => prev.filter(cb => cb !== callback));
        };
    }, []);

    return (
        <DisplaySettingsContext.Provider value={{
            settings,
            updateSettings,
            setSettings,
            forceRefresh,
            onRefreshRequest,
        }}>
            {children}
        </DisplaySettingsContext.Provider>
    );
};

export const useDisplaySettings = (): DisplaySettingsContextType => {
    const context = useContext(DisplaySettingsContext);
    if (context === undefined) {
        throw new Error("useDisplaySettings must be used within a DisplaySettingsProvider");
    }
    return context;
}; 