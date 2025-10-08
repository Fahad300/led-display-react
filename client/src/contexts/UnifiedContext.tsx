/**
 * UNIFIED CONTEXT - Database-backed state management
 * Simple, reliable persistence with proper error handling
 * 
 * REFACTORED: Now uses React Query for optimized data fetching and caching
 * instead of manual polling. See useDashboardData hook for implementation.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Slide, Employee, GraphSlideData, SlideshowData, SLIDE_TYPES, CurrentEscalationsSlide, TeamComparisonSlide, GraphSlide, EventSlide } from '../types';
import { sessionService } from '../services/sessionService';
import { DEFAULT_SLIDE_CONFIGS } from '../config/defaultSlides';
import { useDashboardData } from '../hooks/useDashboardData';
import { dispatchSlidesChange, dispatchApiDataChange } from '../utils/realtimeSync';
import { logger } from '../utils/logger';

interface UnifiedContextType {
    // Slides
    slides: Slide[];
    setSlides: (slides: Slide[] | ((prev: Slide[]) => Slide[])) => void;
    updateSlide: (slide: Slide) => void;
    reorderSlides: (slides: Slide[]) => void;

    // Display Settings - Now handled by SettingsContext
    // displaySettings and updateDisplaySettings removed

    // Data
    employees: Employee[];
    graphData: GraphSlideData | null;
    escalations: any[];

    // Loading states
    isLoading: boolean;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;

    // Page detection
    isDisplayPage: boolean;

    // API Polling state (maintained for backward compatibility)
    apiPollingState: {
        isPolling: boolean;
        lastApiCheck: Date | null;
        lastDataHash: string;
        hasApiChanges: boolean;
        pollingInProgress: boolean;
    };

    // Actions
    saveToDatabase: (slidesToSave?: Slide[]) => Promise<void>;
    syncFromDatabase: () => Promise<void>;
    refreshApiData: () => Promise<void>; // Triggers React Query refetch
    syncToRemoteDisplays: () => Promise<void>;
    forceApiCheck: () => Promise<void>; // Backward compatibility wrapper for React Query refetch
    clearApiCache: () => void; // Backward compatibility wrapper for React Query cache invalidation
    startApiPolling: () => void; // No-op for backward compatibility
    stopApiPolling: () => void; // No-op for backward compatibility
    forceMigrateVideoUrls: () => void;
    hasUnsavedChanges: () => boolean;
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Helper function to migrate video URLs to serverUrl format
const migrateVideoUrls = (slides: Slide[]): Slide[] => {
    return slides.map(slide => {
        if (slide.type === SLIDE_TYPES.VIDEO && slide.data.videoUrl) {
            const videoSlide = slide as any;
            let needsMigration = false;
            let fileId = '';

            // Check if URL has port 3000 and needs to be changed to port 5000
            if (videoSlide.data.videoUrl.includes('localhost:3000/api/files/')) {
                fileId = videoSlide.data.videoUrl.split('/api/files/')[1];
                needsMigration = true;
            }
            // Check if URL is in old database format with server subpath
            else if (videoSlide.data.videoUrl.includes('/api/files/server/')) {
                fileId = videoSlide.data.videoUrl.split('/api/files/server/')[1];
                needsMigration = true;
            }

            if (needsMigration && fileId) {
                logger.sync("Migrating video URL to serverUrl format:", {
                    oldUrl: videoSlide.data.videoUrl,
                    fileId: fileId
                });
                // Always hardcode port 5000 to ensure correct server URL
                const serverUrl = `http://localhost:5000/api/files/${fileId}`;
                videoSlide.data.videoUrl = serverUrl;
            }
        }
        return slide;
    });
};

// Function to create default slides
const createDefaultSlides = (): Slide[] => {
    const defaultSlides: Slide[] = [];

    logger.debug("Creating default slides from configs:", DEFAULT_SLIDE_CONFIGS);

    DEFAULT_SLIDE_CONFIGS.forEach(config => {
        switch (config.type) {
            case 'current-escalations':
                const currentEscalationsSlide: CurrentEscalationsSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.CURRENT_ESCALATIONS,
                    active: config.active,
                    duration: config.duration || 10,
                    dataSource: 'api',
                    data: {
                        escalations: [] // Empty array - data comes from API
                    }
                };
                defaultSlides.push(currentEscalationsSlide);
                break;

            case 'comparison-slide':
                const teamComparisonSlide: TeamComparisonSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.TEAM_COMPARISON,
                    active: config.active,
                    duration: config.duration || 15,
                    dataSource: 'api',
                    data: {
                        teams: [],
                        lastUpdated: new Date().toISOString()
                    }
                };
                defaultSlides.push(teamComparisonSlide);
                break;

            case 'graph-slide':
                const graphSlide: GraphSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.GRAPH,
                    active: config.active,
                    duration: config.duration || 12,
                    dataSource: 'api',
                    data: {
                        title: "Team Wise Data",
                        description: "Performance metrics by team",
                        graphType: 'bar',
                        data: [],
                        timeRange: 'daily',
                        lastUpdated: new Date().toISOString(),
                        categories: []
                    }
                };
                defaultSlides.push(graphSlide);
                break;

            case 'event':
                logger.debug("Processing event config:", config);
                const eventSlide: EventSlide = {
                    id: config.id,
                    name: config.name,
                    type: SLIDE_TYPES.EVENT,
                    active: config.active,
                    duration: config.duration || 8,
                    dataSource: 'api',
                    data: {
                        title: config.name,
                        description: "",
                        date: new Date().toISOString(),
                        eventType: config.name.toLowerCase().includes('birthday') ? 'birthday' : 'anniversary',
                        employees: [],
                        hasEvents: false
                    }
                };
                defaultSlides.push(eventSlide);
                logger.debug("Created event slide:", eventSlide);
                break;
        }
    });

    logger.debug("Created default slides:", {
        totalSlides: defaultSlides.length,
        eventSlides: defaultSlides.filter(s => s.type === SLIDE_TYPES.EVENT).length,
        slideDetails: defaultSlides.map(s => ({ id: s.id, name: s.name, type: s.type, active: s.active }))
    });

    return defaultSlides;
};

interface UnifiedProviderProps {
    children: ReactNode;
}

export const UnifiedProvider: React.FC<UnifiedProviderProps> = ({ children }) => {
    // React Query hook for optimized dashboard data fetching
    const {
        data: dashboardData,
        isLoading: isDashboardLoading,
        refetch: refetchDashboard,
        dataUpdatedAt,
        isFetching
    } = useDashboardData();

    // State
    const [slides, setSlides] = useState<Slide[]>([]);
    // Display settings now handled by SettingsContext
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [graphData, setGraphData] = useState<GraphSlideData | null>(null);
    const [escalations, setEscalations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // API Polling state (maintained for backward compatibility, now derived from React Query)
    const [apiPollingState, setApiPollingState] = useState({
        isPolling: true, // React Query is always "polling" via refetchInterval
        lastApiCheck: null as Date | null,
        lastDataHash: "",
        hasApiChanges: false,
        pollingInProgress: false
    });

    // Track last saved state to prevent unnecessary saves
    const lastSavedStateRef = useRef<string>("");

    // Check if we're on the display page
    const isDisplayPage = useMemo(() => {
        return window.location.pathname === '/display' || window.location.pathname === '/display/';
    }, []);

    /**
     * Sync React Query dashboard data to local state
     * This effect updates employees, graphData, and escalations when dashboard data changes
     */
    useEffect(() => {
        if (dashboardData) {
            logger.data("UnifiedContext: Dashboard data received from React Query", {
                employeesCount: dashboardData.employees?.length || 0,
                hasGraphData: !!dashboardData.graphData,
                escalationsCount: dashboardData.escalations?.length || 0
            });

            // Update local state with fresh data
            setEmployees(dashboardData.employees || []);
            setGraphData(dashboardData.graphData || null);
            setEscalations(dashboardData.escalations || []);

            // Update polling state for backward compatibility
            setApiPollingState(prev => ({
                ...prev,
                lastApiCheck: new Date(dataUpdatedAt),
                pollingInProgress: isFetching,
                hasApiChanges: true
            }));

            // Dispatch real-time sync event for other components
            dispatchApiDataChange(
                dashboardData.employees || [],
                dashboardData.graphData || null,
                dashboardData.escalations || [],
                ['react-query-data-updated'],
                'api'
            );
        }
    }, [dashboardData, dataUpdatedAt, isFetching]);

    // Helper functions for event detection
    const isBirthdayToday = useCallback((employee: Employee): boolean => {
        return employee.isBirthday === true;
    }, []);

    const isAnniversaryToday = useCallback((employee: Employee): boolean => {
        return employee.isAnniversary === true;
    }, []);

    // Update event slides with current employee data - simple and robust
    useEffect(() => {
        // Always update event slides, even when employees array is empty
        // This ensures stale data is cleared when API returns empty data
        const birthdayEmployees = employees.filter(employee => isBirthdayToday(employee));
        const anniversaryEmployees = employees.filter(employee => isAnniversaryToday(employee));

        logger.sync("UnifiedContext: Updating event slides with current data", {
            totalEmployees: employees.length,
            birthdayCount: birthdayEmployees.length,
            anniversaryCount: anniversaryEmployees.length,
            birthdayNames: birthdayEmployees.map(e => e.name),
            anniversaryNames: anniversaryEmployees.map(e => e.name),
            dataSource: employees.length === 0 ? "API_RETURNED_EMPTY" : "API_HAS_DATA"
        });

        setSlides(prevSlides => {
            return prevSlides.map(slide => {
                if (slide.type === SLIDE_TYPES.EVENT) {
                    const eventSlide = slide as EventSlide;

                    // Birthday slide
                    if (eventSlide.data.eventType === "birthday" || slide.name.toLowerCase().includes('birthday')) {
                        const hasEvents = birthdayEmployees.length > 0;

                        // Auto-disable if no events and currently active
                        const shouldBeActive = hasEvents ? slide.active : false;

                        return {
                            ...slide,
                            active: shouldBeActive,
                            data: {
                                ...eventSlide.data,
                                employees: birthdayEmployees,
                                hasEvents: hasEvents,
                                eventCount: birthdayEmployees.length
                            }
                        };
                    }

                    // Anniversary slide
                    if (eventSlide.data.eventType === "anniversary" || slide.name.toLowerCase().includes('anniversary')) {
                        const hasEvents = anniversaryEmployees.length > 0;

                        // Auto-disable if no events and currently active
                        const shouldBeActive = hasEvents ? slide.active : false;

                        return {
                            ...slide,
                            active: shouldBeActive,
                            data: {
                                ...eventSlide.data,
                                employees: anniversaryEmployees,
                                hasEvents: hasEvents,
                                eventCount: anniversaryEmployees.length
                            }
                        };
                    }
                }
                return slide;
            });
        });
    }, [employees, isBirthdayToday, isAnniversaryToday]);

    // Sync to remote displays
    const syncToRemoteDisplays = useCallback(async () => {
        try {
            logger.sync("Syncing to remote displays...");
            await sessionService.triggerRemoteRefresh("all");
            logger.success("Remote displays synced successfully");
        } catch (error) {
            logger.error("Error syncing to remote displays:", error);
            throw error;
        }
    }, []);

    // Save to database with proper error handling
    const saveToDatabase = useCallback(async (slidesToSave?: Slide[]) => {
        try {
            // Use provided slides or current state
            const slidesToUse = slidesToSave || slides;

            // Load current settings from localStorage to avoid overwriting user settings
            let currentSettings = {
                swiperEffect: "slide",
                showDateStamp: true,
                hidePagination: false,
                hideArrows: false,
                hidePersiviaLogo: false,
                developmentMode: false
            };

            try {
                const savedSettings = localStorage.getItem('displaySettings');
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    currentSettings = { ...currentSettings, ...parsed };
                    logger.debug("UnifiedContext: Using settings from localStorage:", currentSettings);
                } else {
                    logger.debug("UnifiedContext: No settings in localStorage, using defaults");
                }
            } catch (error) {
                logger.warn("Failed to load settings from localStorage, using defaults:", error);
            }

            const slideshowData: SlideshowData = {
                slides: slidesToUse,
                displaySettings: currentSettings, // Use actual settings from localStorage
                lastUpdated: new Date().toISOString(),
                version: "1.0.0"
            };

            await sessionService.saveSlideshowData(slideshowData);

            // Dispatch real-time sync event to all DisplayPages immediately
            dispatchSlidesChange(slidesToUse, ['slides-saved-to-database'], 'homepage');

            // Trigger remote display refresh after saving to database
            try {
                logger.sync("UnifiedContext: Triggering remote display refresh...");
                await syncToRemoteDisplays();
                logger.success("UnifiedContext: Remote display refresh completed");
            } catch (refreshError) {
                logger.warn("UnifiedContext: Remote display refresh failed:", refreshError);
                // Don't throw error here as the main save was successful
            }

            // Update the last saved state to prevent unnecessary saves
            lastSavedStateRef.current = JSON.stringify({ slides: slidesToUse });
            logger.success("UnifiedContext: Data saved to database successfully with settings:", currentSettings);
        } catch (error) {
            logger.error("Error saving data to database:", error);
            throw error; // Re-throw so calling code can handle it
        }
    }, [slides, syncToRemoteDisplays]);


    /**
     * Refresh API data using React Query
     * This triggers a refetch of dashboard data from the server
     */
    const refreshApiData = useCallback(async () => {
        try {
            logger.api("Refreshing API data via React Query...");
            await refetchDashboard();
            logger.success("API data refreshed successfully via React Query");
        } catch (error) {
            logger.error("Error refreshing API data:", error);
        }
    }, [refetchDashboard]);

    // Sync data from database (for DisplayPage - only updates if data is newer)
    const syncFromDatabase = useCallback(async () => {
        try {
            logger.sync("Syncing data from database...");
            const slideshowData = await sessionService.loadSlideshowData();

            if (slideshowData) {
                // Only update if we have slides and the data is different
                if (slideshowData.slides && slideshowData.slides.length > 0) {
                    setSlides(prevSlides => {
                        // Check if the data is actually different using a more efficient comparison
                        const prevSlidesHash = JSON.stringify(prevSlides.map(s => ({
                            id: s.id,
                            name: s.name,
                            type: s.type,
                            active: s.active,
                            duration: s.duration,
                            data: s.data
                        })));

                        const newSlidesHash = JSON.stringify(slideshowData.slides.map(s => ({
                            id: s.id,
                            name: s.name,
                            type: s.type,
                            active: s.active,
                            duration: s.duration,
                            data: s.data
                        })));

                        if (prevSlidesHash !== newSlidesHash) {
                            logger.sync("UnifiedContext: Data changed, updating slides");
                            logger.debug("UnifiedContext: Previous slides count:", prevSlides.length);
                            logger.debug("UnifiedContext: New slides count:", slideshowData.slides.length);
                            logger.debug("UnifiedContext: New slides active count:", slideshowData.slides.filter(s => s.active).length);

                            // Apply URL migration to loaded slides
                            const migratedSlides = migrateVideoUrls(slideshowData.slides);

                            // Dispatch custom event for slides change
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('slidesChanged', {
                                    detail: {
                                        slidesCount: migratedSlides.length,
                                        activeSlidesCount: migratedSlides.filter(s => s.active).length,
                                        slides: migratedSlides
                                    }
                                }));
                            }, 100);

                            return migratedSlides;
                        } else {
                            logger.debug("UnifiedContext: No changes detected, keeping existing slides");
                        }
                        return prevSlides;
                    });
                } else {
                    logger.debug("UnifiedContext: No slides found in database data");
                }
            } else {
                logger.debug("UnifiedContext: No slideshow data found in database");
            }
        } catch (error) {
            logger.error("Error syncing data from database:", error);
        }
    }, []);

    // Update slide with immediate save for critical changes (only on non-display pages)
    const updateSlide = useCallback((updatedSlide: Slide) => {
        setSlides(prev => {
            const updatedSlides = prev.map(slide =>
                slide.id === updatedSlide.id ? updatedSlide : slide
            );

            // Dispatch real-time sync event for immediate DisplayPage updates
            if (!isDisplayPage) {
                const changes = [`Slide ${updatedSlide.name} updated`];
                if (updatedSlide.active !== undefined) {
                    changes.push(`Slide ${updatedSlide.active ? 'activated' : 'deactivated'}`);
                }

                // Dispatch slides change event for real-time sync
                dispatchSlidesChange(updatedSlides, changes, 'homepage');
                logger.debug("UnifiedContext: Dispatched real-time sync for slide update");
            }

            return updatedSlides;
        });

        // Immediate save for critical changes (active status, order changes) - only on non-display pages
        if (updatedSlide.active !== undefined && !isDisplayPage) {
            logger.sync("Critical change detected, saving immediately...");
            setTimeout(() => {
                saveToDatabase().catch(error => {
                    logger.error("Immediate save failed:", error);
                });
            }, 100); // Very short delay for critical changes
        }
    }, [saveToDatabase, isDisplayPage]);

    // Reorder slides with immediate save (only on non-display pages)
    const reorderSlides = useCallback((reorderedSlides: Slide[]) => {
        setSlides(reorderedSlides);

        // Dispatch real-time sync event for immediate DisplayPage updates
        if (!isDisplayPage) {
            const changes = ['Slides reordered'];

            // Dispatch slides change event for real-time sync
            dispatchSlidesChange(reorderedSlides, changes, 'homepage');
            logger.debug("UnifiedContext: Dispatched real-time sync for slide reorder");

            logger.sync("Reorder detected, saving immediately...");
            setTimeout(() => {
                saveToDatabase().catch(error => {
                    logger.error("Immediate save failed:", error);
                });
            }, 100); // Very short delay for reorder changes
        }
    }, [saveToDatabase, isDisplayPage]);

    // Display settings now handled by SettingsContext

    // Auto-save when data changes (less aggressive, only for critical changes)
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Only auto-save when not editing, not on display page, and we have slides
        if (slides.length > 0 && !isEditing && !isDisplayPage) {
            // Create a hash of current state to detect actual changes
            const currentState = JSON.stringify({ slides });
            const hasChanges = currentState !== lastSavedStateRef.current;

            if (hasChanges) {
                // Only auto-save for critical changes (active status, order changes)
                const hasCriticalChanges = slides.some(slide => {
                    const prevSlide = JSON.parse(lastSavedStateRef.current || '{}').slides?.find((s: any) => s.id === slide.id);
                    return prevSlide && (
                        prevSlide.active !== slide.active ||
                        prevSlide.duration !== slide.duration
                    );
                });

                if (hasCriticalChanges) {
                    logger.sync("UnifiedContext: Critical changes detected, auto-saving...");
                    saveTimeoutRef.current = setTimeout(() => {
                        saveToDatabase().catch(error => {
                            logger.error("Auto-save failed:", error);
                        });
                    }, 5000); // 5 second debounce for critical changes only
                } else {
                    logger.debug("UnifiedContext: Non-critical changes detected, skipping auto-save");
                }
            }
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [slides, saveToDatabase, isEditing, isDisplayPage]);

    /**
     * Listen for data changes from other sources (e.g., realtime sync)
     * NOTE: API polling is now handled by React Query, this is only for
     * backward compatibility with realtime sync events
     */
    useEffect(() => {
        const handleDataChange = (e: CustomEvent) => {
            logger.sync("UnifiedContext: Data change event received from realtime sync");
            const { data, source } = e.detail;

            // Only handle non-API sources (API data is now handled by React Query)
            if (source !== 'api' && data && data.slides && data.slides.length > 0) {
                setSlides(prevSlides => {
                    // Check if the data is actually different
                    const prevSlidesHash = JSON.stringify(prevSlides.map(s => ({
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        active: s.active,
                        duration: s.duration,
                        data: s.data
                    })));

                    const newSlidesHash = JSON.stringify(data.slides.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        active: s.active,
                        duration: s.duration,
                        data: s.data
                    })));

                    if (prevSlidesHash !== newSlidesHash) {
                        logger.sync("UnifiedContext: Realtime sync data changed, updating slides");
                        return data.slides;
                    } else {
                        logger.debug("UnifiedContext: Realtime sync data unchanged, keeping existing slides");
                    }
                    return prevSlides;
                });
            }
        };

        window.addEventListener('dataChanged', handleDataChange as EventListener);
        return () => {
            window.removeEventListener('dataChanged', handleDataChange as EventListener);
        };
    }, []);

    /**
     * NOTE: API Polling integration removed - now handled by React Query
     * The useDashboardData hook automatically fetches and caches data,
     * eliminating the need for manual polling setup
     * 
     * TODO: Consider migrating to WebSocket or Server-Sent Events for
     * true real-time updates instead of polling (current refetchInterval: 60s)
     */

    /**
     * Force API check - now triggers React Query refetch
     * Backward compatibility wrapper
     */
    const handleForceApiCheck = useCallback(async () => {
        try {
            logger.api("UnifiedContext: Forcing API check via React Query refetch...");
            await refetchDashboard();
            logger.success("Forced API check completed");
        } catch (error) {
            logger.error("Error forcing API check:", error);
        }
    }, [refetchDashboard]);

    /**
     * Start API polling - no-op for backward compatibility
     * React Query handles polling automatically via refetchInterval
     */
    const handleStartApiPolling = useCallback(() => {
        logger.debug("UnifiedContext: startApiPolling called (no-op - React Query handles polling)");
        // No-op: React Query automatically polls via refetchInterval
    }, []);

    /**
     * Stop API polling - no-op for backward compatibility
     * React Query handles polling automatically
     */
    const handleStopApiPolling = useCallback(() => {
        logger.debug("UnifiedContext: stopApiPolling called (no-op - React Query handles polling)");
        // No-op: React Query polling cannot be dynamically stopped in this implementation
        // If needed, we could expose queryClient.cancelQueries() here
    }, []);

    /**
     * Clear API cache - uses React Query cache invalidation
     * Backward compatibility wrapper
     */
    const handleClearApiCache = useCallback(() => {
        logger.api("UnifiedContext: Clearing API cache via React Query...");
        // Trigger immediate refetch which will get fresh data
        refetchDashboard();
        logger.success("API cache cleared and refetching");
    }, [refetchDashboard]);

    // Force migrate video URLs function
    const forceMigrateVideoUrls = useCallback(() => {
        logger.sync("UnifiedContext: Force migrating video URLs...");
        setSlides(prevSlides => {
            const migratedSlides = migrateVideoUrls(prevSlides);
            logger.success("UnifiedContext: Video URL migration completed");
            return migratedSlides;
        });
    }, []);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useCallback(() => {
        const currentState = JSON.stringify({ slides });
        const hasChanges = currentState !== lastSavedStateRef.current;
        logger.debug("UnifiedContext: Checking for unsaved changes:", {
            hasChanges,
            currentStateHash: currentState.substring(0, 50) + "...",
            lastSavedHash: lastSavedStateRef.current.substring(0, 50) + "..."
        });
        return hasChanges;
    }, [slides]);

    // Load data on mount - ensure data is loaded before rendering
    useEffect(() => {
        const initializeData = async () => {
            try {
                logger.sync("UnifiedContext: Initializing data...");
                logger.debug("UnifiedContext: isDisplayPage =", isDisplayPage);

                // Display settings now handled by SettingsContext

                // Attempt to load saved data from database FIRST
                setIsLoading(true);
                logger.sync("UnifiedContext: Attempting to load saved data from database...");
                const slideshowData = await sessionService.loadSlideshowData();

                if (slideshowData) {
                    logger.data("Loaded slideshow data from database:", {
                        slidesCount: slideshowData.slides?.length || 0,
                        loadedSlidesDetails: slideshowData.slides?.map(s => ({ id: s.id, name: s.name, active: s.active, type: s.type })),
                        displaySettings: slideshowData.displaySettings
                    });

                    // Smart merge: Use database data if available, but ensure we have event slides
                    let finalSlides = slideshowData.slides && slideshowData.slides.length > 0
                        ? slideshowData.slides
                        : createDefaultSlides();

                    // Migrate old video URLs to use serverUrl format if they exist
                    finalSlides = migrateVideoUrls(finalSlides);

                    // Check if we have event slides in the final slides array
                    const hasEventSlides = finalSlides.some(s => s.type === SLIDE_TYPES.EVENT);
                    logger.debug("Final slides has event slides:", hasEventSlides);

                    // If we don't have event slides, add them (avoiding duplicates)
                    if (!hasEventSlides) {
                        logger.debug("Adding missing event slides to final slides");
                        const defaultSlides = createDefaultSlides();
                        const eventSlides = defaultSlides.filter(s => s.type === SLIDE_TYPES.EVENT);
                        finalSlides = [...finalSlides, ...eventSlides];
                        logger.debug("Added event slides:", eventSlides.map(s => ({ id: s.id, name: s.name, type: s.type })));
                    } else {
                        // Check for duplicate event slides and remove them
                        const eventSlideIds = new Set<string>();
                        const eventSlideNames = new Set<string>();
                        const uniqueSlides = finalSlides.filter(slide => {
                            if (slide.type === SLIDE_TYPES.EVENT) {
                                // Check for duplicate by ID
                                if (eventSlideIds.has(slide.id)) {
                                    logger.debug("Removing duplicate event slide by ID:", slide.id, slide.name);
                                    return false;
                                }
                                // Check for duplicate by name (in case IDs are different but names are same)
                                if (eventSlideNames.has(slide.name)) {
                                    logger.debug("Removing duplicate event slide by name:", slide.id, slide.name);
                                    return false;
                                }
                                eventSlideIds.add(slide.id);
                                eventSlideNames.add(slide.name);
                            }
                            return true;
                        });

                        if (uniqueSlides.length !== finalSlides.length) {
                            logger.debug("Removed duplicate event slides, final count:", uniqueSlides.length);
                            finalSlides = uniqueSlides;
                        }
                    }

                    logger.sync("UnifiedContext: Setting slides from database:", {
                        finalSlidesCount: finalSlides.length,
                        activeSlidesCount: finalSlides.filter(s => s.active).length,
                        finalSlidesDetails: finalSlides.map(s => ({ id: s.id, name: s.name, active: s.active, type: s.type }))
                    });

                    setSlides(finalSlides);
                    lastSavedStateRef.current = JSON.stringify({ slides: finalSlides });

                    // Settings are handled by SettingsContext, so we don't need to do anything with them here
                    logger.success("UnifiedContext: Smart merge applied:", {
                        slidesSource: slideshowData.slides && slideshowData.slides.length > 0 ? 'database' : 'defaults',
                        settingsHandledBy: 'SettingsContext'
                    });
                } else {
                    logger.debug("No saved data found in database. Using defaults...");
                    // No database data, use defaults
                    const defaultSlides = createDefaultSlides();
                    setSlides(defaultSlides);
                    lastSavedStateRef.current = JSON.stringify({ slides: defaultSlides });
                }

                // Load API data only once on mount
                logger.sync("UnifiedContext: Loading API data...");
                await refreshApiData();

                logger.success("UnifiedContext: Initial data loading complete.");
            } catch (error) {
                logger.error("UnifiedContext: Failed to initialize data:", error);
                // Ensure default slides are set even on error
                const defaultSlides = createDefaultSlides();
                setSlides(defaultSlides);
                lastSavedStateRef.current = JSON.stringify({ slides: defaultSlides });
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();

        // NOTE: API polling initialization removed - React Query handles this automatically
        // The useDashboardData hook polls every 60 seconds via refetchInterval
    }, [refreshApiData, isDisplayPage]); // Run only once on mount - intentionally omitting slides and isLoading to prevent infinite loops

    /**
     * NOTE: Periodic API refresh removed - React Query handles this automatically
     * The useDashboardData hook already polls every 60 seconds, which is more frequent
     * than the old 8-hour refresh interval
     */

    // Save data before page unload (only on non-display pages)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (slides.length > 0 && !isDisplayPage) {
                // Use synchronous save for beforeunload
                saveToDatabase().catch(error => {
                    logger.error("Save on unload failed:", error);
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [slides, saveToDatabase, isDisplayPage]);

    const value: UnifiedContextType = {
        slides,
        setSlides,
        updateSlide,
        reorderSlides,
        // displaySettings and updateDisplaySettings removed - now handled by SettingsContext
        employees,
        graphData,
        escalations,
        isLoading: isLoading || isDashboardLoading, // Combine both loading states
        isEditing,
        setIsEditing,
        isDisplayPage,
        apiPollingState,
        saveToDatabase,
        syncFromDatabase,
        refreshApiData,
        syncToRemoteDisplays,
        forceApiCheck: handleForceApiCheck,
        clearApiCache: handleClearApiCache,
        startApiPolling: handleStartApiPolling,
        stopApiPolling: handleStopApiPolling,
        forceMigrateVideoUrls,
        hasUnsavedChanges
    };

    return (
        <UnifiedContext.Provider value={value}>
            {children}
        </UnifiedContext.Provider>
    );
};

export const useUnified = (): UnifiedContextType => {
    const context = useContext(UnifiedContext);
    if (context === undefined) {
        throw new Error('useUnified must be used within a UnifiedProvider');
    }
    return context;
};
