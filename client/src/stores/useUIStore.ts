/**
 * UI Store - Zustand Store for UI State Management
 * 
 * This store manages all UI-related state that was previously scattered across
 * multiple contexts (UnifiedContext, SettingsContext, etc.)
 * 
 * Responsibilities:
 * - Slides management (CRUD operations)
 * - Display settings (swiper effect, pagination, etc.)
 * - Edit mode state
 * - Slideshow control
 * - Database persistence
 * 
 * Why Zustand?
 * - No Provider needed (simpler than Context)
 * - Selective subscriptions (better performance)
 * - Built-in persistence (localStorage sync)
 * - DevTools support (debugging)
 * - TypeScript-friendly
 * 
 * Usage:
 * ```typescript
 * // Select specific state (optimal - only re-renders when this changes)
 * const slides = useUIStore(state => state.slides);
 * const updateSlide = useUIStore(state => state.updateSlide);
 * 
 * // Or destructure multiple
 * const { displaySettings, updateDisplaySettings } = useUIStore();
 * ```
 */

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { Slide, SLIDE_TYPES, EventSlide } from "../types";
import { sessionService } from "../services/sessionService";
import { logger } from "../utils/logger";

/**
 * Display settings interface
 */
export interface DisplaySettings {
    swiperEffect: string;
    showDateStamp: boolean;
    hidePagination: boolean;
    hideArrows: boolean;
    hidePersiviaLogo: boolean;
    developmentMode: boolean;
}

/**
 * Default display settings
 */
const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
    swiperEffect: "slide",
    showDateStamp: true,
    hidePagination: false,
    hideArrows: false,
    hidePersiviaLogo: false,
    developmentMode: false
};

/**
 * UI Store State Interface
 */
interface UIState {
    // ==================== SLIDES STATE ====================
    /** Array of all slides (user-created + system slides) */
    slides: Slide[];
    /** Loading state for database operations */
    isLoading: boolean;
    /** Edit mode flag (prevents auto-save during editing) */
    isEditing: boolean;

    // ==================== DISPLAY SETTINGS ====================
    /** Display configuration (swiper, pagination, logo, etc.) */
    displaySettings: DisplaySettings;

    // ==================== SLIDESHOW STATE ====================
    /** Current active slide index (for slideshow control) */
    currentSlideIndex: number;

    // ==================== SYNC STATE ====================
    /** Last sync timestamp */
    lastSynced: Date | null;
    /** Flag indicating if sync is in progress */
    isSyncing: boolean;

    // ==================== SLIDES ACTIONS ====================
    /**
     * Set all slides at once (used when loading from database)
     * @param slides - Array of slides to set
     */
    setSlides: (slides: Slide[] | ((prev: Slide[]) => Slide[])) => void;

    /**
     * Update a single slide
     * @param slide - Updated slide object
     * @param autoSave - Whether to auto-save to database (default: true)
     */
    updateSlide: (slide: Slide, autoSave?: boolean) => void;

    /**
     * Reorder slides (drag and drop)
     * @param slides - Reordered array of slides
     */
    reorderSlides: (slides: Slide[]) => void;

    /**
     * Add a new slide
     * @param slide - Slide to add
     */
    addSlide: (slide: Slide) => void;

    /**
     * Delete a slide
     * @param slideId - ID of slide to delete
     */
    deleteSlide: (slideId: string) => void;

    // ==================== DISPLAY SETTINGS ACTIONS ====================
    /**
     * Update display settings (partial update supported)
     * @param settings - Settings to update
     */
    updateDisplaySettings: (settings: Partial<DisplaySettings>) => Promise<void>;

    // ==================== UI STATE ACTIONS ====================
    /**
     * Set edit mode (prevents auto-save during editing)
     * @param editing - Whether user is currently editing
     */
    setIsEditing: (editing: boolean) => void;

    /**
     * Set current slide index (for slideshow control)
     * @param index - Slide index to set
     */
    setCurrentSlideIndex: (index: number) => void;

    // ==================== DATABASE ACTIONS ====================
    /**
     * Save current state to database
     * @param slidesToSave - Optional specific slides to save (defaults to all)
     */
    saveToDatabase: (slidesToSave?: Slide[]) => Promise<void>;

    /**
     * Load state from database
     */
    syncFromDatabase: () => Promise<void>;

    /**
     * Force sync to remote displays
     */
    syncToRemoteDisplays: () => Promise<void>;

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges: () => boolean;

    // ==================== INTERNAL STATE ====================
    /** Hash of last saved state (for change detection) */
    _lastSavedStateHash: string;
}

/**
 * Create UI Store with persistence and devtools
 * 
 * Middleware:
 * - persist: Syncs state to localStorage for instant load
 * - devtools: Enables Redux DevTools for debugging
 */
export const useUIStore = create<UIState>()(
    devtools(
        persist(
            (set, get) => ({
                // ==================== INITIAL STATE ====================
                slides: [],
                isLoading: false,
                isEditing: false,
                displaySettings: DEFAULT_DISPLAY_SETTINGS,
                currentSlideIndex: 0,
                lastSynced: null,
                isSyncing: false,
                _lastSavedStateHash: "",

                // ==================== SLIDES ACTIONS ====================
                setSlides: (slides) => {
                    set((state) => ({
                        slides: typeof slides === "function" ? slides(state.slides) : slides
                    }));
                },

                updateSlide: (updatedSlide, autoSave = true) => {
                    set((state) => {
                        const updatedSlides = state.slides.map((slide) =>
                            slide.id === updatedSlide.id ? updatedSlide : slide
                        );

                        return { slides: updatedSlides };
                    });

                    // Auto-save critical changes to database
                    if (autoSave && !get().isEditing) {
                        const isDisplayPage = window.location.pathname === "/display";
                        if (!isDisplayPage) {
                            logger.sync("Critical slide change detected, auto-saving...");
                            setTimeout(() => {
                                get().saveToDatabase().catch((error) => {
                                    logger.error("Auto-save failed:", error);
                                });
                            }, 1000);
                        }
                    }
                },

                reorderSlides: (reorderedSlides) => {
                    set({ slides: reorderedSlides });

                    // Auto-save reorder changes
                    const isDisplayPage = window.location.pathname === "/display";
                    if (!isDisplayPage) {
                        logger.sync("Slides reordered, auto-saving...");
                        setTimeout(() => {
                            get().saveToDatabase().catch((error) => {
                                logger.error("Auto-save failed:", error);
                            });
                        }, 1000);
                    }
                },

                addSlide: (slide) => {
                    set((state) => ({
                        slides: [...state.slides, slide]
                    }));
                },

                deleteSlide: (slideId) => {
                    set((state) => ({
                        slides: state.slides.filter((s) => s.id !== slideId)
                    }));
                },

                // ==================== DISPLAY SETTINGS ACTIONS ====================
                updateDisplaySettings: async (newSettings) => {
                    const updatedSettings = { ...get().displaySettings, ...newSettings };

                    // Update state immediately for UI responsiveness
                    set({ displaySettings: updatedSettings });

                    // Save to localStorage immediately
                    localStorage.setItem("displaySettings", JSON.stringify(updatedSettings));

                    // Save to database and sync to all devices
                    try {
                        // Load current slideshow data to preserve existing slides
                        const currentData = await sessionService.loadSlideshowData();

                        // Save settings while preserving existing slides data
                        const slideshowData = {
                            slides: currentData?.slides || get().slides || [],
                            displaySettings: updatedSettings,
                            lastUpdated: new Date().toISOString(),
                            version: "1.0.0"
                        };

                        await sessionService.saveSlideshowData(slideshowData);

                        // Trigger remote refresh to sync to all devices (silently fails if not authenticated)
                        await sessionService.triggerRemoteRefresh("settings");

                        set({ lastSynced: new Date() });

                        logger.success("Display settings saved successfully");

                        // Dispatch event to notify other components
                        const event = new CustomEvent("settingsChanged", {
                            detail: { settings: updatedSettings }
                        });
                        window.dispatchEvent(event);
                    } catch (error) {
                        logger.error("Failed to sync display settings:", error);
                        // Don't re-throw - settings were updated locally, sync failure is non-critical
                    }
                },

                // ==================== UI STATE ACTIONS ====================
                setIsEditing: (editing) => {
                    set({ isEditing: editing });
                },

                setCurrentSlideIndex: (index) => {
                    set({ currentSlideIndex: index });
                },

                // ==================== DATABASE ACTIONS ====================
                saveToDatabase: async (slidesToSave) => {
                    const state = get();
                    const slidesToUse = slidesToSave || state.slides;

                    try {
                        set({ isSyncing: true });

                        // Get current display settings (from store, not localStorage)
                        const currentSettings = state.displaySettings;

                        const slideshowData = {
                            slides: slidesToUse,
                            displaySettings: currentSettings,
                            lastUpdated: new Date().toISOString(),
                            version: "1.0.0"
                        };

                        await sessionService.saveSlideshowData(slideshowData);

                        // Update last saved hash
                        const newHash = JSON.stringify({ slides: slidesToUse });
                        set({
                            _lastSavedStateHash: newHash,
                            lastSynced: new Date(),
                            isSyncing: false
                        });

                        // Trigger remote display refresh
                        try {
                            await get().syncToRemoteDisplays();
                        } catch (refreshError) {
                            logger.warn("Remote display refresh failed:", refreshError);
                        }

                        logger.success("Data saved to database successfully");
                    } catch (error) {
                        set({ isSyncing: false });
                        logger.error("Error saving to database:", error);
                        throw error;
                    }
                },

                syncFromDatabase: async () => {
                    try {
                        set({ isSyncing: true });

                        logger.sync("Syncing from database...");
                        const slideshowData = await sessionService.loadSlideshowData();

                        if (slideshowData) {
                            // Update slides if available
                            if (slideshowData.slides && slideshowData.slides.length > 0) {
                                set({
                                    slides: slideshowData.slides,
                                    _lastSavedStateHash: JSON.stringify({
                                        slides: slideshowData.slides
                                    })
                                });
                            }

                            // Update display settings if available
                            if (slideshowData.displaySettings) {
                                set({
                                    displaySettings: {
                                        ...DEFAULT_DISPLAY_SETTINGS,
                                        ...slideshowData.displaySettings
                                    }
                                });
                            }

                            set({ lastSynced: new Date() });
                            logger.success("Synced from database successfully");
                        }

                        set({ isSyncing: false });
                    } catch (error) {
                        set({ isSyncing: false });
                        logger.error("Error syncing from database:", error);
                    }
                },

                syncToRemoteDisplays: async () => {
                    try {
                        logger.sync("Syncing to remote displays...");
                        await sessionService.triggerRemoteRefresh("all");
                        logger.success("Remote displays synced successfully");
                    } catch (error) {
                        logger.error("Error syncing to remote displays:", error);
                        throw error;
                    }
                },

                hasUnsavedChanges: () => {
                    const state = get();
                    const currentHash = JSON.stringify({ slides: state.slides });
                    const hasChanges = currentHash !== state._lastSavedStateHash;

                    logger.debug("Checking for unsaved changes:", {
                        hasChanges,
                        currentHash: currentHash.substring(0, 50) + "...",
                        lastSavedHash: state._lastSavedStateHash.substring(0, 50) + "..."
                    });

                    return hasChanges;
                }
            }),
            {
                name: "ui-store", // LocalStorage key
                /**
                 * Partial persistence - only persist essential state
                 * Slides are loaded from database, not localStorage
                 */
                partialize: (state) => ({
                    displaySettings: state.displaySettings,
                    currentSlideIndex: state.currentSlideIndex
                })
            }
        ),
        {
            name: "UI Store", // DevTools name
            enabled: process.env.NODE_ENV === "development"
        }
    )
);

/**
 * Convenience selectors for common use cases
 * These prevent unnecessary re-renders by selecting only needed state
 */

/** Get only active slides */
export const useActiveSlides = () =>
    useUIStore((state) => state.slides.filter((slide) => slide.active));

/** Get only display settings */
export const useDisplaySettings = () => useUIStore((state) => state.displaySettings);

/** Get only edit mode state */
export const useIsEditing = () => useUIStore((state) => state.isEditing);

/** Get only current slide index */
export const useCurrentSlideIndex = () => useUIStore((state) => state.currentSlideIndex);

/** Get event slides (birthday/anniversary) */
export const useEventSlides = () =>
    useUIStore((state) =>
        state.slides.filter((slide) => slide.type === SLIDE_TYPES.EVENT) as EventSlide[]
    );

/**
 * Convenience action hooks
 * Use these for cleaner component code
 */

/** Hook for slide management actions */
export const useSlideActions = () => {
    const updateSlide = useUIStore((state) => state.updateSlide);
    const reorderSlides = useUIStore((state) => state.reorderSlides);
    const addSlide = useUIStore((state) => state.addSlide);
    const deleteSlide = useUIStore((state) => state.deleteSlide);

    return {
        updateSlide,
        reorderSlides,
        addSlide,
        deleteSlide
    };
};

/** Hook for database actions */
export const useDatabaseActions = () => {
    const saveToDatabase = useUIStore((state) => state.saveToDatabase);
    const syncFromDatabase = useUIStore((state) => state.syncFromDatabase);
    const syncToRemoteDisplays = useUIStore((state) => state.syncToRemoteDisplays);
    const hasUnsavedChanges = useUIStore((state) => state.hasUnsavedChanges);

    return {
        saveToDatabase,
        syncFromDatabase,
        syncToRemoteDisplays,
        hasUnsavedChanges
    };
};

/** Hook for display settings actions */
export const useDisplaySettingsActions = () => {
    const updateDisplaySettings = useUIStore((state) => state.updateDisplaySettings);

    return {
        updateDisplaySettings
    };
};

/**
 * Initialize store with data from database
 * Call this on app mount to load persisted state
 */
export const initializeUIStore = async (): Promise<void> => {
    try {
        logger.info("Initializing UI Store from database...");

        const slideshowData = await sessionService.loadSlideshowData();

        if (slideshowData) {
            const { slides, displaySettings } = slideshowData;

            useUIStore.setState({
                slides: slides || [],
                displaySettings: {
                    ...DEFAULT_DISPLAY_SETTINGS,
                    ...displaySettings
                },
                _lastSavedStateHash: JSON.stringify({ slides: slides || [] }),
                lastSynced: new Date()
            });

            logger.success("UI Store initialized successfully");
        } else {
            logger.warn("No saved data found, using defaults");
        }
    } catch (error) {
        logger.error("Failed to initialize UI Store:", error);
        throw error;
    }
};

/**
 * TODO: Future enhancements
 * 
 * 1. Add undo/redo functionality
 * 2. Add slide history tracking
 * 3. Add collaborative editing (WebSocket sync)
 * 4. Add optimistic updates for better UX
 * 5. Add conflict resolution for multi-device editing
 */

