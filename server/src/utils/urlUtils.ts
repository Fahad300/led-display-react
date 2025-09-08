/**
 * Utility functions for URL construction and management
 */

/**
 * Get the backend base URL from environment variables
 */
export const getBackendUrl = (): string => {
    // For production deployment, use the actual server URL
    if (process.env.NODE_ENV === "production") {
        return process.env.SERVER_URL || process.env.BACKEND_URL || `http://${process.env.HOST || "localhost"}:${process.env.PORT || "5000"}`;
    }
    // For development, use localhost
    return process.env.SERVER_URL || process.env.BACKEND_URL || "http://localhost:5000";
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
