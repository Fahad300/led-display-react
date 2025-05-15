import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, ThemeSettings } from '../types';

// Local storage key for settings
const STORAGE_KEY = 'led-display-settings';

// Default theme settings
const DEFAULT_THEME: ThemeSettings = {
    theme: 'persivia',
    primaryColor: '#15CC93',
    secondaryColor: '#134D67'
};

// Default application settings
const DEFAULT_SETTINGS: AppSettings = {
    theme: DEFAULT_THEME,
    slideTransitionSpeed: 500,
    slideShowAutoPlay: true,
    defaultSlideDuration: 5
};

// Interface for the settings context
interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    updateTheme: (newTheme: Partial<ThemeSettings>) => void;
    resetSettings: () => void;
}

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => { },
    updateTheme: () => { },
    resetSettings: () => { }
});

// Props for the provider component
interface SettingsProviderProps {
    children: ReactNode;
}

/**
 * Provider component that wraps the app and provides the settings context
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    /**
     * Load settings from localStorage on mount
     */
    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings) as AppSettings;
                setSettings(parsedSettings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use default settings if there was an error
            setSettings(DEFAULT_SETTINGS);
        }
    }, []);

    /**
     * Save settings to localStorage whenever they change
     */
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            // Apply theme
            document.documentElement.setAttribute('data-theme', settings.theme.theme);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, [settings]);

    /**
     * Update settings
     */
    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prevSettings: AppSettings) => ({
            ...prevSettings,
            ...newSettings
        }));
    };

    /**
     * Update theme settings
     */
    const updateTheme = (newTheme: Partial<ThemeSettings>) => {
        setSettings((prevSettings: AppSettings) => ({
            ...prevSettings,
            theme: {
                ...prevSettings.theme,
                ...newTheme
            }
        }));
    };

    /**
     * Reset settings to defaults
     */
    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    // Value object for the context provider
    const contextValue: SettingsContextType = {
        settings,
        updateSettings,
        updateTheme,
        resetSettings
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

/**
 * Custom hook to use the settings context
 */
export const useSettings = () => useContext(SettingsContext);

export default SettingsContext; 