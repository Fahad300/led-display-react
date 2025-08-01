import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Slide, SLIDE_TYPES, CurrentEscalationsSlide } from '../types';
import { currentEscalations } from '../data/currentEscalations';
import { getTeamComparisonSlide } from '../data/teamComparison';
import { getDefaultGraphSlide } from '../data/graphData';
import { useAuth } from './AuthContext';
import sessionService from '../services/sessionService';
import { SLIDE_DATA_SOURCES } from '../config/slideDefaults';

// Local storage key for slides
const STORAGE_KEY = 'led-display-templates-config';

// Interface for the slide context
interface SlideContextType {
    slides: Slide[];
    activeSlide: Slide | null;
    setActiveSlide: (slide: Slide | null) => void;
    addSlide: (slide: Slide) => void;
    updateSlide: (slide: Slide) => void;
    deleteSlide: (id: string) => Promise<void>;
    loadSlides: () => void;
    getSlideById: (id: string) => Slide | undefined;
    reorderSlides: (slides: Slide[]) => void;
    refreshSlidesDataSources: () => void;
    isLoading: boolean;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
}

// Create the context with default values
const SlideContext = createContext<SlideContextType>({
    slides: [],
    activeSlide: null,
    setActiveSlide: () => { },
    addSlide: () => { },
    updateSlide: () => { },
    deleteSlide: async () => { },
    loadSlides: () => { },
    getSlideById: () => undefined,
    reorderSlides: () => { },
    refreshSlidesDataSources: () => { },
    isLoading: false,
    isEditing: false,
    setIsEditing: () => { },
});

// Props for the provider component
interface SlideProviderProps {
    children: ReactNode;
}

/**
 * Generate a unique ID for a new slide
 */
const generateUniqueId = (): string => {
    return `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Get a current escalations slide
 */
const getCurrentEscalationsSlide = (): CurrentEscalationsSlide | null => {
    if (!currentEscalations || currentEscalations.length === 0) return null;
    return {
        id: "current-escalations-1",
        name: "Current Escalations",
        type: SLIDE_TYPES.CURRENT_ESCALATIONS,
        dataSource: SLIDE_DATA_SOURCES["current-escalations-slide"],
        duration: 10,
        active: true,
        data: {
            escalations: currentEscalations.map(escalation => ({
                ...escalation,
                currentStatus: escalation.curtentStatus
            }))
        }
    };
};

/**
 * Provider component that wraps the app and provides the slide context
 */
export const SlideProvider: React.FC<SlideProviderProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlide, setActiveSlide] = useState<Slide | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const lastUpdateRef = useRef<number>(0);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastLocalChangeRef = useRef<number>(0);

    /**
     * Debounced save function to prevent excessive updates
     */
    const debouncedSaveSlides = useCallback(async (slidesToSave: Slide[]) => {
        // Clear existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Set new timeout for debounced save
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(slidesToSave));

                // Sync to server if authenticated
                if (isAuthenticated) {
                    try {
                        await sessionService.updateSlideData(slidesToSave);
                    } catch (error) {
                        console.error("Error syncing slides to server:", error);
                    }
                }
            } catch (error) {
                console.error("Error saving slides:", error);
            }
        }, 300); // 300ms debounce
    }, [isAuthenticated]);

    /**
     * Immediate save function for critical operations
     */
    const immediateSaveSlides = useCallback(async (slidesToSave: Slide[]) => {
        // Clear any pending debounced saves to prevent conflicts
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slidesToSave));

            // Sync to server if authenticated
            if (isAuthenticated) {
                try {
                    await sessionService.updateSlideData(slidesToSave);
                } catch (error) {
                    console.error("Error syncing slides to server:", error);
                }
            }
        } catch (error) {
            console.error("Error saving slides:", error);
        }
    }, [isAuthenticated]);

    /**
     * Load slides from localStorage and server
     */
    const loadSlides = useCallback(async () => {
        setIsLoading(true);
        try {
            let allTemplates: any[] = [];

            // Try to load from server first if authenticated
            if (isAuthenticated) {
                try {
                    const serverData = await sessionService.syncFromServer();
                    if (serverData?.slideData && serverData.slideData.length > 0) {
                        allTemplates = serverData.slideData;
                    }
                } catch (error) {
                    console.error("Error loading slides from server:", error);
                }
            }

            // Fallback to localStorage if no server data
            if (allTemplates.length === 0) {
                allTemplates = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            }

            // Type-check and filter to ensure we only get valid slides
            const validSlides = allTemplates.filter((slide: any) =>
                slide && slide.id && slide.type &&
                Object.values(SLIDE_TYPES).includes(slide.type)
            ) as Slide[];

            // Force update data sources for existing slides based on current configuration
            const updatedValidSlides = validSlides.map(slide => {
                const slideTypeKey = slide.type as keyof typeof SLIDE_DATA_SOURCES;
                const newDataSource = SLIDE_DATA_SOURCES[slideTypeKey] || "manual";
                return {
                    ...slide,
                    dataSource: newDataSource
                };
            });

            // Get default slides
            const escalationsSlide = getCurrentEscalationsSlide();
            const comparisonSlide = getTeamComparisonSlide();
            const graphSlide = getDefaultGraphSlide();

            // Check which default slides already exist
            const hasEscalationsSlide = updatedValidSlides.some(s => s.type === SLIDE_TYPES.CURRENT_ESCALATIONS);
            const hasComparisonSlide = updatedValidSlides.some(s => s.type === SLIDE_TYPES.TEAM_COMPARISON);
            const hasGraphSlide = updatedValidSlides.some(s => s.type === SLIDE_TYPES.GRAPH);

            let finalSlides = [...updatedValidSlides];

            // Add default slides if they don't exist
            if (escalationsSlide && !hasEscalationsSlide) {
                finalSlides = [...finalSlides, escalationsSlide];
            }

            if (!hasComparisonSlide) {
                finalSlides = [...finalSlides, comparisonSlide];
            }

            if (!hasGraphSlide) {
                finalSlides = [...finalSlides, graphSlide];
            }

            // Always update slides to ensure data sources are current
            setSlides(finalSlides);
            await debouncedSaveSlides(finalSlides);
        } catch (error) {
            console.error("Error loading slides:", error);
            setSlides([]);
            await debouncedSaveSlides([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSaveSlides, isAuthenticated]);

    // Load slides on mount
    useEffect(() => {
        loadSlides();
    }, [loadSlides]);

    // Cross-device synchronization via polling with improved change detection
    useEffect(() => {
        let pollInterval: NodeJS.Timeout | null = null;

        const pollForUpdates = async () => {
            try {
                // Try to get latest slide data from server (works for both authenticated and unauthenticated)
                const serverData = await sessionService.syncFromServer();
                if (serverData?.slideData && serverData.slideData.length > 0) {
                    // Type-check and filter to ensure we only get valid slides
                    const validSlides = serverData.slideData.filter((slide: any) =>
                        slide && slide.id && slide.type &&
                        Object.values(SLIDE_TYPES).includes(slide.type)
                    ) as Slide[];

                    // Only update if there are actual changes and enough time has passed
                    const currentTime = Date.now();
                    const currentSlidesJson = JSON.stringify(slides);
                    const newSlidesJson = JSON.stringify(validSlides);

                    // Don't override if we've made local changes in the last 5 seconds
                    const timeSinceLocalChange = currentTime - lastLocalChangeRef.current;
                    if (currentSlidesJson !== newSlidesJson &&
                        (currentTime - lastUpdateRef.current) > 2000 &&
                        timeSinceLocalChange > 5000 &&
                        !isEditing) { // Skip syncing if user is editing
                        console.log("🔄 Slides updated from server:", validSlides.length, "slides");
                        console.log("⏰ Time since local change:", timeSinceLocalChange, "ms");
                        setSlides(validSlides);
                        lastUpdateRef.current = currentTime;
                        await debouncedSaveSlides(validSlides);
                    } else {
                        console.log("🚫 Skipping server update - recent local changes, no changes, or user is editing");
                    }
                }
            } catch (error) {
                // Silently handle errors for polling
                console.debug("Polling for slide updates:", error);
            }
        };

        // Poll every 10 seconds for cross-device slide updates
        pollInterval = setInterval(pollForUpdates, 10000);

        // Initial poll
        pollForUpdates();

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [debouncedSaveSlides, isEditing]); // Removed slides from dependency array

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Add a new slide
     */
    const addSlide = useCallback(async (slide: Slide) => {
        const newSlide = {
            ...slide,
            id: slide.id || generateUniqueId()
        };

        const updatedSlides = [...slides, newSlide];
        setSlides(updatedSlides);
        lastLocalChangeRef.current = Date.now();
        await immediateSaveSlides(updatedSlides);
    }, [slides, immediateSaveSlides]);

    /**
     * Update an existing slide
     */
    const updateSlide = useCallback(async (updatedSlide: Slide) => {
        const updatedSlides = slides.map(slide =>
            slide.id === updatedSlide.id ? updatedSlide : slide
        );

        setSlides(updatedSlides);
        lastLocalChangeRef.current = Date.now();
        await immediateSaveSlides(updatedSlides);
    }, [slides, immediateSaveSlides]);

    /**
     * Delete a slide by ID
     */
    const deleteSlide = useCallback(async (id: string) => {
        console.log("🗑️ Deleting slide with ID:", id);
        console.log("📊 Current slides count:", slides.length);

        const updatedSlides = slides.filter(slide => slide.id !== id);
        console.log("📊 Updated slides count:", updatedSlides.length);

        setSlides(updatedSlides);
        lastLocalChangeRef.current = Date.now();
        await immediateSaveSlides(updatedSlides);
        console.log("✅ Slide deletion completed");

        if (activeSlide?.id === id) {
            setActiveSlide(null);
        }
    }, [slides, activeSlide, immediateSaveSlides]);

    /**
     * Get a slide by ID
     */
    const getSlideById = useCallback((id: string): Slide | undefined => {
        return slides.find(slide => slide.id === id);
    }, [slides]);

    /**
     * Reorder slides and save the new order
     */
    const reorderSlides = useCallback((newOrder: Slide[]) => {
        setSlides(newOrder);
        lastLocalChangeRef.current = Date.now();
        debouncedSaveSlides(newOrder);
    }, [debouncedSaveSlides]);

    /**
     * Refresh all slides with current data source configuration
     */
    const refreshSlidesDataSources = useCallback(() => {
        const updatedSlides = slides.map(slide => {
            const slideTypeKey = slide.type as keyof typeof SLIDE_DATA_SOURCES;
            const newDataSource = SLIDE_DATA_SOURCES[slideTypeKey] || "manual";
            return {
                ...slide,
                dataSource: newDataSource
            };
        });
        setSlides(updatedSlides);
        lastLocalChangeRef.current = Date.now();
        debouncedSaveSlides(updatedSlides);
    }, [slides, debouncedSaveSlides]);

    // Value object for the context provider
    const contextValue: SlideContextType = {
        slides,
        activeSlide,
        setActiveSlide,
        addSlide,
        updateSlide,
        deleteSlide,
        loadSlides,
        getSlideById,
        reorderSlides,
        refreshSlidesDataSources,
        isLoading,
        isEditing,
        setIsEditing,
    };

    return (
        <SlideContext.Provider value={contextValue}>
            {children}
        </SlideContext.Provider>
    );
};

/**
 * Custom hook to use the slide context
 */
export const useSlides = (): SlideContextType => {
    return useContext(SlideContext);
};

export default SlideContext;