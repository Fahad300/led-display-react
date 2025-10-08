import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sessionService } from '../services/sessionService';
import { dispatchSettingsChange } from '../utils/realtimeSync';
import { logger } from '../utils/logger';

interface DisplaySettings {
    swiperEffect: string;
    showDateStamp: boolean;
    hidePagination: boolean;
    hideArrows: boolean;
    hidePersiviaLogo: boolean;
    developmentMode: boolean;
}

interface SettingsContextType {
    displaySettings: DisplaySettings;
    updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
    isLoading: boolean;
    lastSynced: Date | null;
    syncSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DisplaySettings = {
    swiperEffect: "slide",
    showDateStamp: true,
    hidePagination: false,
    hideArrows: false,
    hidePersiviaLogo: false,
    developmentMode: false
};

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [isUserEditing, setIsUserEditing] = useState(false);

    // Load settings from localStorage first (for immediate UI response)
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('displaySettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setDisplaySettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
    }, []);

    // Load settings from database
    const loadSettingsFromDatabase = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await sessionService.loadSlideshowData();

            if (data?.displaySettings) {
                const newSettings = { ...DEFAULT_SETTINGS, ...data.displaySettings };

                // Only update if settings are actually different to prevent unnecessary re-renders
                setDisplaySettings(prevSettings => {
                    const isDifferent = JSON.stringify(prevSettings) !== JSON.stringify(newSettings);
                    if (isDifferent) {
                        logger.sync('SettingsContext: Loading settings from database:', {
                            previous: prevSettings,
                            new: newSettings,
                            isUserEditing
                        });
                        return newSettings;
                    } else {
                        logger.debug('SettingsContext: Settings unchanged, skipping update');
                    }
                    return prevSettings;
                });

                // Save to localStorage for immediate access
                localStorage.setItem('displaySettings', JSON.stringify(newSettings));
                setLastSynced(new Date());
            }
        } catch (error) {
            console.error('Failed to load settings from database:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save settings to database and sync to all devices
    const saveSettingsToDatabase = useCallback(async (settings: DisplaySettings) => {
        try {
            // Load current slideshow data to preserve existing slides
            const currentData = await sessionService.loadSlideshowData();

            // Save settings while preserving existing slides data
            const slideshowData = {
                slides: currentData?.slides || [], // Preserve existing slides or use empty array if none
                displaySettings: settings,
                lastUpdated: new Date().toISOString(),
                version: "1.0.0"
            };

            await sessionService.saveSlideshowData(slideshowData);

            // Trigger remote refresh to sync to all devices
            await sessionService.triggerRemoteRefresh('settings');

            // Save to localStorage
            localStorage.setItem('displaySettings', JSON.stringify(settings));
            setLastSynced(new Date());

            logger.success('Settings saved and synced to all devices (preserving slides data)');
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            throw error;
        }
    }, []);

    // Update settings with immediate sync
    const updateDisplaySettings = useCallback(async (newSettings: Partial<DisplaySettings>) => {
        const updatedSettings = { ...displaySettings, ...newSettings };

        // Mark that user is editing to prevent periodic sync from interfering
        setIsUserEditing(true);

        // Update state immediately for UI responsiveness
        setDisplaySettings(updatedSettings);

        // Save to localStorage immediately
        localStorage.setItem('displaySettings', JSON.stringify(updatedSettings));

        // Save to database and sync to all devices
        try {
            await saveSettingsToDatabase(updatedSettings);

            // Dispatch event to notify other components (like DisplayPage) of settings change
            const event = new CustomEvent('settingsChanged', {
                detail: { settings: updatedSettings }
            });
            window.dispatchEvent(event);

            // Dispatch real-time sync event to all DisplayPages immediately
            dispatchSettingsChange(updatedSettings, ['settings-updated'], 'homepage');

            logger.success('Settings updated and event dispatched');
        } catch (error) {
            console.error('Failed to sync settings:', error);
            // Revert to previous settings on error
            setDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
        } finally {
            // Reset editing flag after a delay to allow for user to make multiple changes
            setTimeout(() => {
                logger.debug('SettingsContext: Resetting user editing flag');
                setIsUserEditing(false);
            }, 5000); // Increased from 2 seconds to 5 seconds
        }
    }, [displaySettings, saveSettingsToDatabase]);

    // Sync settings from database (for when other devices make changes)
    const syncSettings = useCallback(async () => {
        await loadSettingsFromDatabase();
    }, [loadSettingsFromDatabase]);

    // Load settings on mount
    useEffect(() => {
        loadSettingsFromDatabase();
    }, [loadSettingsFromDatabase]);

    // Set up intelligent periodic sync (every 45 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isUserEditing) {
                logger.sync('SettingsContext: Performing intelligent periodic sync...', {
                    currentSettings: displaySettings,
                    isUserEditing
                });
                syncSettings();
            } else {
                logger.debug('SettingsContext: Skipping periodic sync - user is editing', {
                    isUserEditing,
                    currentSettings: displaySettings
                });
            }
        }, 45000); // 45 seconds for less frequent but smarter sync

        return () => clearInterval(interval);
    }, [syncSettings, isUserEditing]);

    const value: SettingsContextType = {
        displaySettings,
        updateDisplaySettings,
        isLoading,
        lastSynced,
        syncSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
