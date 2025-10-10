/**
 * ⚠️ DEPRECATED - UNIFIED CONTEXT (Backward Compatibility Layer Only)
 * 
 * This context is DEPRECATED and maintained only for backward compatibility
 * during the migration period.
 * 
 * ==================== MIGRATION GUIDE ====================
 * 
 * Replace `useUnified()` with:
 * 
 * 1. For SERVER DATA (employees, graphData, escalations):
 *    ```typescript
 *    import { useDashboardData } from "@/hooks/useDashboardData";
 *    const { data, isLoading } = useDashboardData();
 *    const { employees, graphData, escalations } = data || {};
 *    ```
 * 
 * 2. For UI STATE (slides, displaySettings, etc.):
 *    ```typescript
 *    import { useUIStore } from "@/stores/useUIStore";
 *    const slides = useUIStore(state => state.slides);
 *    const updateSlide = useUIStore(state => state.updateSlide);
 *    ```
 * 
 * 3. For DISPLAY SETTINGS:
 *    ```typescript
 *    import { useUIStore } from "@/stores/useUIStore";
 *    const displaySettings = useUIStore(state => state.displaySettings);
 *    const updateSettings = useUIStore(state => state.updateDisplaySettings);
 *    ```
 * 
 * ==================== WHY THIS WAS DEPRECATED ====================
 * 
 * Problems with old architecture:
 * - Mixed server state and UI state in one context
 * - Caused unnecessary re-renders
 * - Hard to debug data flow
 * - Manual polling logic was complex
 * - No automatic caching
 * 
 * New architecture benefits:
 * - Clear separation: React Query (server) + Zustand (UI)
 * - Automatic caching and refetching
 * - Better performance (selective subscriptions)
 * - Easier to debug
 * - Modern best practices
 * 
 * ==================== REMOVAL TIMELINE ====================
 * 
 * - v1.9.0: Deprecated, compatibility layer active
 * - v2.0.0: TODO - Remove this file completely
 * 
 * See docs/architecture.md for full migration guide
 */

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useUIStore } from "../stores/useUIStore";
import { Slide, Employee, GraphSlideData } from "../types";
import { logger } from "../utils/logger";

// Log deprecation warning once
let hasWarnedDeprecation = false;

interface UnifiedContextType {
    // ==================== DATA (from React Query) ====================
    employees: Employee[];
    graphData: GraphSlideData | null;
    escalations: any[];

    // ==================== UI STATE (from Zustand) ====================
    slides: Slide[];
    setSlides: (slides: Slide[] | ((prev: Slide[]) => Slide[])) => void;
    updateSlide: (slide: Slide, autoSave?: boolean) => void;
    reorderSlides: (slides: Slide[]) => void;

    // ==================== LOADING STATES ====================
    isLoading: boolean;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;

    // ==================== PAGE DETECTION ====================
    isDisplayPage: boolean;

    // ==================== LEGACY API POLLING STATE ====================
    /** @deprecated Use React Query's isFetching instead */
    apiPollingState: {
        isPolling: boolean;
        lastApiCheck: Date | null;
        lastDataHash: string;
        hasApiChanges: boolean;
        pollingInProgress: boolean;
    };

    // ==================== ACTIONS ====================
    saveToDatabase: (slidesToSave?: Slide[]) => Promise<void>;
    syncFromDatabase: () => Promise<void>;
    /** @deprecated React Query handles this automatically */
    refreshApiData: () => Promise<void>;
    syncToRemoteDisplays: () => Promise<void>;
    /** @deprecated Use React Query's refetch() instead */
    forceApiCheck: () => Promise<void>;
    /** @deprecated React Query handles cache automatically */
    clearApiCache: () => void;
    /** @deprecated React Query handles polling automatically */
    startApiPolling: () => void;
    /** @deprecated React Query handles polling automatically */
    stopApiPolling: () => void;
    forceMigrateVideoUrls: () => void;
    hasUnsavedChanges: () => boolean;
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

interface UnifiedProviderProps {
    children: ReactNode;
}

/**
 * @deprecated Unified Provider - Compatibility Layer Only
 * 
 * This provider is maintained for backward compatibility.
 * New code should use hooks and stores directly:
 * - useDashboardData() for server data
 * - useUIStore() for UI state
 */
export const UnifiedProvider: React.FC<UnifiedProviderProps> = ({ children }) => {
    // Show deprecation warning in development (only once)
    if (process.env.NODE_ENV === "development" && !hasWarnedDeprecation) {
        logger.warn(
            "⚠️ UnifiedContext is DEPRECATED. Migrate to useDashboardData() + useUIStore(). See docs/architecture.md"
        );
        hasWarnedDeprecation = true;
    }

    // ==================== NEW ARCHITECTURE ====================
    // Get server data from React Query
    const {
        data: dashboardData,
        isLoading: isDashboardLoading,
        refetch: refetchDashboard,
        isFetching
    } = useDashboardData();

    // Get UI state from Zustand (using selectors to prevent unnecessary re-renders)
    const slides = useUIStore((state) => state.slides);
    const setSlides = useUIStore((state) => state.setSlides);
    const updateSlide = useUIStore((state) => state.updateSlide);
    const reorderSlides = useUIStore((state) => state.reorderSlides);
    const isEditing = useUIStore((state) => state.isEditing);
    const setIsEditing = useUIStore((state) => state.setIsEditing);
    const saveToDatabase = useUIStore((state) => state.saveToDatabase);
    const syncFromDatabase = useUIStore((state) => state.syncFromDatabase);
    const syncToRemoteDisplays = useUIStore((state) => state.syncToRemoteDisplays);
    const hasUnsavedChanges = useUIStore((state) => state.hasUnsavedChanges);

    // ==================== LEGACY COMPATIBILITY ====================
    // Extract data from React Query response
    const employees = useMemo(() => dashboardData?.employees || [], [dashboardData]);
    const graphData = useMemo(() => dashboardData?.graphData || null, [dashboardData]);
    const escalations = useMemo(() => dashboardData?.escalations || [], [dashboardData]);

    // Check if on display page
    const isDisplayPage = useMemo(() => {
        return window.location.pathname === "/display" || window.location.pathname === "/display/";
    }, []);

    // Legacy API polling state (derived from React Query)
    const apiPollingState = useMemo(
        () => ({
            isPolling: true, // React Query is always "polling" via refetchInterval
            lastApiCheck: new Date(),
            lastDataHash: "",
            hasApiChanges: isFetching,
            pollingInProgress: isFetching
        }),
        [isFetching]
    );

    // ==================== LEGACY ACTIONS (No-ops or wrappers) ====================

    /** @deprecated React Query handles this automatically */
    const refreshApiData = async () => {
        logger.warn("refreshApiData() is deprecated. React Query handles this automatically.");
        await refetchDashboard();
    };

    /** @deprecated Use React Query's refetch() instead */
    const forceApiCheck = async () => {
        logger.warn("forceApiCheck() is deprecated. Use useDashboardData().refetch() instead.");
        await refetchDashboard();
    };

    /** @deprecated React Query handles cache automatically */
    const clearApiCache = () => {
        logger.warn("clearApiCache() is deprecated. React Query handles cache automatically.");
        refetchDashboard();
    };

    /** @deprecated React Query handles polling automatically */
    const startApiPolling = () => {
        logger.warn("startApiPolling() is deprecated. React Query polls via refetchInterval.");
        // No-op
    };

    /** @deprecated React Query handles polling automatically */
    const stopApiPolling = () => {
        logger.warn("stopApiPolling() is deprecated. React Query cannot be stopped dynamically.");
        // No-op
    };

    /** No-op for now - video URLs are handled elsewhere */
    const forceMigrateVideoUrls = () => {
        logger.info("Video URL migration is no longer needed");
        // No-op
    };

    // ==================== CONTEXT VALUE ====================
    const value: UnifiedContextType = {
        // Data from React Query
        employees,
        graphData,
        escalations,

        // UI state from Zustand
        slides,
        setSlides,
        updateSlide,
        reorderSlides,

        // Loading states
        isLoading: isDashboardLoading,
        isEditing,
        setIsEditing,

        // Page detection
        isDisplayPage,

        // Legacy state
        apiPollingState,

        // Actions
        saveToDatabase,
        syncFromDatabase,
        refreshApiData,
        syncToRemoteDisplays,
        forceApiCheck,
        clearApiCache,
        startApiPolling,
        stopApiPolling,
        forceMigrateVideoUrls,
        hasUnsavedChanges
    };

    return <UnifiedContext.Provider value={value}>{children}</UnifiedContext.Provider>;
};

/**
 * @deprecated Use useDashboardData() + useUIStore() instead
 * 
 * Hook to access unified context
 * This is a compatibility layer - prefer direct hooks:
 * - useDashboardData() for server data
 * - useUIStore() for UI state
 */
export const useUnified = (): UnifiedContextType => {
    const context = useContext(UnifiedContext);
    if (context === undefined) {
        throw new Error("useUnified must be used within a UnifiedProvider");
    }

    // Show deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        logger.warn(
            "useUnified() is deprecated. Use useDashboardData() + useUIStore() instead. See docs/architecture.md"
        );
    }

    return context;
};

/**
 * TODO: Remove this file in v2.0.0 after migration is complete
 * 
 * Migration checklist:
 * - [ ] Update all components using useUnified()
 * - [ ] Update all imports from UnifiedContext
 * - [ ] Remove this file
 * - [ ] Remove from App.tsx provider tree
 * - [ ] Update tests
 */
