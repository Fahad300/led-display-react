import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import sessionService from "../services/sessionService";

interface DisplaySettings {
    swiperEffect: string;
    showDateStamp: boolean;
    hidePagination: boolean;
    hideArrows: boolean;
}

interface DisplaySettingsContextType {
    settings: DisplaySettings;
    updateSettings: (newSettings: Partial<DisplaySettings>) => void;
    forceRefresh: () => void;
    onRefreshRequest: (callback: () => void) => void;
}

const defaultSettings: DisplaySettings = {
    swiperEffect: "slide",
    showDateStamp: true,
    hidePagination: false,
    hideArrows: false,
};

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [settings, setSettings] = useState<DisplaySettings>(() => {
        const saved = localStorage.getItem("displaySettings");
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    const [refreshCallbacks, setRefreshCallbacks] = useState<(() => void)[]>([]);

    // BroadcastChannel for cross-tab communication
    const [broadcastChannel] = useState(() => {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            return new BroadcastChannel("led-display-settings");
        }
        return null;
    });

    // Initialize session and sync settings from server
    useEffect(() => {
        if (isAuthenticated && user) {
            const initializeSession = async () => {
                try {
                    await sessionService.initializeSession();

                    // Try to sync settings from server
                    const serverData = await sessionService.syncFromServer();
                    if (serverData?.displaySettings) {
                        setSettings(prev => ({ ...prev, ...serverData.displaySettings }));
                    }
                } catch (error) {
                    console.error("Error initializing session:", error);
                }
            };

            initializeSession();
        }
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

    // Cross-device synchronization via polling
    useEffect(() => {
        let pollInterval: NodeJS.Timeout | null = null;

        const pollForUpdates = async () => {
            try {
                // Try to get latest settings from server (works for both authenticated and unauthenticated)
                const serverData = await sessionService.syncFromServer();
                if (serverData?.displaySettings) {
                    setSettings(prev => {
                        const newSettings = { ...prev, ...serverData.displaySettings };
                        // Only update if there are actual changes
                        if (JSON.stringify(prev) !== JSON.stringify(newSettings)) {
                            console.log("🔄 Display settings updated from server:", newSettings);
                            return newSettings;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                // Silently handle errors for polling
                console.debug("Polling for settings updates:", error);
            }
        };

        // Poll every 5 seconds for cross-device updates
        pollInterval = setInterval(pollForUpdates, 5000);

        // Initial poll
        pollForUpdates();

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, []);

    // Save settings to localStorage, server, and broadcast to other tabs
    const updateSettings = useCallback(async (newSettings: Partial<DisplaySettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        localStorage.setItem("displaySettings", JSON.stringify(updatedSettings));

        // Sync to server if authenticated
        if (isAuthenticated) {
            try {
                await sessionService.updateDisplaySettings(updatedSettings);
            } catch (error) {
                console.error("Error syncing settings to server:", error);
            }
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
    const forceRefresh = useCallback(() => {
        // Broadcast refresh request to other tabs
        if (broadcastChannel) {
            broadcastChannel.postMessage({
                type: "FORCE_REFRESH",
            });
        }

        // Also refresh current tab if it's a display page
        refreshCallbacks.forEach(callback => callback());
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