/**
 * UNIFIED CONTEXT - Database-backed state management
 * Simple, reliable persistence with proper error handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Slide, Employee, GraphSlideData, SlideshowData, SLIDE_TYPES, CurrentEscalationsSlide, TeamComparisonSlide, GraphSlide, EventSlide } from '../types';
import { sessionService } from '../services/sessionService';
import { fetchEmployeesData } from '../services/eventsService';
import { fetchTeamWiseData } from '../services/graphService';
import { DEFAULT_SLIDE_CONFIGS } from '../config/defaultSlides';
import {
    addDataChangeListener,
    addPollingStateListener,
    clearApiCache,
    forceApiCheck,
    startApiPolling,
    stopApiPolling,
    initializeApiPolling
} from '../services/api';
import { dispatchSlidesChange, dispatchApiDataChange } from '../utils/realtimeSync';

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

    // API Polling state
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
    refreshApiData: () => Promise<void>;
    syncToRemoteDisplays: () => Promise<void>;
    forceApiCheck: () => Promise<void>;
    clearApiCache: () => void;
    startApiPolling: () => void;
    stopApiPolling: () => void;
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
                console.log("🔄 Migrating video URL to serverUrl format:", {
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

    console.log("🔧 Creating default slides from configs:", DEFAULT_SLIDE_CONFIGS);

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
                console.log("🔧 Processing event config:", config);
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
                console.log("🔧 Created event slide:", eventSlide);
                break;
        }
    });

    console.log("🔧 Created default slides:", {
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
    // State
    const [slides, setSlides] = useState<Slide[]>([]);
    // Display settings now handled by SettingsContext
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [graphData, setGraphData] = useState<GraphSlideData | null>(null);
    const [escalations, setEscalations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // API Polling state
    const [apiPollingState, setApiPollingState] = useState({
        isPolling: false,
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

        console.log("🔄 UnifiedContext: Updating event slides with current data", {
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
            console.log("🔄 Syncing to remote displays...");
            await sessionService.triggerRemoteRefresh("all");
            console.log("✅ Remote displays synced successfully");
        } catch (error) {
            console.error("❌ Error syncing to remote displays:", error);
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
                    console.log("🔄 UnifiedContext: Using settings from localStorage:", currentSettings);
                } else {
                    console.log("🔄 UnifiedContext: No settings in localStorage, using defaults");
                }
            } catch (error) {
                console.warn("Failed to load settings from localStorage, using defaults:", error);
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
                console.log("🔄 UnifiedContext: Triggering remote display refresh...");
                await syncToRemoteDisplays();
                console.log("✅ UnifiedContext: Remote display refresh completed");
            } catch (refreshError) {
                console.warn("⚠️ UnifiedContext: Remote display refresh failed:", refreshError);
                // Don't throw error here as the main save was successful
            }

            // Update the last saved state to prevent unnecessary saves
            lastSavedStateRef.current = JSON.stringify({ slides: slidesToUse });
            console.log("✅ UnifiedContext: Data saved to database successfully with settings:", currentSettings);
        } catch (error) {
            console.error("❌ Error saving data to database:", error);
            throw error; // Re-throw so calling code can handle it
        }
    }, [slides, syncToRemoteDisplays]);


    // Refresh API data (employees and graph data)
    const refreshApiData = useCallback(async () => {
        try {
            console.log("🔄 Refreshing API data (employees and graph data)...");
            const [employeesData, graphDataResult] = await Promise.all([
                fetchEmployeesData(),
                fetchTeamWiseData().catch(() => null)
            ]);

            console.log("📊 Employees data received:", {
                totalEmployees: employeesData.length,
                anniversaryEmployees: employeesData.filter(e => e.isAnniversary).length,
                birthdayEmployees: employeesData.filter(e => e.isBirthday).length,
                anniversaryNames: employeesData.filter(e => e.isAnniversary).map(e => e.name),
                birthdayNames: employeesData.filter(e => e.isBirthday).map(e => e.name)
            });

            setEmployees(employeesData);
            setGraphData(graphDataResult);
            console.log("✅ API data refreshed successfully");
        } catch (error) {
            console.error("❌ Error refreshing API data:", error);
        }
    }, []);

    // Sync data from database (for DisplayPage - only updates if data is newer)
    const syncFromDatabase = useCallback(async () => {
        try {
            console.log("🔄 Syncing data from database...");
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
                            console.log("📥 UnifiedContext: Data changed, updating slides");
                            console.log("📥 UnifiedContext: Previous slides count:", prevSlides.length);
                            console.log("📥 UnifiedContext: New slides count:", slideshowData.slides.length);
                            console.log("📥 UnifiedContext: New slides active count:", slideshowData.slides.filter(s => s.active).length);

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
                            console.log("📥 UnifiedContext: No changes detected, keeping existing slides");
                        }
                        return prevSlides;
                    });
                } else {
                    console.log("📥 UnifiedContext: No slides found in database data");
                }
            } else {
                console.log("📥 UnifiedContext: No slideshow data found in database");
            }
        } catch (error) {
            console.error("❌ Error syncing data from database:", error);
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
                console.log("📡 UnifiedContext: Dispatched real-time sync for slide update");
            }

            return updatedSlides;
        });

        // Immediate save for critical changes (active status, order changes) - only on non-display pages
        if (updatedSlide.active !== undefined && !isDisplayPage) {
            console.log("🔄 Critical change detected, saving immediately...");
            setTimeout(() => {
                saveToDatabase().catch(error => {
                    console.error("❌ Immediate save failed:", error);
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
            console.log("📡 UnifiedContext: Dispatched real-time sync for slide reorder");

            console.log("🔄 Reorder detected, saving immediately...");
            setTimeout(() => {
                saveToDatabase().catch(error => {
                    console.error("❌ Immediate save failed:", error);
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
                    console.log("🔄 UnifiedContext: Critical changes detected, auto-saving...");
                    saveTimeoutRef.current = setTimeout(() => {
                        saveToDatabase().catch(error => {
                            console.error("❌ Auto-save failed:", error);
                        });
                    }, 5000); // 5 second debounce for critical changes only
                } else {
                    console.log("🔄 UnifiedContext: Non-critical changes detected, skipping auto-save");
                }
            }
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [slides, saveToDatabase, isEditing, isDisplayPage]);

    // Listen for data changes from polling system AND API changes
    useEffect(() => {
        const handleDataChange = (e: CustomEvent) => {
            console.log("🔄 UnifiedContext: Data change event received from polling system");
            const { data, source } = e.detail;
            if (source === 'polling' && data) {
                // Update slides if they have changed
                if (data.slides && data.slides.length > 0) {
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
                            console.log("📥 UnifiedContext: Polling data changed, updating slides");
                            return data.slides;
                        } else {
                            console.log("📥 UnifiedContext: Polling data unchanged, keeping existing slides");
                        }
                        return prevSlides;
                    });
                }
            }
        };

        // Listen for API data changes (employees, graph data)
        const handleApiDataChange = (apiData: any) => {
            console.log("🔄 UnifiedContext: API data change received", {
                employeesCount: apiData.employees?.length || 0,
                hasGraphData: !!apiData.graphData,
                escalationsCount: apiData.escalations?.length || 0,
                dataChangeType: apiData.employees?.length === 0 ? "CLEARED_DATA" : "NEW_DATA"
            });

            // CRITICAL: Update employees immediately when API data changes
            // This ensures stale birthday/anniversary data is cleared
            if (apiData.employees !== undefined) {
                console.log("🔄 UnifiedContext: Updating employees state", {
                    previousCount: employees.length,
                    newCount: apiData.employees.length,
                    action: apiData.employees.length === 0 ? "CLEARING_STALE_DATA" : "UPDATING_WITH_NEW_DATA"
                });
                setEmployees(apiData.employees); // Will be [] if API returns empty
            }

            if (apiData.graphData !== undefined) {
                setGraphData(apiData.graphData);
            }

            if (apiData.escalations !== undefined) {
                setEscalations(apiData.escalations); // Will be [] if API returns empty
            }

            // Dispatch real-time sync event to all DisplayPages immediately
            dispatchApiDataChange(
                apiData.employees || [],
                apiData.graphData || null,
                apiData.escalations || [],
                ['api-data-updated'],
                'api'
            );
        };

        // Set up API data listener
        const removeApiListener = addDataChangeListener(handleApiDataChange);

        window.addEventListener('dataChanged', handleDataChange as EventListener);
        return () => {
            window.removeEventListener('dataChanged', handleDataChange as EventListener);
            removeApiListener();
        };
    }, [employees.length]);

    // API Polling integration
    useEffect(() => {
        // Listen for API data changes
        const unsubscribeDataChange = addDataChangeListener((data) => {
            console.log("🔄 UnifiedContext: API data change received:", data);

            // Update employees, graph data, and escalations when API data changes
            if (data.employees) {
                setEmployees(data.employees);
            }
            if (data.graphData) {
                setGraphData(data.graphData);
            }
            if (data.escalations) {
                setEscalations(data.escalations);
            }

            // Trigger a refresh of slides that depend on API data
            if (data.employees || data.graphData || data.escalations) {
                console.log("🔄 UnifiedContext: Refreshing slides with updated API data");
                // Force a re-render by updating slides that depend on API data
                setSlides(prevSlides => {
                    return prevSlides.map(slide => {
                        if (slide.type === SLIDE_TYPES.EVENT && slide.data.employees) {
                            // Update event slides with new employee data
                            return {
                                ...slide,
                                data: {
                                    ...slide.data,
                                    employees: data.employees || slide.data.employees
                                }
                            };
                        }
                        if (slide.type === SLIDE_TYPES.GRAPH && data.graphData) {
                            // Update graph slides with new graph data
                            return {
                                ...slide,
                                data: {
                                    ...slide.data,
                                    ...data.graphData
                                }
                            };
                        }
                        if (slide.type === SLIDE_TYPES.TEAM_COMPARISON && data.graphData) {
                            // Update team comparison slides with new graph data
                            return {
                                ...slide,
                                data: {
                                    ...slide.data,
                                    lastUpdated: new Date().toISOString()
                                }
                            };
                        }
                        if (slide.type === SLIDE_TYPES.CURRENT_ESCALATIONS && data.escalations) {
                            // Update current escalations slides with new escalations data
                            return {
                                ...slide,
                                data: {
                                    ...slide.data,
                                    escalations: data.escalations
                                }
                            };
                        }
                        return slide;
                    });
                });
            }
        });

        // Listen for polling state changes
        const unsubscribePollingState = addPollingStateListener((state) => {
            console.log("🔄 UnifiedContext: API polling state changed:", state);
            setApiPollingState(state);
        });

        // Initialize API polling
        startApiPolling();

        return () => {
            unsubscribeDataChange();
            unsubscribePollingState();
            stopApiPolling();
        };
    }, [employees.length]);

    // Force API check function
    const handleForceApiCheck = useCallback(async () => {
        try {
            console.log("🔄 UnifiedContext: Forcing API check...");
            await forceApiCheck();
        } catch (error) {
            console.error("❌ Error forcing API check:", error);
        }
    }, []);

    // Start API polling function
    const handleStartApiPolling = useCallback(() => {
        console.log("🔄 UnifiedContext: Starting API polling...");
        startApiPolling();
    }, []);

    // Stop API polling function
    const handleStopApiPolling = useCallback(() => {
        console.log("🔄 UnifiedContext: Stopping API polling...");
        stopApiPolling();
    }, []);

    // Force migrate video URLs function
    const forceMigrateVideoUrls = useCallback(() => {
        console.log("🔄 UnifiedContext: Force migrating video URLs...");
        setSlides(prevSlides => {
            const migratedSlides = migrateVideoUrls(prevSlides);
            console.log("✅ UnifiedContext: Video URL migration completed");
            return migratedSlides;
        });
    }, []);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useCallback(() => {
        const currentState = JSON.stringify({ slides });
        const hasChanges = currentState !== lastSavedStateRef.current;
        console.log("🔍 UnifiedContext: Checking for unsaved changes:", {
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
                console.log("🔄 UnifiedContext: Initializing data...");
                console.log("🔄 UnifiedContext: isDisplayPage =", isDisplayPage);

                // Display settings now handled by SettingsContext

                // Attempt to load saved data from database FIRST
                setIsLoading(true);
                console.log("🔄 UnifiedContext: Attempting to load saved data from database...");
                const slideshowData = await sessionService.loadSlideshowData();

                if (slideshowData) {
                    console.log("📥 Loaded slideshow data from database:", {
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
                    console.log("🔍 Final slides has event slides:", hasEventSlides);

                    // If we don't have event slides, add them (avoiding duplicates)
                    if (!hasEventSlides) {
                        console.log("🔧 Adding missing event slides to final slides");
                        const defaultSlides = createDefaultSlides();
                        const eventSlides = defaultSlides.filter(s => s.type === SLIDE_TYPES.EVENT);
                        finalSlides = [...finalSlides, ...eventSlides];
                        console.log("🔧 Added event slides:", eventSlides.map(s => ({ id: s.id, name: s.name, type: s.type })));
                    } else {
                        // Check for duplicate event slides and remove them
                        const eventSlideIds = new Set<string>();
                        const eventSlideNames = new Set<string>();
                        const uniqueSlides = finalSlides.filter(slide => {
                            if (slide.type === SLIDE_TYPES.EVENT) {
                                // Check for duplicate by ID
                                if (eventSlideIds.has(slide.id)) {
                                    console.log("🔧 Removing duplicate event slide by ID:", slide.id, slide.name);
                                    return false;
                                }
                                // Check for duplicate by name (in case IDs are different but names are same)
                                if (eventSlideNames.has(slide.name)) {
                                    console.log("🔧 Removing duplicate event slide by name:", slide.id, slide.name);
                                    return false;
                                }
                                eventSlideIds.add(slide.id);
                                eventSlideNames.add(slide.name);
                            }
                            return true;
                        });

                        if (uniqueSlides.length !== finalSlides.length) {
                            console.log("🔧 Removed duplicate event slides, final count:", uniqueSlides.length);
                            finalSlides = uniqueSlides;
                        }
                    }

                    console.log("🔄 UnifiedContext: Setting slides from database:", {
                        finalSlidesCount: finalSlides.length,
                        activeSlidesCount: finalSlides.filter(s => s.active).length,
                        finalSlidesDetails: finalSlides.map(s => ({ id: s.id, name: s.name, active: s.active, type: s.type }))
                    });

                    setSlides(finalSlides);
                    lastSavedStateRef.current = JSON.stringify({ slides: finalSlides });

                    // Settings are handled by SettingsContext, so we don't need to do anything with them here
                    console.log("✅ UnifiedContext: Smart merge applied:", {
                        slidesSource: slideshowData.slides && slideshowData.slides.length > 0 ? 'database' : 'defaults',
                        settingsHandledBy: 'SettingsContext'
                    });
                } else {
                    console.log("🔄 No saved data found in database. Using defaults...");
                    // No database data, use defaults
                    const defaultSlides = createDefaultSlides();
                    setSlides(defaultSlides);
                    lastSavedStateRef.current = JSON.stringify({ slides: defaultSlides });
                }

                // Load API data only once on mount
                console.log("🔄 UnifiedContext: Loading API data...");
                await refreshApiData();

                console.log("✅ UnifiedContext: Initial data loading complete.");
            } catch (error) {
                console.error("❌ UnifiedContext: Failed to initialize data:", error);
                // Ensure default slides are set even on error
                const defaultSlides = createDefaultSlides();
                setSlides(defaultSlides);
                lastSavedStateRef.current = JSON.stringify({ slides: defaultSlides });
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();

        // Initialize API polling for real-time data updates
        console.log("🔄 UnifiedContext: Initializing API polling...");
        initializeApiPolling();
    }, [refreshApiData, isDisplayPage]); // Run only once on mount - intentionally omitting slides and isLoading to prevent infinite loops

    // Periodically refresh API data (every 8 hours) - only when not editing and not on display page
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (!isEditing && !isDisplayPage) {
                console.log("🔄 Periodic API data refresh...");
                refreshApiData();
            }
        }, 8 * 60 * 60 * 1000); // 8 hours - very infrequent to reduce API calls

        return () => clearInterval(refreshInterval);
    }, [refreshApiData, isEditing, isDisplayPage]);

    // Save data before page unload (only on non-display pages)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (slides.length > 0 && !isDisplayPage) {
                // Use synchronous save for beforeunload
                saveToDatabase().catch(error => {
                    console.error("❌ Save on unload failed:", error);
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
        isLoading,
        isEditing,
        setIsEditing,
        isDisplayPage,
        apiPollingState,
        saveToDatabase,
        syncFromDatabase,
        refreshApiData,
        syncToRemoteDisplays,
        forceApiCheck: handleForceApiCheck,
        clearApiCache,
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
