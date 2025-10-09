/**
 * Centralized Dashboard API Endpoint
 * 
 * This endpoint consolidates multiple API calls into a single request,
 * reducing network overhead and improving performance.
 * 
 * Features:
 * - Single endpoint for all dashboard data (employees, graphData, escalations)
 * - 60-second in-memory caching to reduce backend API load
 * - Error handling with fallback to last cached data
 * - Backward compatible with existing data structure
 * 
 * TODO: Consider implementing WebSocket or Server-Sent Events for real-time updates
 * instead of polling in production environments.
 * 
 * TODO: For production scalability with multiple server instances, consider
 * implementing Redis-based distributed caching instead of in-memory cache.
 */

import express from "express";
import axios, { AxiosError } from "axios";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * Cache configuration
 * 
 * IMPORTANT: Stale cache is ALWAYS served if fresh fetch fails
 * This ensures zero downtime - users always get data, even if outdated
 */
const CACHE_DURATION = 60 * 1000; // 60 seconds - cache is considered fresh
const MAX_STALE_WARNING_THRESHOLD = 10 * 60 * 1000; // 10 minutes - warn if cache is very old

/**
 * In-memory cache structure
 * 
 * TODO: Replace with Redis for distributed caching in production:
 * - Supports multiple server instances
 * - Persists across server restarts
 * - Better memory management
 * - TTL support built-in
 */
interface CachedData {
    data: {
        employees: any[];
        graphData: any;
        escalations: any[];
        failures?: ApiFailure[];
    };
    timestamp: number;
    lastSuccessfulFetch: number;
}

let dashboardCache: CachedData | null = null;

/**
 * Fetch data from external API endpoint with error handling
 */
const fetchFromExternalApi = async (endpoint: string, description: string): Promise<any> => {
    const externalApiUrl = process.env.EXTERNAL_API_URL;
    const externalApiToken = process.env.EXTERNAL_API_TOKEN;

    if (!externalApiToken) {
        logger.error(`EXTERNAL_API_TOKEN not configured for ${description}`);
        throw new Error("External API token not configured");
    }

    try {
        logger.info(`Fetching ${description} from ${externalApiUrl}/${endpoint}`);

        const response = await axios.get(`${externalApiUrl}/${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000 // 30 seconds timeout
        });

        logger.info(`Successfully fetched ${description}`);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching ${description}:`, error);
        throw error;
    }
};

/**
 * Interface for tracking API failures
 */
interface ApiFailure {
    endpoint: string;
    error: string;
}

/**
 * Transform raw jira-chart API response to GraphSlideData format
 */
const transformJiraChartData = (rawData: any): any => {
    if (!rawData || !rawData.labels || !rawData.data) {
        logger.warn("Invalid jira-chart data structure, returning null");
        return null;
    }

    try {
        // Transform API response to match GraphSlideData interface
        const transformedData = rawData.labels.map((teamName: string, teamIndex: number) => {
            const teamData = rawData.data[teamIndex] || [];
            const dataPoints = teamData.map((value: number, priorityIndex: number) => ({
                date: new Date().toISOString(),
                value: value,
                category: rawData.priorities[priorityIndex] || `Priority ${priorityIndex + 1}`
            }));
            return { teamName: teamName, dataPoints: dataPoints };
        });

        const currentYear = new Date().getFullYear();

        return {
            title: `Team Wise Data ${currentYear}`,
            description: "",
            graphType: 'bar',
            data: transformedData,
            timeRange: 'monthly',
            lastUpdated: new Date().toISOString(),
            categories: rawData.priorities || [
                'C-Level (Top Priority: fix immediately)',
                'P1 - Blocker (fix immediately)',
                'P2 - Critical (must fix)',
                'P3 - Major (really should fix)',
                'P4 - Minor (should fix)'
            ]
        };
    } catch (error) {
        logger.error("Error transforming jira-chart data:", error);
        return null;
    }
};

/**
 * Fetch all dashboard data from external APIs
 */
const fetchAllDashboardData = async (): Promise<{
    employees: any[];
    graphData: any;
    escalations: any[];
    failures: ApiFailure[];
}> => {
    logger.info("Fetching all dashboard data from external APIs");

    // Fetch all endpoints in parallel for better performance
    const [employeesResult, graphDataResult, escalationsResult] = await Promise.allSettled([
        fetchFromExternalApi("celebrations", "employees data"),
        fetchFromExternalApi("jira-chart", "graph data"),
        fetchFromExternalApi("ongoing-escalations", "escalations data")
    ]);

    const failures: ApiFailure[] = [];

    // Extract and process employee data from settled promises with fallback to empty arrays
    const rawEmployees = employeesResult.status === "fulfilled" ? employeesResult.value : [];

    // Process employee data to ensure isBirthday and isAnniversary flags are set
    // This matches the processing done in the old eventsService.ts
    const employees = rawEmployees.map((employee: any) => ({
        id: employee.id,
        name: employee.name,
        dob: employee.dob,
        designation: employee.designation,
        teamName: employee.teamName,
        picture: employee.picture,
        email: employee.email,
        gender: employee.gender,
        dateOfJoining: employee.dateOfJoining,
        isBirthday: employee.isBirthday || false,
        isAnniversary: employee.isAnniversary || false
    }));

    // Transform jira-chart data to GraphSlideData format
    const rawGraphData = graphDataResult.status === "fulfilled" ? graphDataResult.value : null;
    const graphData = rawGraphData ? transformJiraChartData(rawGraphData) : null;

    const escalations = escalationsResult.status === "fulfilled" ? escalationsResult.value : [];

    // Track and log any failures with detailed information
    if (employeesResult.status === "rejected") {
        const errorMsg = employeesResult.reason?.message || String(employeesResult.reason);
        logger.error("❌ Failed to fetch employees data:", errorMsg);
        logger.error("   Endpoint: /api/proxy/celebrations");
        failures.push({ endpoint: "celebrations", error: errorMsg });
    } else {
        logger.info("✅ Successfully fetched employees data");
        logger.info(`📊 Employee data summary: ${employees.length} total, ${employees.filter((e: any) => e.isBirthday).length} birthdays, ${employees.filter((e: any) => e.isAnniversary).length} anniversaries`);

        // Log specific employees with events for debugging
        const birthdayEmployees = employees.filter((e: any) => e.isBirthday);
        const anniversaryEmployees = employees.filter((e: any) => e.isAnniversary);

        if (birthdayEmployees.length > 0) {
            logger.info("🎂 Birthday employees:", birthdayEmployees.map((e: any) => ({ name: e.name, gender: e.gender })));
        }
        if (anniversaryEmployees.length > 0) {
            logger.info("🎉 Anniversary employees:", anniversaryEmployees.map((e: any) => ({ name: e.name, gender: e.gender })));
        }
    }

    if (graphDataResult.status === "rejected") {
        const errorMsg = graphDataResult.reason?.message || String(graphDataResult.reason);
        logger.error("❌ Failed to fetch graph data (jira-chart):", errorMsg);
        logger.error("   Endpoint: /api/proxy/jira-chart");
        failures.push({ endpoint: "jira-chart", error: errorMsg });
    } else {
        logger.info("✅ Successfully fetched graph data (jira-chart)");
    }

    if (escalationsResult.status === "rejected") {
        const errorMsg = escalationsResult.reason?.message || String(escalationsResult.reason);
        logger.error("❌ Failed to fetch escalations data:", errorMsg);
        logger.error("   Endpoint: /api/proxy/ongoing-escalations");
        failures.push({ endpoint: "ongoing-escalations", error: errorMsg });
    } else {
        logger.info("✅ Successfully fetched escalations data");
    }

    if (failures.length > 0) {
        logger.warn(`⚠️  ${failures.length} API endpoint(s) failed. Returning partial data.`);
    }

    return { employees, graphData, escalations, failures };
};

/**
 * Check if cache is fresh (recently updated, < 60 seconds old)
 * If true, we can serve it immediately without fetching
 */
const isCacheFresh = (): boolean => {
    if (!dashboardCache) {
        return false;
    }

    const age = Date.now() - dashboardCache.timestamp;
    return age < CACHE_DURATION;
};

/**
 * GET /api/dashboard
 * 
 * Consolidated endpoint that returns all dashboard data in a single response:
 * - employees: Array of employee data (birthdays, anniversaries, etc.)
 * - graphData: Chart/graph data for visualizations
 * - escalations: Current escalations/tickets data
 * 
 * Caching Strategy (ZERO DOWNTIME):
 * 1. If cache is fresh (< 60 seconds old), return it immediately
 * 2. If cache expired, attempt to fetch fresh data from APIs
 * 3. If API fetch fails, ALWAYS return stale cache (regardless of age)
 * 4. Only return error if no cache exists at all (first request only)
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   data: {
 *     employees: any[],
 *     graphData: any,
 *     escalations: any[],
 *     failures?: Array<{ endpoint: string, error: string }>
 *   },
 *   cached: boolean,
 *   timestamp: string,
 *   cacheAge?: number,
 *   warning?: string
 * }
 */
router.get("/", async (req, res) => {
    try {
        // Return cached data immediately if it's fresh (< 60 seconds old)
        if (isCacheFresh()) {
            const cacheAge = Date.now() - dashboardCache!.timestamp;
            logger.info(`✅ Returning fresh cached data (age: ${Math.round(cacheAge / 1000)}s)`);

            const response: any = {
                success: true,
                data: dashboardCache!.data,
                cached: true,
                fresh: true,
                timestamp: new Date(dashboardCache!.timestamp).toISOString(),
                cacheAge: cacheAge
            };

            // Add warning if there were API failures when this data was cached
            if (dashboardCache!.data.failures && dashboardCache!.data.failures.length > 0) {
                response.warning = `${dashboardCache!.data.failures.length} API endpoint(s) failed. Some data may be incomplete.`;
                logger.warn(`⚠️  Returning cached data with ${dashboardCache!.data.failures.length} known API failures`);
            }

            return res.json(response);
        }

        // Cache expired or doesn't exist - attempt fresh fetch
        logger.info("🔄 Cache expired or missing, fetching fresh dashboard data...");

        try {
            const freshData = await fetchAllDashboardData();
            const now = Date.now();

            // Update cache with fresh data
            dashboardCache = {
                data: freshData,
                timestamp: now,
                lastSuccessfulFetch: now
            };

            logger.info("Successfully fetched and cached fresh dashboard data");

            const response: any = {
                success: true,
                data: freshData,
                cached: false,
                timestamp: new Date(now).toISOString()
            };

            // Add warning if any APIs failed
            if (freshData.failures && freshData.failures.length > 0) {
                response.warning = `${freshData.failures.length} API endpoint(s) failed: ${freshData.failures.map(f => f.endpoint).join(", ")}. Some data may be incomplete.`;
                logger.warn(`⚠️  Returning fresh data but ${freshData.failures.length} API(s) failed`);
            }

            return res.json(response);

        } catch (fetchError) {
            // API fetch failed - ALWAYS return cache if available (never return empty data)
            logger.error("Failed to fetch fresh dashboard data:", fetchError);

            if (dashboardCache) {
                const cacheAge = Date.now() - dashboardCache.timestamp;
                const ageSeconds = Math.round(cacheAge / 1000);
                const ageMinutes = Math.round(cacheAge / 60000);

                logger.warn(`⚠️  Returning stale cached data due to API failure (age: ${ageMinutes}m ${ageSeconds % 60}s)`);

                return res.json({
                    success: true,
                    data: dashboardCache.data,
                    cached: true,
                    stale: true,
                    timestamp: new Date(dashboardCache.timestamp).toISOString(),
                    cacheAge: cacheAge,
                    warning: `Using cached data (${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} old) because fresh fetch failed. Data may be outdated.`,
                    error: fetchError instanceof Error ? fetchError.message : String(fetchError)
                });
            }

            // No cache available at all - this should only happen on very first request
            logger.error("💥 CRITICAL: No cached data available and API fetch failed - returning error");

            return res.status(503).json({
                success: false,
                error: "Service unavailable",
                message: "Failed to fetch dashboard data and no cached data available. This is the first request or cache was manually cleared.",
                data: {
                    employees: [],
                    graphData: null,
                    escalations: []
                }
            });
        }

    } catch (error) {
        logger.error("Unexpected error in dashboard endpoint:", error);

        // Try to return cached data even on unexpected errors
        if (dashboardCache) {
            const cacheAge = Date.now() - dashboardCache.timestamp;
            logger.warn(`Returning cached data due to unexpected error (age: ${Math.round(cacheAge / 1000)}s)`);

            return res.json({
                success: true,
                data: dashboardCache.data,
                cached: true,
                timestamp: new Date(dashboardCache.timestamp).toISOString(),
                cacheAge: cacheAge,
                warning: "Unexpected error occurred, serving cached data"
            });
        }

        // No cache available - return error
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve dashboard data",
            data: {
                employees: [],
                graphData: null,
                escalations: []
            }
        });
    }
});

/**
 * POST /api/dashboard/clear-cache
 * 
 * Manually clear the dashboard cache.
 * Useful for debugging or forcing a fresh data fetch.
 * 
 * Requires authentication (should be protected by auth middleware)
 */
router.post("/clear-cache", (req, res) => {
    logger.info("Manually clearing dashboard cache");
    dashboardCache = null;

    res.json({
        success: true,
        message: "Dashboard cache cleared successfully"
    });
});

/**
 * GET /api/dashboard/cache-status
 * 
 * Get information about the current cache status.
 * Useful for monitoring and debugging.
 */
router.get("/cache-status", (req, res) => {
    if (!dashboardCache) {
        return res.json({
            cached: false,
            message: "No cache available"
        });
    }

    const age = Date.now() - dashboardCache.timestamp;
    const ageSeconds = Math.round(age / 1000);
    const ageMinutes = Math.round(age / 60000);
    const fresh = isCacheFresh();

    res.json({
        cached: true,
        fresh: fresh,
        stale: !fresh,
        age: age,
        ageSeconds: ageSeconds,
        ageMinutes: ageMinutes,
        ageFormatted: `${ageMinutes}m ${ageSeconds % 60}s`,
        timestamp: new Date(dashboardCache.timestamp).toISOString(),
        lastSuccessfulFetch: new Date(dashboardCache.lastSuccessfulFetch).toISOString(),
        dataKeys: Object.keys(dashboardCache.data),
        employeesCount: dashboardCache.data.employees?.length || 0,
        escalationsCount: dashboardCache.data.escalations?.length || 0,
        hasGraphData: !!dashboardCache.data.graphData,
        hasFailures: (dashboardCache.data.failures?.length || 0) > 0,
        failedEndpoints: dashboardCache.data.failures?.map(f => f.endpoint) || []
    });
});

export default router;

