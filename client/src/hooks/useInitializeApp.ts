/**
 * App Initialization Hook
 * 
 * Handles one-time app initialization including:
 * - Loading slides from database
 * - Loading display settings
 * - Initializing UI store
 * - Setting up default slides if needed
 * 
 * This hook should be called once in App.tsx or a top-level component.
 * 
 * Usage:
 * ```typescript
 * const { isInitialized, error } = useInitializeApp();
 * 
 * if (!isInitialized) return <Loading />;
 * if (error) return <Error message={error} />;
 * ```
 */

import { useState, useEffect } from "react";
import { useUIStore } from "../stores/useUIStore";
import { sessionService } from "../services/sessionService";
import { DEFAULT_SLIDE_CONFIGS } from "../config/defaultSlides";
import { Slide, SLIDE_TYPES, CurrentEscalationsSlide, TeamComparisonSlide, GraphSlide, EventSlide } from "../types";
import { logger } from "../utils/logger";

/**
 * Create default slides if none exist in database
 */
const createDefaultSlides = (): Slide[] => {
    const defaultSlides: Slide[] = [];

    logger.debug("Creating default slides from configs:", DEFAULT_SLIDE_CONFIGS);

    DEFAULT_SLIDE_CONFIGS.forEach((config) => {
        switch (config.type) {
            case "current-escalations":
                const currentEscalationsSlide: CurrentEscalationsSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.CURRENT_ESCALATIONS,
                    active: config.active,
                    duration: config.duration || 10,
                    dataSource: "api",
                    data: {
                        escalations: []
                    }
                };
                defaultSlides.push(currentEscalationsSlide);
                break;

            case "comparison-slide":
                const teamComparisonSlide: TeamComparisonSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.TEAM_COMPARISON,
                    active: config.active,
                    duration: config.duration || 15,
                    dataSource: "api",
                    data: {
                        teams: [],
                        lastUpdated: new Date().toISOString()
                    }
                };
                defaultSlides.push(teamComparisonSlide);
                break;

            case "graph-slide":
                const graphSlide: GraphSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.GRAPH,
                    active: config.active,
                    duration: config.duration || 12,
                    dataSource: "api",
                    data: {
                        title: "Team Wise Data",
                        description: "Performance metrics by team",
                        graphType: "bar",
                        data: [],
                        timeRange: "daily",
                        lastUpdated: new Date().toISOString(),
                        categories: []
                    }
                };
                defaultSlides.push(graphSlide);
                break;

            case "event":
                const eventSlide: EventSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.EVENT,
                    active: config.active,
                    duration: config.duration || 8,
                    dataSource: "api",
                    data: {
                        title: config.name,
                        description: "",
                        date: new Date().toISOString(),
                        eventType: config.name.toLowerCase().includes("birthday") ? "birthday" : "anniversary",
                        employees: [],
                        hasEvents: false
                    }
                };
                defaultSlides.push(eventSlide);
                break;
        }
    });

    logger.debug("Created default slides:", {
        totalSlides: defaultSlides.length,
        eventSlides: defaultSlides.filter((s) => s.type === SLIDE_TYPES.EVENT).length,
        slideDetails: defaultSlides.map((s) => ({ id: s.id, name: s.name, type: s.type, active: s.active }))
    });

    return defaultSlides;
};

/**
 * Hook to initialize the application
 * Loads data from database and sets up UI store
 */
export const useInitializeApp = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setSlides = useUIStore((state) => state.setSlides);
    const setDisplaySettings = useUIStore((state) => state.updateDisplaySettings);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                logger.info("🚀 Initializing application...");

                // Load data from database
                const slideshowData = await sessionService.loadSlideshowData();

                if (slideshowData) {
                    logger.success("Loaded data from database:", {
                        slidesCount: slideshowData.slides?.length || 0,
                        hasSettings: !!slideshowData.displaySettings
                    });

                    // Set slides (use database data or defaults)
                    const slides = slideshowData.slides && slideshowData.slides.length > 0
                        ? slideshowData.slides
                        : createDefaultSlides();

                    setSlides(slides);

                    // Set display settings if available
                    if (slideshowData.displaySettings) {
                        await setDisplaySettings(slideshowData.displaySettings);
                    }

                    // Update internal hash for change tracking
                    useUIStore.setState({
                        _lastSavedStateHash: JSON.stringify({ slides })
                    });
                } else {
                    logger.warn("No saved data found, using defaults");

                    // Use default slides
                    const defaultSlides = createDefaultSlides();
                    setSlides(defaultSlides);

                    useUIStore.setState({
                        _lastSavedStateHash: JSON.stringify({ slides: defaultSlides })
                    });
                }

                setIsInitialized(true);
                logger.success("✅ Application initialized successfully");
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error("❌ Failed to initialize app:", err);
                setError(errorMessage);

                // Use defaults on error
                const defaultSlides = createDefaultSlides();
                setSlides(defaultSlides);
                setIsInitialized(true); // Allow app to load with defaults
            }
        };

        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    return {
        isInitialized,
        error
    };
};

/**
 * TODO: Future enhancements
 * 
 * 1. Add retry logic for failed initialization
 * 2. Add offline detection and offline mode
 * 3. Add migration logic for old data formats
 * 4. Add progressive loading (show UI while loading data)
 */

