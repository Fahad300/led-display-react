/**
 * Centralized Backend API Client
 * 
 * This file contains the main Axios instance for all backend API calls.
 * All HTTP requests should go through this client to ensure consistent
 * error handling, authentication, and request/response transformation.
 * 
 * Features:
 * - Automatic auth token injection
 * - Global error handling
 * - Request/response interceptors
 * - Configurable base URL
 * - Timeout management
 * 
 * Usage:
 * ```typescript
 * import { backendApi } from "@/api/backendApi";
 * 
 * const response = await backendApi.get("/api/dashboard");
 * const data = await backendApi.post("/api/slides", slideData);
 * ```
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { logger } from "../utils/logger";

/**
 * Determine backend URL based on environment
 * - Development: http://localhost:5000
 * - Production: Use environment variable or same origin
 */
const getBackendUrl = (): string => {
    // Check for explicit backend URL in environment
    if (process.env.REACT_APP_BACKEND_URL) {
        return process.env.REACT_APP_BACKEND_URL;
    }

    // Development default
    if (process.env.NODE_ENV === "development") {
        return "http://localhost:5000";
    }

    // Production: use same origin (assumes backend is served from same domain)
    return window.location.origin;
};

/**
 * Main backend API client
 * All API calls should use this instance for consistency
 */
export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 30000, // 30 second timeout
    withCredentials: false // Set to true if using cookies
});

/**
 * Request Interceptor
 * Automatically adds authentication token to all requests
 */
backendApi.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get auth token from localStorage
        const token = localStorage.getItem("token");

        // Add token to request headers if available
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log API requests in development mode
        if (process.env.NODE_ENV === "development") {
            logger.api(`→ ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error: AxiosError) => {
        logger.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handles global error cases like authentication failures
 */
backendApi.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful responses in development mode
        if (process.env.NODE_ENV === "development") {
            logger.api(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }

        return response;
    },
    (error: AxiosError) => {
        // Handle authentication errors globally
        if (error.response?.status === 401) {
            logger.warn("Unauthorized request - clearing token and redirecting to login");

            // Clear auth token
            localStorage.removeItem("token");
            delete backendApi.defaults.headers.common["Authorization"];

            // Redirect to login page (only if not already there)
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        // Handle server errors
        if (error.response?.status && error.response.status >= 500) {
            logger.error(`Server error (${error.response.status}):`, error.response.data);
        }

        // Handle network errors
        if (!error.response) {
            logger.error("Network error - backend may be offline:", error.message);
        }

        // Log all errors in development
        if (process.env.NODE_ENV === "development") {
            logger.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });
        }

        return Promise.reject(error);
    }
);

/**
 * Type-safe API response wrapper
 * Ensures consistent response structure across the app
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

/**
 * Helper function for type-safe GET requests
 * 
 * @param url - API endpoint path
 * @returns Promise with typed response data
 */
export const apiGet = async <T = any>(url: string): Promise<T> => {
    const response = await backendApi.get<ApiResponse<T>>(url);
    // Type assertion is safe here because we handle both wrapped and unwrapped responses
    return (response.data.data || response.data) as unknown as T;
};

/**
 * Helper function for type-safe POST requests
 * 
 * @param url - API endpoint path
 * @param data - Request payload
 * @returns Promise with typed response data
 */
export const apiPost = async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await backendApi.post<ApiResponse<T>>(url, data);
    // Type assertion is safe here because we handle both wrapped and unwrapped responses
    return (response.data.data || response.data) as unknown as T;
};

/**
 * Helper function for type-safe PUT requests
 * 
 * @param url - API endpoint path
 * @param data - Request payload
 * @returns Promise with typed response data
 */
export const apiPut = async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await backendApi.put<ApiResponse<T>>(url, data);
    // Type assertion is safe here because we handle both wrapped and unwrapped responses
    return (response.data.data || response.data) as unknown as T;
};

/**
 * Helper function for type-safe DELETE requests
 * 
 * @param url - API endpoint path
 * @returns Promise with typed response data
 */
export const apiDelete = async <T = any>(url: string): Promise<T> => {
    const response = await backendApi.delete<ApiResponse<T>>(url);
    // Type assertion is safe here because we handle both wrapped and unwrapped responses
    return (response.data.data || response.data) as unknown as T;
};

/**
 * Export backend URL for components that need direct file access
 */
export const getBackendBaseUrl = (): string => {
    return getBackendUrl();
};

/**
 * Helper to construct full file URLs
 * Handles both old and new URL formats automatically
 * 
 * @param path - File path (can be relative, absolute, or full URL)
 * @returns Full URL to the file on the backend server
 */
export const getFileUrl = (path: string): string => {
    if (!path) return "";

    const baseUrl = getBackendUrl();

    // If already a full URL with backend domain, return as-is
    if (path.startsWith(baseUrl)) {
        return path;
    }

    // If it's a full URL to a different domain (shouldn't happen, but handle it)
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // If it's /static/uploads/filename - already correct relative path
    if (path.startsWith("/static/uploads/")) {
        return `${baseUrl}${path}`;
    }

    // If it's /api/files/id - old format, but still works via backend
    if (path.startsWith("/api/files/")) {
        return `${baseUrl}${path}`;
    }

    // If it's just a filename, assume it's in /static/uploads/
    if (!path.startsWith("/")) {
        return `${baseUrl}/static/uploads/${path}`;
    }

    // Default: add baseUrl to whatever path we have
    return `${baseUrl}${path}`;
};

/**
 * TODO: Future enhancements
 * 
 * 1. Add request queue for offline support
 * 2. Add request cancellation for cleanup
 * 3. Add request retry with exponential backoff
 * 4. Add WebSocket client for real-time updates
 * 5. Add SSE (Server-Sent Events) client for push notifications
 */

