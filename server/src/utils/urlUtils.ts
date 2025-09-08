/**
 * Utility functions for URL construction and management
 */

/**
 * Get the backend base URL from environment variables
 */
export const getBackendUrl = (): string => {
    // Use SERVER_URL from environment variables
    return process.env.SERVER_URL || "http://localhost:5000";
};

/**
 * Construct a full URL for a file endpoint
 */
export const getFileUrl = (fileId: string): string => {
    const backendUrl = getBackendUrl();
    return `${backendUrl}/api/files/${fileId}`;
};

/**
 * Construct a full URL for any API endpoint
 */
export const getApiUrl = (endpoint: string): string => {
    const backendUrl = getBackendUrl();
    return `${backendUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
