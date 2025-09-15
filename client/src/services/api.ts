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
const API_POLLING_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Polling state management
let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;
let lastDataHash = "";
let lastApiCheck: Date | null = null;
let pollingInProgress = false;

// Event listeners for data changes
const dataChangeListeners: Set<(data: any) => void> = new Set();
const pollingStateListeners: Set<(state: any) => void> = new Set();

// Data storage
let cachedEmployees: any[] = [];
let cachedGraphData: any = null;

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
 * Fetch employees data from API
 */
export const fetchEmployeesData = async (): Promise<any[]> => {
    try {
        const response = await backendApi.get("/api/employees");
        return response.data || [];
    } catch (error) {
        console.error("Error fetching employees data:", error);
        throw error;
    }
};

/**
 * Fetch graph data from API
 */
export const fetchGraphData = async (): Promise<any> => {
    try {
        const response = await backendApi.get("/api/graph-data");
        return response.data || null;
    } catch (error) {
        console.error("Error fetching graph data:", error);
        throw error;
    }
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
        // Fetch fresh data from APIs
        const [employees, graphData] = await Promise.all([
            fetchEmployeesData(),
            fetchGraphData()
        ]);

        // Generate hash for comparison
        const currentDataHash = generateDataHash({ employees, graphData });

        // Check if data has changed
        if (currentDataHash !== lastDataHash) {
            console.log("API data has changed, updating cached data");

            // Update cached data
            cachedEmployees = employees;
            cachedGraphData = graphData;
            lastDataHash = currentDataHash;

            // Notify listeners of data change
            notifyDataChange({
                employees,
                graphData,
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
    await checkForApiUpdates();
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
    employees: cachedEmployees,
    graphData: cachedGraphData
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

