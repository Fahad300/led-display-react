import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface DisplaySettings {
    swiperEffect: string;
    showDateStamp: boolean;
    hidePagination: boolean;
    hideArrows: boolean;
}

interface DisplaySettingsContextType {
    settings: DisplaySettings;
    updateSettings: (newSettings: Partial<DisplaySettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: DisplaySettings = {
    swiperEffect: "slide",
    showDateStamp: true,
    hidePagination: false,
    hideArrows: false
};

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export const DisplaySettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_SETTINGS);

    // Load user-specific settings when user changes
    useEffect(() => {
        if (user) {
            const storageKey = `display-settings-${user.id}`;
            try {
                const storedSettings = localStorage.getItem(storageKey);
                if (storedSettings) {
                    setSettings(JSON.parse(storedSettings));
                } else {
                    setSettings(DEFAULT_SETTINGS);
                }
            } catch (error) {
                console.error("Error loading display settings:", error);
                setSettings(DEFAULT_SETTINGS);
            }
        }
    }, [user]);

    // Save settings whenever they change
    useEffect(() => {
        if (user) {
            const storageKey = `display-settings-${user.id}`;
            try {
                localStorage.setItem(storageKey, JSON.stringify(settings));
            } catch (error) {
                console.error("Error saving display settings:", error);
            }
        }
    }, [settings, user]);

    const updateSettings = (newSettings: Partial<DisplaySettings>) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <DisplaySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </DisplaySettingsContext.Provider>
    );
};

export const useDisplaySettings = () => {
    const context = useContext(DisplaySettingsContext);
    if (context === undefined) {
        throw new Error("useDisplaySettings must be used within a DisplaySettingsProvider");
    }
    return context;
}; 