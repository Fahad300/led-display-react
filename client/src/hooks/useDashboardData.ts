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
 * - refetchOnWindowFocus: false - don't refetch when window gains focus
 * - retry: 3 - retry failed requests up to 3 times
 * - retryDelay: exponential backoff - 1s, 2s, 4s between retries
 * 
 * @returns UseQueryResult with dashboard data, loading state, and error
 */
export const useDashboardData = (): UseQueryResult<DashboardData, Error> => {
    return useQuery({
        queryKey: ["dashboardData"],
        queryFn: fetchDashboardData,

        // Refetch every 60 seconds (backend cache is 60s, so this aligns perfectly)
        refetchInterval: 60 * 1000,

        // Consider data stale after 30 seconds
        // This allows React Query to serve cached data quickly while
        // automatically refetching in the background if data is stale
        staleTime: 30 * 1000,

        // Don't refetch when window regains focus
        // This prevents excessive requests when users switch between tabs
        refetchOnWindowFocus: false,

        // Retry failed requests with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Keep previous data while refetching to prevent flickering (v5 uses placeholderData)
        placeholderData: (previousData) => previousData,

        // Enable background refetch even when component is not focused
        refetchIntervalInBackground: true,
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

