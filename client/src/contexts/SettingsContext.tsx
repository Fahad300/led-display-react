/**
 * ⚠️ DEPRECATED - SETTINGS CONTEXT (Backward Compatibility Layer Only)
 * 
 * This context is DEPRECATED and maintained only for backward compatibility
 * during the migration period.
 * 
 * ==================== MIGRATION GUIDE ====================
 * 
 * Replace `useSettings()` with `useUIStore()`:
 * 
 * OLD WAY:
 * ```typescript
 * import { useSettings } from "@/contexts/SettingsContext";
 * const { displaySettings, updateDisplaySettings } = useSettings();
 * ```
 * 
 * NEW WAY:
 * ```typescript
 * import { useUIStore } from "@/stores/useUIStore";
 * 
 * // Option A: Selective subscription (optimal)
 * const displaySettings = useUIStore(state => state.displaySettings);
 * const updateDisplaySettings = useUIStore(state => state.updateDisplaySettings);
 * 
 * // Option B: Convenience hook
 * import { useDisplaySettings, useDisplaySettingsActions } from "@/stores/useUIStore";
 * const displaySettings = useDisplaySettings();
 * const { updateDisplaySettings } = useDisplaySettingsActions();
 * ```
 * 
 * ==================== WHY THIS WAS DEPRECATED ====================
 * 
 * Problems:
 * - Required Context Provider (extra nesting)
 * - Caused re-renders for all consumers
 * - Duplicated state with localStorage and database
 * - Manual sync logic was complex
 * 
 * Benefits of Zustand:
 * - No Provider needed
 * - Selective subscriptions (better performance)
 * - Built-in persistence (automatic localStorage sync)
 * - DevTools support
 * - Simpler API
 * 
 * ==================== REMOVAL TIMELINE ====================
 * 
 * - v1.9.0: Deprecated, compatibility layer active
 * - v2.0.0: TODO - Remove this file completely
 * 
 * See docs/architecture.md for full migration guide
 */

import React, { createContext, useContext, ReactNode, useEffect, useMemo, useCallback } from "react";
import { useUIStore } from "../stores/useUIStore";
import { logger } from "../utils/logger";

// Log deprecation warning once
let hasWarnedDeprecation = false;

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

interface SettingsProviderProps {
    children: ReactNode;
}

/**
 * @deprecated Settings Provider - Compatibility Layer Only
 * 
 * This provider wraps the new Zustand store to maintain backward compatibility.
 * New code should use `useUIStore()` directly instead.
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    // Show deprecation warning in development (only once)
    if (process.env.NODE_ENV === "development" && !hasWarnedDeprecation) {
        logger.warn(
            "⚠️ SettingsContext is DEPRECATED. Use useUIStore() instead. See docs/architecture.md"
        );
        hasWarnedDeprecation = true;
    }

    // Get state from Zustand store
    const displaySettings = useUIStore((state) => state.displaySettings);
    const updateDisplaySettingsAction = useUIStore((state) => state.updateDisplaySettings);
    const lastSynced = useUIStore((state) => state.lastSynced);
    const isSyncing = useUIStore((state) => state.isSyncing);
    const syncFromDatabase = useUIStore((state) => state.syncFromDatabase);

    // Wrapper for updateDisplaySettings to match old API
    const updateDisplaySettings = useCallback(async (settings: Partial<DisplaySettings>) => {
        try {
            await updateDisplaySettingsAction(settings);
        } catch (error) {
            logger.error("Failed to update display settings:", error);
            // Don't re-throw - the underlying action already handles errors gracefully
        }
    }, [updateDisplaySettingsAction]);

    // Wrapper for syncSettings
    const syncSettings = useCallback(async () => {
        try {
            await syncFromDatabase();
        } catch (error) {
            logger.error("Failed to sync settings:", error);
        }
    }, [syncFromDatabase]);

    // Initialize on mount (load from database)
    useEffect(() => {
        syncSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Context value
    const value: SettingsContextType = useMemo(
        () => ({
            displaySettings,
            updateDisplaySettings,
            isLoading: isSyncing,
            lastSynced,
            syncSettings
        }),
        [displaySettings, isSyncing, lastSynced, syncSettings, updateDisplaySettings]
    );

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/**
 * @deprecated Use useUIStore() instead
 * 
 * Hook to access settings context
 * This is a compatibility layer - prefer useUIStore():
 * ```typescript
 * const displaySettings = useUIStore(state => state.displaySettings);
 * const updateSettings = useUIStore(state => state.updateDisplaySettings);
 * ```
 */
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    // Show deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        logger.warn("useSettings() is deprecated. Use useUIStore() instead. See docs/architecture.md");
    }

    return context;
};

/**
 * TODO: Remove this file in v2.0.0 after migration is complete
 * 
 * Migration checklist:
 * - [ ] Update all components using useSettings()
 * - [ ] Update all imports from SettingsContext
 * - [ ] Remove this file
 * - [ ] Remove from App.tsx provider tree
 * - [ ] Update tests
 */
