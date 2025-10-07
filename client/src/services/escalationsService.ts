import { backendApi } from "./api";

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

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`🔄 Escalations API attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
};

/**
 * Fetch current escalations data from API
 * Returns data for the current escalations slide
 */
export const fetchCurrentEscalations = async (): Promise<any[]> => {
    try {
        // Use retry logic with exponential backoff
        const res = await retryWithBackoff(async () => {
            // Fetching current escalations from API
            return await backendApi.get('/api/proxy/ongoing-escalations');
        });

        const apiData = res.data;

        // Transform API response to match CurrentEscalationsSlideData interface
        const transformedData = Array.isArray(apiData) ? apiData : (apiData.escalations || []);

        return transformedData.map((escalation: any) => ({
            ticketCategory: escalation.ticketCategory || escalation.category || "Unknown",
            teamName: escalation.teamName || escalation.team || "Unknown Team",
            clientName: escalation.clientName || escalation.client || "Unknown Client",
            ticketSummary: escalation.ticketSummary || escalation.summary || escalation.description || "No summary available",
            averageResponseTime: escalation.averageResponseTime || escalation.responseTime || "Unknown",
            ticketStatus: escalation.ticketStatus || escalation.status || "Unknown",
            currentStatus: escalation.currentStatus || escalation.currentState || escalation.ticketStatus || "Unknown"
        }));
    } catch (error) {
        console.error('❌ Error fetching current escalations data:', error);

        // Return fallback data in case of API failure
        return [
            {
                ticketCategory: "API Error",
                teamName: "System",
                clientName: "Internal",
                ticketSummary: "Failed to fetch escalations data from API",
                averageResponseTime: "N/A",
                ticketStatus: "Error",
                currentStatus: "Error"
            }
        ];
    }
};

