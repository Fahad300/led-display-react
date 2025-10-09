import axios from "axios";
import { logger } from "../utils/logger";

// Show deprecation warning on import
if (process.env.NODE_ENV === "development") {
    logger.warn(
        "⚠️ services/api.ts is DEPRECATED. Use @/api/backendApi.ts and @/hooks/useDashboardData.ts instead. See docs/architecture.md"
    );
}

// Get the backend URL based on environment
const getBackendUrl = (): string => {
    // Use REACT_APP_BACKEND_URL from environment variables
    return process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
};

/**
 * @deprecated Import from "@/api/backendApi" instead
 */
export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

// API Data Polling Configuration (DEPRECATED - React Query handles this)
// Kept for reference only - not used in production
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_POLLING_INTERVAL = 30 * 1000; // 30 seconds for testing (DEPRECATED)

// API Endpoints Configuration - Add new APIs here without code changes
interface ApiEndpoint {
    key: string;
    url: string;
    description: string;
    enabled: boolean;
    transform?: (data: any) => any; // Optional data transformation function
}

const API_ENDPOINTS: ApiEndpoint[] = [
    {
        key: "employees",
        url: "/api/proxy/celebrations",
        description: "Employee birthday and anniversary data",
        enabled: true,
        transform: (data) => data || [] // Ensure array format
    },
    {
        key: "graphData",
        url: "/api/proxy/jira-chart",
        description: "Team performance and graph data",
        enabled: true,
        transform: (data) => data || null // Keep as-is
    },
    {
        key: "escalations",
        url: "/api/proxy/ongoing-escalations",
        description: "Current escalations and incidents data",
        enabled: true,
        transform: (data) => data || [] // Ensure array format
    }
    // Future APIs - just add them here, no code changes needed:
    // {
    //     key: "incidents",
    //     url: "/api/proxy/incidents", 
    //     description: "Current incidents and escalations",
    //     enabled: true,
    //     transform: (data) => data || []
    // },
    // {
    //     key: "metrics",
    //     url: "/api/proxy/metrics",
    //     description: "Performance metrics and KPIs", 
    //     enabled: true,
    //     transform: (data) => data || null
    // },
    // {
    //     key: "notifications",
    //     url: "/api/proxy/notifications",
    //     description: "System notifications and alerts",
    //     enabled: true,
    //     transform: (data) => data || []
    // },
    // {
    //     key: "weather",
    //     url: "/api/proxy/weather",
    //     description: "Weather information",
    //     enabled: false, // Can be disabled without affecting other APIs
    //     transform: (data) => data || null
    // }
];

// Polling state management (DEPRECATED - kept for backward compatibility)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let pollingInterval: NodeJS.Timeout | null = null; // DEPRECATED: Not used with React Query
let isPolling = false;
let lastDataHash = "";
let lastApiCheck: Date | null = null;
let pollingInProgress = false;

// Event listeners for data changes
const dataChangeListeners: Set<(data: any) => void> = new Set();
const pollingStateListeners: Set<(state: any) => void> = new Set();

// Dynamic data storage - scales with any number of APIs
let cachedApiData: Record<string, any> = {};

/**
 * Generate a hash for data comparison
 */
const generateDataHash = (data: any): string => {
    return JSON.stringify(data);
};

/**
 * Notify listeners of data changes
 */
const notifyDataChange = (data: any) => {
    dataChangeListeners.forEach(listener => {
        try {
            listener(data);
        } catch (error) {
            console.error("Error in data change listener:", error);
        }
    });
};

/**
 * Notify listeners of polling state changes
 */
const notifyPollingStateChange = (state: any) => {
    pollingStateListeners.forEach(listener => {
        try {
            listener(state);
        } catch (error) {
            console.error("Error in polling state listener:", error);
        }
    });
};

/**
 * Generic function to fetch data from any API endpoint
 */
const fetchApiData = async (endpoint: ApiEndpoint): Promise<any> => {
    try {
        logger.api(`Fetching data from ${endpoint.description} (${endpoint.url})`);
        const response = await backendApi.get(endpoint.url);
        const data = response.data;

        // Apply transformation if provided
        const transformedData = endpoint.transform ? endpoint.transform(data) : data;

        logger.success(`Successfully fetched ${endpoint.key}:`, {
            hasData: !!transformedData,
            dataType: Array.isArray(transformedData) ? `array[${transformedData.length}]` : typeof transformedData
        });

        return transformedData;
    } catch (error) {
        console.error(`❌ Error fetching ${endpoint.description}:`, error);
        throw error;
    }
};

/**
 * Fetch all enabled API endpoints data
 */
const fetchAllApiData = async (): Promise<Record<string, any>> => {
    const enabledEndpoints = API_ENDPOINTS.filter(endpoint => endpoint.enabled);
    const results: Record<string, any> = {};

    logger.api(`Fetching data from ${enabledEndpoints.length} API endpoints...`);

    // Fetch all APIs in parallel for better performance
    const fetchPromises = enabledEndpoints.map(async (endpoint) => {
        try {
            const data = await fetchApiData(endpoint);
            results[endpoint.key] = data;
        } catch (error) {
            console.error(`Failed to fetch ${endpoint.key}:`, error);
            // Keep previous cached data if fetch fails
            results[endpoint.key] = cachedApiData[endpoint.key] || null;
        }
    });

    await Promise.allSettled(fetchPromises);
    return results;
};

/**
 * Legacy function for backward compatibility - employees data
 */
export const fetchEmployeesData = async (): Promise<any[]> => {
    const employeesEndpoint = API_ENDPOINTS.find(ep => ep.key === "employees");
    if (!employeesEndpoint) {
        throw new Error("Employees endpoint not configured");
    }
    return await fetchApiData(employeesEndpoint);
};

/**
 * Legacy function for backward compatibility - graph data
 */
export const fetchGraphData = async (): Promise<any> => {
    const graphEndpoint = API_ENDPOINTS.find(ep => ep.key === "graphData");
    if (!graphEndpoint) {
        throw new Error("Graph data endpoint not configured");
    }
    return await fetchApiData(graphEndpoint);
};

/**
 * Legacy function for backward compatibility - escalations data
 */
export const fetchEscalationsData = async (): Promise<any[]> => {
    const escalationsEndpoint = API_ENDPOINTS.find(ep => ep.key === "escalations");
    if (!escalationsEndpoint) {
        throw new Error("Escalations endpoint not configured");
    }
    return await fetchApiData(escalationsEndpoint);
};

/**
 * Check for API data updates
 * DEPRECATED: Not used with React Query, kept for potential debugging
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkForApiUpdates = async (): Promise<void> => {
    if (pollingInProgress) {
        return;
    }

    pollingInProgress = true;
    lastApiCheck = new Date();

    try {
        // Fetch fresh data from all enabled APIs in parallel
        const freshApiData = await fetchAllApiData();

        // Generate hash for comparison
        const currentDataHash = generateDataHash(freshApiData);

        // Check if data has changed
        if (currentDataHash !== lastDataHash) {
            logger.sync("API data has changed, updating cached data");

            // Extract employees data for backward compatibility
            const employees = freshApiData.employees || [];
            const graphData = freshApiData.graphData || null;
            const escalations = freshApiData.escalations || [];

            logger.data("API Data Update:", {
                employees: employees.length,
                graphData: !!graphData,
                escalations: escalations.length,
                escalationsData: escalations
            });

            // Debug escalations data specifically
            logger.debug("Escalations Debug:", {
                rawEscalations: freshApiData.escalations,
                escalationsLength: escalations.length,
                escalationsType: typeof escalations,
                isArray: Array.isArray(escalations)
            });

            // Log detailed changes for each API endpoint
            const changeDetails: Record<string, any> = {
                previousHash: lastDataHash.substring(0, 8) + "...",
                currentHash: currentDataHash.substring(0, 8) + "...",
                endpoints: {}
            };

            // Analyze changes for each endpoint
            API_ENDPOINTS.filter(ep => ep.enabled).forEach(endpoint => {
                const previousData = cachedApiData[endpoint.key];
                const currentData = freshApiData[endpoint.key];

                let endpointChanges: any = {
                    hasData: !!currentData,
                    dataType: Array.isArray(currentData) ? `array[${currentData.length}]` : typeof currentData
                };

                // Special handling for employees data
                if (endpoint.key === "employees" && Array.isArray(currentData)) {
                    const prevArray = Array.isArray(previousData) ? previousData : [];
                    const previousEmployeeCount = prevArray.length;
                    const previousBirthdayCount = prevArray.filter(e => e.isBirthday).length;
                    const previousAnniversaryCount = prevArray.filter(e => e.isAnniversary).length;
                    const currentBirthdayCount = currentData.filter(e => e.isBirthday).length;
                    const currentAnniversaryCount = currentData.filter(e => e.isAnniversary).length;

                    const isDataCleared = previousEmployeeCount > 0 && currentData.length === 0;
                    const areBirthdaysCleared = previousBirthdayCount > 0 && currentBirthdayCount === 0;
                    const areAnniversariesCleared = previousAnniversaryCount > 0 && currentAnniversaryCount === 0;

                    endpointChanges = {
                        ...endpointChanges,
                        transition: `${previousEmployeeCount} → ${currentData.length} employees`,
                        birthdays: `${previousBirthdayCount} → ${currentBirthdayCount}`,
                        anniversaries: `${previousAnniversaryCount} → ${currentAnniversaryCount}`,
                        changeType: isDataCleared ? "🧹 ALL_DATA_CLEARED" :
                            areBirthdaysCleared && areAnniversariesCleared ? "🎉 EVENTS_CLEARED" :
                                areBirthdaysCleared ? "🎂 BIRTHDAYS_CLEARED" :
                                    areAnniversariesCleared ? "🏢 ANNIVERSARIES_CLEARED" :
                                        "📈 DATA_UPDATED"
                    };

                    // Log specific transitions for debugging
                    if (isDataCleared) {
                        logger.info("All employee data has been cleared from the API");
                    } else if (areBirthdaysCleared || areAnniversariesCleared) {
                        logger.info("Event data transitions:", {
                            birthdaysCleared: areBirthdaysCleared,
                            anniversariesCleared: areAnniversariesCleared,
                            message: "Birthday/Anniversary data has been cleared - display should update automatically"
                        });
                    }
                }

                changeDetails.endpoints[endpoint.key] = endpointChanges;
            });

            logger.data("API Data Change Details:", changeDetails);

            // IMPORTANT: Always update cached data when hash changes
            // This ensures stale data is cleared even when new data is empty
            cachedApiData = { ...freshApiData };
            lastDataHash = currentDataHash;

            // Notify listeners of data change with backward compatibility
            notifyDataChange({
                // Backward compatibility - provide old format
                employees,
                graphData,
                escalations: freshApiData.escalations || [],
                // New format - all API data
                apiData: freshApiData,
                timestamp: new Date(),
                source: "api_polling"
            });

            // Update polling state
            notifyPollingStateChange({
                isPolling: true,
                lastApiCheck,
                lastDataHash: currentDataHash,
                hasApiChanges: true,
                pollingInProgress: false
            });
        } else {
            logger.debug("No API data changes detected");

            // Update polling state without data change
            notifyPollingStateChange({
                isPolling: true,
                lastApiCheck,
                lastDataHash: currentDataHash,
                hasApiChanges: false,
                pollingInProgress: false
            });
        }
    } catch (error) {
        console.error("Error checking for API updates:", error);

        // Update polling state with error
        notifyPollingStateChange({
            isPolling: true,
            lastApiCheck,
            lastDataHash,
            hasApiChanges: false,
            pollingInProgress: false,
            error: error instanceof Error ? error.message : String(error)
        });
    } finally {
        pollingInProgress = false;
    }
};

/**
 * Start automatic API polling
 * DEPRECATED: No-op for backward compatibility
 * React Query handles polling automatically via useDashboardData hook
 */
export const startApiPolling = (): void => {
    logger.debug("startApiPolling called (no-op - React Query handles polling)");
    // No-op: React Query automatically polls via refetchInterval in useDashboardData
    // Update state for backward compatibility
    isPolling = true;
    notifyPollingStateChange({
        isPolling: true,
        lastApiCheck,
        lastDataHash,
        hasApiChanges: false,
        pollingInProgress: false
    });
};

/**
 * Stop automatic API polling
 * DEPRECATED: No-op for backward compatibility
 * React Query handles polling automatically
 */
export const stopApiPolling = (): void => {
    logger.debug("stopApiPolling called (no-op - React Query handles polling)");
    // No-op: React Query polling cannot be dynamically stopped in this implementation
    // Update state for backward compatibility
    isPolling = false;
    notifyPollingStateChange({
        isPolling: false,
        lastApiCheck,
        lastDataHash,
        hasApiChanges: false,
        pollingInProgress: false
    });
};

/**
 * Force an immediate API check
 * DEPRECATED: Triggers React Query refetch instead of manual polling
 * For backward compatibility, this function notifies listeners to trigger refetch
 */
export const forceApiCheck = async (): Promise<void> => {
    logger.api("forceApiCheck called - notifying React Query to refetch");
    // Clear local cached data for backward compatibility
    lastDataHash = "";
    cachedApiData = {};

    // Notify listeners that a refetch is needed
    // The UnifiedContext listens to this and calls refetchDashboard()
    notifyPollingStateChange({
        isPolling: true,
        lastApiCheck: new Date(),
        lastDataHash: "",
        hasApiChanges: true,
        pollingInProgress: false,
        forceRefetch: true // Signal that refetch is needed
    });
};

/**
 * Test API endpoints manually
 * This function still works for debugging purposes
 */
export const testApiEndpoints = async (): Promise<void> => {
    logger.api("Testing API endpoints manually...");
    const enabledEndpoints = API_ENDPOINTS.filter(endpoint => endpoint.enabled);

    for (const endpoint of enabledEndpoints) {
        try {
            logger.debug(`Testing ${endpoint.key} (${endpoint.url})...`);
            const response = await backendApi.get(endpoint.url);
            logger.success(`${endpoint.key} response:`, response.data);
        } catch (error) {
            console.error(`❌ ${endpoint.key} error:`, error);
        }
    }
};

/**
 * Clear all cached data immediately
 * DEPRECATED: Clears local cache and notifies React Query
 */
export const clearApiCache = (): void => {
    logger.info("clearApiCache called - clearing local cache and notifying React Query");
    lastDataHash = "";
    cachedApiData = {};

    // Notify listeners of the cleared data
    // This will trigger React Query to refetch via the listener in UnifiedContext
    notifyDataChange({
        // Backward compatibility
        employees: [],
        graphData: null,
        escalations: [],
        // New format - empty API data
        apiData: {},
        timestamp: new Date(),
        source: "cache_clear"
    });
};

/**
 * Get current polling state
 */
export const getPollingState = () => ({
    isPolling,
    lastApiCheck,
    lastDataHash,
    hasApiChanges: false,
    pollingInProgress
});

/**
 * Get cached data
 */
export const getCachedData = () => ({
    // Backward compatibility
    employees: cachedApiData.employees || [],
    graphData: cachedApiData.graphData || null,
    // New format - all cached API data
    apiData: cachedApiData
});

/**
 * Add data change listener
 */
export const addDataChangeListener = (listener: (data: any) => void): (() => void) => {
    dataChangeListeners.add(listener);

    // Return unsubscribe function
    return () => {
        dataChangeListeners.delete(listener);
    };
};

/**
 * Add polling state listener
 */
export const addPollingStateListener = (listener: (state: any) => void): (() => void) => {
    pollingStateListeners.add(listener);

    // Return unsubscribe function
    return () => {
        pollingStateListeners.delete(listener);
    };
};

/**
 * Initialize API polling with user activity detection
 * DEPRECATED: No-op for backward compatibility
 * React Query handles polling automatically via useDashboardData hook
 */
export const initializeApiPolling = (): void => {
    logger.debug("initializeApiPolling called (no-op - React Query handles polling)");
    // No-op: React Query automatically polls via refetchInterval in useDashboardData
    // User activity detection is not needed as React Query manages this efficiently

    // Update state for backward compatibility
    isPolling = true;
    notifyPollingStateChange({
        isPolling: true,
        lastApiCheck: new Date(),
        lastDataHash: "",
        hasApiChanges: false,
        pollingInProgress: false
    });
};

/**
 * NOTE: Auto-initialization removed
 * React Query (via useDashboardData hook) now handles all polling automatically
 * No manual initialization is needed
 * 
 * The polling starts when:
 * 1. UnifiedProvider mounts (via useDashboardData hook)
 * 2. Any component calls useDashboardData() 
 * 
 * Benefits:
 * - Automatic polling every 60 seconds
 * - Intelligent caching with 30-second stale time
 * - No duplicate requests across components
 * - Built-in error handling and retry logic
 * - Automatic request deduplication
 */

