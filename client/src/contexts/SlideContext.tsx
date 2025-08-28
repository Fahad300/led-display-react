import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Slide, SLIDE_TYPES, CurrentEscalationsSlide, TeamComparisonSlide, GraphSlide } from "../types";
import { sessionService } from "../services/sessionService";
import { currentEscalations } from '../data/currentEscalations';
import { getTeamComparisonSlide } from '../data/teamComparison';
import { SLIDE_DATA_SOURCES } from '../config/slideDefaults';
import { useAuth } from './AuthContext';

// Database-driven slides (no localStorage)

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
 * Get current year for dynamic title
 */
const getCurrentYear = (): number => {
    return new Date().getFullYear();
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
     * Debounced save function to prevent excessive updates (database only)
     */
    const debouncedSaveSlides = useCallback(async (slidesToSave: Slide[]) => {
        // Clear existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Set new timeout for debounced save
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                // Save to database only (no localStorage)
                if (isAuthenticated) {
                    try {
                        await sessionService.updateSlideData(slidesToSave);

                    } catch (error) {
                        console.error("Error saving slides to database:", error);
                    }
                } else {

                }
            } catch (error) {
                console.error("Error in debounced save:", error);
            }
        }, 300); // 300ms debounce
    }, [isAuthenticated]);

    /**
     * Immediate save function for critical operations (database only)
     */
    const immediateSaveSlides = useCallback(async (slidesToSave: Slide[]) => {
        // Clear any pending debounced saves to prevent conflicts
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }

        try {
            // Save to database only (no localStorage)
            if (isAuthenticated) {
                try {
                    await sessionService.updateSlideData(slidesToSave);

                } catch (error) {
                    console.error("Error immediately saving slides to database:", error);
                }
            } else {

            }
        } catch (error) {
            console.error("Error in immediate save:", error);
        }
    }, [isAuthenticated]);

    /**
 * Load slides from database only (no localStorage fallback)
 */
    const loadSlides = useCallback(async () => {
        setIsLoading(true);
        try {
            let allTemplates: any[] = [];

            // Always try to load from database first

            try {
                const serverData = await sessionService.syncFromServer();
                if (serverData?.slideData && serverData.slideData.length > 0) {
                    allTemplates = serverData.slideData;

                } else {

                    allTemplates = [];
                }
            } catch (error) {
                console.error("Error loading slides from database:", error);

                allTemplates = [];
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

            // Create graph slide with API data source instead of sample data
            const currentYear = getCurrentYear();
            const graphSlide: GraphSlide = {
                id: "graph-1",
                name: `Team Wise Data ${currentYear}`,
                type: SLIDE_TYPES.GRAPH,
                dataSource: "api",
                duration: 10,
                active: true,
                data: {
                    title: `Team Wise Data ${currentYear}`,
                    description: "Current escalation distribution across teams by priority level",
                    graphType: "bar",
                    timeRange: "monthly",
                    lastUpdated: new Date().toISOString(),
                    categories: ["C-Level (Top Priority: fix immediately)", "P1 - Blocker (fix immediately)", "P2 - Critical (must fix)", "P3 - Major (really should fix)", "P4 - Minor (should fix)"],
                    data: []
                }
            };

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
            } else {
                // Update existing graph slide with new name and data
                finalSlides = finalSlides.map(slide => {
                    if (slide.type === SLIDE_TYPES.GRAPH) {
                        return {
                            ...slide,
                            name: `Team Wise Data ${currentYear}`,
                            data: {
                                ...slide.data,
                                title: `Team Wise Data ${currentYear}`,
                                description: "Current escalation distribution across teams by priority level",
                                graphType: "bar",
                                timeRange: "monthly",
                                lastUpdated: new Date().toISOString(),
                                categories: ["C-Level (Top Priority: fix immediately)", "P1 - Blocker (fix immediately)", "P2 - Critical (must fix)", "P3 - Major (really should fix)", "P4 - Minor (should fix)"],
                                data: slide.data?.data || []
                            }
                        };
                    }
                    return slide;
                });
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

    // Cross-device synchronization via polling with improved change detection (always active)
    useEffect(() => {
        let pollInterval: NodeJS.Timeout | null = null;

        const pollForUpdates = async () => {
            try {
                // Try to get latest slide data from database (works for both authenticated and unauthenticated)
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

                    // Don't override if we've made local changes in the last 10 seconds (increased protection)
                    const timeSinceLocalChange = currentTime - lastLocalChangeRef.current;
                    if (currentSlidesJson !== newSlidesJson &&
                        (currentTime - lastUpdateRef.current) > 2000 &&
                        timeSinceLocalChange > 10000 && // Increased from 5000ms to 10000ms
                        !isEditing) { // Skip syncing if user is editing

                        // Additional protection: Check if we're about to lose any local slides
                        const localSlideIds = new Set(slides.map(s => s.id));
                        const serverSlideIds = new Set(validSlides.map(s => s.id));

                        // If we have local slides that aren't on the server and are very recent, don't overwrite
                        const hasRecentLocalSlides = slides.some(slide =>
                            !serverSlideIds.has(slide.id) &&
                            timeSinceLocalChange < 15000 // Extra protection for very recent changes
                        );

                        if (hasRecentLocalSlides) {

                            return;
                        }


                        setSlides(validSlides);
                        lastUpdateRef.current = currentTime;
                        await debouncedSaveSlides(validSlides);
                    } else {

                    }
                }
            } catch (error) {
                // Silently handle errors for polling
                console.debug("Polling for slide updates:", error);
            }
        };

        // Always set up polling for cross-device slide updates

        pollInterval = setInterval(pollForUpdates, 15000); // Increased from 10000ms to 15000ms

        // Initial poll
        pollForUpdates();

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [debouncedSaveSlides, isEditing, slides]); // Added slides back to dependency array for proper change detection

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

        // Set the local change timestamp BEFORE updating state
        lastLocalChangeRef.current = Date.now();

        // Update local state immediately
        setSlides(updatedSlides);

        // Save to database with a small delay to ensure local state is stable
        setTimeout(async () => {
            try {
                await immediateSaveSlides(updatedSlides);

            } catch (error) {
                console.error("❌ Error saving new slide to database:", error);
            }
        }, 100);
    }, [slides, immediateSaveSlides]);

    /**
     * Update an existing slide
     */
    const updateSlide = useCallback(async (updatedSlide: Slide) => {
        const updatedSlides = slides.map(slide =>
            slide.id === updatedSlide.id ? updatedSlide : slide
        );

        // Set the local change timestamp BEFORE updating state
        lastLocalChangeRef.current = Date.now();

        // Update local state immediately
        setSlides(updatedSlides);

        // Save to database with a small delay to ensure local state is stable
        setTimeout(async () => {
            try {
                await immediateSaveSlides(updatedSlides);

            } catch (error) {
                console.error("❌ Error updating slide in database:", error);
            }
        }, 100);
    }, [slides, immediateSaveSlides]);

    /**
     * Delete a slide by ID
     */
    const deleteSlide = useCallback(async (id: string) => {


        const updatedSlides = slides.filter(slide => slide.id !== id);


        setSlides(updatedSlides);
        lastLocalChangeRef.current = Date.now();
        await immediateSaveSlides(updatedSlides);


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