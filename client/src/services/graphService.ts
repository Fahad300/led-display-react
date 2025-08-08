import { backendApi } from './api';
import { GraphSlideData } from '../types';

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`API call failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
};

/**
 * Get current year for dynamic title
 */
const getCurrentYear = (): number => {
    return new Date().getFullYear();
};

/**
 * Fetch team wise data from API
 * Returns data for the team wise data graph
 */
export const fetchTeamWiseData = async (): Promise<GraphSlideData> => {
    try {
        // Use retry logic with exponential backoff
        const res = await retryWithBackoff(async () => {
            console.log('Fetching team wise data from API...');
            return await backendApi.get('/api/proxy/jira-chart');
        });

        const apiData = res.data;
        console.log('Successfully fetched team wise data:', apiData);

        // Transform API response to match GraphSlideData interface
        const transformedData = apiData.labels.map((teamName: string, teamIndex: number) => {
            const teamData = apiData.data[teamIndex] || [];
            const dataPoints = teamData.map((value: number, priorityIndex: number) => ({
                date: new Date().toISOString(),
                value: value,
                category: apiData.priorities[priorityIndex] || `Priority ${priorityIndex + 1}`
            }));
            return { teamName: teamName, dataPoints: dataPoints };
        });

        const currentYear = getCurrentYear();

        return {
            title: `Team Wise Data ${currentYear}`,
            description: "Current escalation distribution across teams by priority level",
            graphType: 'bar',
            data: transformedData,
            timeRange: 'monthly',
            lastUpdated: new Date().toISOString(),
            categories: apiData.priorities || ['C-Level (Top Priority: fix immediately)', 'P1 - Blocker (fix immediately)', 'P2 - Critical (must fix)', 'P3 - Major (really should fix)', 'P4 - Minor (should fix)']
        };
    } catch (error) {
        console.error('Error fetching team wise data via backend proxy:', error);

        const currentYear = getCurrentYear();

        // Return fallback data structure
        return {
            title: `Team Wise Data ${currentYear}`,
            description: "Current escalation distribution across teams by priority level",
            graphType: 'bar',
            data: [],
            timeRange: 'monthly',
            lastUpdated: new Date().toISOString(),
            categories: ['C-Level (Top Priority: fix immediately)', 'P1 - Blocker (fix immediately)', 'P2 - Critical (must fix)', 'P3 - Major (really should fix)', 'P4 - Minor (should fix)']
        };
    }
};
