/**
 * useDashboardData Hook
 * 
 * React Query hook for fetching consolidated dashboard data.
 * Replaces manual polling with automatic refetching and caching.
 * 
 * Features:
 * - Automatic refetch every 60 seconds
 * - Stale time of 30 seconds for optimal caching
 * - No refetch on window focus to reduce unnecessary requests
 * - Error handling with retry logic
 * - TypeScript support with proper typing
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardData();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * const { employees, graphData, escalations } = data;
 * ```
 * 
 * TODO: Consider migrating to WebSocket or Server-Sent Events for real-time updates
 * instead of polling. This would eliminate the need for periodic refetching and
 * provide instant updates when data changes on the server.
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { backendApi } from "../api/backendApi";
import { logger } from "../utils/logger";

/**
 * Dashboard data structure returned from the API
 */
export interface DashboardData {
    /** Employee data including birthdays and anniversaries */
    employees: any[];
    /** Chart and graph data for visualizations */
    graphData: any;
    /** Current escalations and tickets data */
    escalations: any[];
}

/**
 * API failure tracking
 */
interface ApiFailure {
    endpoint: string;
    error: string;
}

/**
 * API response structure from /api/dashboard endpoint
 */
interface DashboardApiResponse {
    success: boolean;
    data: DashboardData & {
        failures?: ApiFailure[];
    };
    cached: boolean;
    stale?: boolean;
    timestamp: string;
    cacheAge?: number;
    warning?: string;
    error?: string;
    message?: string;
}

/**
 * Fetch dashboard data from the centralized endpoint
 * 
 * @returns Promise resolving to dashboard data
 * @throws Error if request fails
 */
const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
        logger.info("Fetching dashboard data from /api/dashboard");

        const response = await backendApi.get<DashboardApiResponse>("/api/dashboard");

        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch dashboard data");
        }

        // Log cache status for debugging
        if (response.data.cached) {
            const status = response.data.stale ? "stale" : "valid";
            const age = response.data.cacheAge ? Math.round(response.data.cacheAge / 1000) : 0;
            logger.info(`Dashboard data from cache (${status}, age: ${age}s)`);
        } else {
            logger.info("Dashboard data freshly fetched");
        }

        // Log warning if data is stale or has API failures
        if (response.data.warning) {
            logger.warn("⚠️  Dashboard data warning:", response.data.warning);
        }

        // Log specific API failures for debugging
        if (response.data.data.failures && response.data.data.failures.length > 0) {
            logger.error("❌ API Endpoint Failures Detected:");
            response.data.data.failures.forEach((failure: ApiFailure) => {
                logger.error(`   - ${failure.endpoint}: ${failure.error}`);
            });
            logger.warn("   Some slide data may be incomplete. Check the backend logs for details.");
        }

        return response.data.data;
    } catch (error) {
        logger.error("Error fetching dashboard data:", error);
        throw error;
    }
};

/**
 * React Query hook for dashboard data
 * 
 * Configuration:
 * - queryKey: ["dashboardData"] - unique identifier for this query
 * - queryFn: fetchDashboardData - function to fetch the data
 * - refetchInterval: 60000 (60 seconds) - automatic refetch interval
 * - staleTime: 30000 (30 seconds) - how long data is considered fresh
 * - refetchOnWindowFocus: true - refetch when window gains focus to ensure fresh data
 * - retry: infinite - keep retrying forever to ensure 24/7 operation
 * - retryDelay: exponential backoff - 1s, 2s, 4s between retries
 * 
 * CRITICAL FOR 24/7 OPERATION:
 * - refetchInterval keeps polling even when tab is hidden
 * - refetchOnWindowFocus ensures data is fresh when display becomes visible
 * - Infinite retry ensures temporary network issues don't stop the display
 * 
 * @returns UseQueryResult with dashboard data, loading state, and error
 */
export const useDashboardData = (): UseQueryResult<DashboardData, Error> => {
    return useQuery({
        queryKey: ["dashboardData"],
        queryFn: fetchDashboardData,

        // Refetch every 60 seconds (backend cache is 60s, so this aligns perfectly)
        // CRITICAL: This keeps polling even when tab is in background (24/7 operation)
        refetchInterval: 60 * 1000,

        // Consider data stale after 30 seconds
        // This allows React Query to serve cached data quickly while
        // automatically refetching in the background if data is stale
        staleTime: 30 * 1000,

        // CHANGED: Refetch when window gains focus to ensure fresh data
        // This is critical for displays that may go to sleep or be hidden
        refetchOnWindowFocus: true,

        // CHANGED: Infinite retry to ensure 24/7 operation
        // Temporary network issues should not stop the display
        retry: Infinity,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Keep previous data while refetching to prevent flickering (v5 uses placeholderData)
        placeholderData: (previousData) => previousData,

        // CRITICAL: Enable background refetch even when component is not focused
        // This ensures polling continues even when tab is in background (24/7 operation)
        refetchIntervalInBackground: true,

        // ADDED: Network mode to control query behavior
        // 'always' ensures queries run even when offline (using cached data)
        networkMode: "always",

        // ADDED: gcTime (garbage collection time) - keep data in cache for 10 minutes
        // This ensures data is available even after brief disconnections
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Legacy compatibility function
 * Provides backward compatibility with old API polling system
 * 
 * @deprecated Use useDashboardData hook instead
 * @returns Current cached data or empty structure
 */
export const getLegacyCachedData = (): DashboardData => {
    logger.warn("getLegacyCachedData is deprecated. Use useDashboardData hook instead.");

    // Return empty structure as fallback
    // Components should migrate to use the hook directly
    return {
        employees: [],
        graphData: null,
        escalations: []
    };
};

/**
 * Hook for accessing only employee data
 * Convenience wrapper around useDashboardData
 */
export const useEmployeesData = () => {
    const { data, isLoading, error, refetch } = useDashboardData();

    return {
        employees: data?.employees || [],
        isLoading,
        error,
        refetch
    };
};

/**
 * Hook for accessing only graph data
 * Convenience wrapper around useDashboardData
 */
export const useGraphData = () => {
    const { data, isLoading, error, refetch } = useDashboardData();

    return {
        graphData: data?.graphData || null,
        isLoading,
        error,
        refetch
    };
};

/**
 * Hook for accessing only escalations data
 * Convenience wrapper around useDashboardData
 */
export const useEscalationsData = () => {
    const { data, isLoading, error, refetch } = useDashboardData();

    return {
        escalations: data?.escalations || [],
        isLoading,
        error,
        refetch
    };
};

