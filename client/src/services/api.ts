import axios from "axios";

// Get the backend URL based on environment
const getBackendUrl = (): string => {
    // Use REACT_APP_BACKEND_URL from environment variables
    return process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
};

// Log backend URL only in development
if (process.env.NODE_ENV === 'development') {
    // Backend URL configured
}

export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

// API Data Polling Configuration
const API_POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds for 24/7 display

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
        url: "/api/graph-data",
        description: "Team performance and graph data",
        enabled: true,
        transform: (data) => data || null // Keep as-is
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

// Polling state management
let pollingInterval: NodeJS.Timeout | null = null;
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
        console.log(`📡 Fetching data from ${endpoint.description} (${endpoint.url})`);
        const response = await backendApi.get(endpoint.url);
        const data = response.data;

        // Apply transformation if provided
        const transformedData = endpoint.transform ? endpoint.transform(data) : data;

        console.log(`✅ Successfully fetched ${endpoint.key}:`, {
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

    console.log(`🔄 Fetching data from ${enabledEndpoints.length} API endpoints...`);

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
 * Check for API data updates
 */
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
            console.log("🔄 API data has changed, updating cached data");

            // Extract employees data for backward compatibility
            const employees = freshApiData.employees || [];
            const graphData = freshApiData.graphData || null;

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
                        console.log("🧹 All employee data has been cleared from the API");
                    } else if (areBirthdaysCleared || areAnniversariesCleared) {
                        console.log("🎉 Event data transitions:", {
                            birthdaysCleared: areBirthdaysCleared,
                            anniversariesCleared: areAnniversariesCleared,
                            message: "Birthday/Anniversary data has been cleared - display should update automatically"
                        });
                    }
                }

                changeDetails.endpoints[endpoint.key] = endpointChanges;
            });

            console.log("📊 API Data Change Details:", changeDetails);

            // IMPORTANT: Always update cached data when hash changes
            // This ensures stale data is cleared even when new data is empty
            cachedApiData = { ...freshApiData };
            lastDataHash = currentDataHash;

            // Notify listeners of data change with backward compatibility
            notifyDataChange({
                // Backward compatibility - provide old format
                employees,
                graphData,
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
            console.log("No API data changes detected");

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
 */
export const startApiPolling = (): void => {
    if (isPolling) {
        console.log("API polling is already running");
        return;
    }

    console.log("Starting API data polling every hour");
    isPolling = true;

    // Initial check
    checkForApiUpdates();

    // Set up interval for regular checks
    pollingInterval = setInterval(() => {
        checkForApiUpdates();
    }, API_POLLING_INTERVAL);

    // Update polling state
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
 */
export const stopApiPolling = (): void => {
    if (!isPolling) {
        console.log("API polling is not running");
        return;
    }

    console.log("Stopping API data polling");
    isPolling = false;

    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    // Update polling state
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
 */
export const forceApiCheck = async (): Promise<void> => {
    console.log("Forcing immediate API check");
    // Clear cached data to force fresh fetch
    lastDataHash = "";
    cachedApiData = {}; // Clear all API cache
    await checkForApiUpdates();
};

/**
 * Clear all cached data immediately
 */
export const clearApiCache = (): void => {
    console.log("🧹 Clearing all API cache");
    lastDataHash = "";
    cachedApiData = {};

    // Notify listeners of the cleared data
    notifyDataChange({
        // Backward compatibility
        employees: [],
        graphData: null,
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
 */
export const initializeApiPolling = (): void => {
    // Start polling immediately
    startApiPolling();

    // Handle user activity to pause/resume polling
    let userActivityTimeout: NodeJS.Timeout | null = null;
    const USER_INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const handleUserActivity = () => {
        // Clear existing timeout
        if (userActivityTimeout) {
            clearTimeout(userActivityTimeout);
        }

        // Resume polling if it was paused
        if (!isPolling) {
            startApiPolling();
        }

        // Set timeout to pause polling after inactivity
        userActivityTimeout = setTimeout(() => {
            console.log("User inactive, pausing API polling");
            stopApiPolling();
        }, USER_INACTIVITY_THRESHOLD);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
    });

    // Initial activity
    handleUserActivity();
};

// Auto-initialize polling when module loads
if (typeof window !== 'undefined') {
    // Only initialize in browser environment
    initializeApiPolling();
}

