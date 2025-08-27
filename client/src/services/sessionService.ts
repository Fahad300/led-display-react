import { backendApi } from './api';

export interface SessionData {
    sessionId: string;
    displaySettings: any;
    slideData: any[];
    appSettings: any;
    lastActivity: string;
    deviceInfo: string;
}

export interface SessionInfo {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    isActive: boolean;
    lastActivity: string;
    createdAt: string;
}

class SessionService {
    private sessionToken: string | null = null;

    constructor() {
        console.log("🌍 SessionService initialized for database-driven operations");
    }



    /**
     * Get device information
     */
    private getDeviceInfo(): string {
        return `${navigator.userAgent} - ${navigator.platform}`;
    }

    /**
     * Get IP address (simplified - in production you'd get this from server)
     */
    private getIpAddress(): string {
        return "client-side"; // In production, this would be determined server-side
    }

    /**
 * Create or update session
 */
    async createSession(): Promise<string> {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await backendApi.post(`/api/sessions/create`, {
                deviceInfo: this.getDeviceInfo(),
                ipAddress: this.getIpAddress()
            }, { headers });

            this.sessionToken = response.data.sessionToken;
            if (!this.sessionToken) {
                throw new Error("Failed to create session: No session token received");
            }
            return this.sessionToken;
        } catch (error) {
            console.error("Error creating session:", error);
            // For display purposes, we don't need to throw - just return a fallback
            return "display-session";
        }
    }

    /**
 * Get current session data
 */
    async getCurrentSession(): Promise<SessionData | null> {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await backendApi.get(`/api/sessions/current`, { headers });
            return response.data;
        } catch (error) {
            console.error("Error getting session:", error);
            return null;
        }
    }

    /**
 * Update display settings
 */
    async updateDisplaySettings(settings: any): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No authentication token, skipping display settings update");
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            await backendApi.put(`/api/sessions/display-settings`, {
                settings
            }, { headers });
        } catch (error) {
            console.error("Error updating display settings:", error);
            // Don't throw for display purposes
            console.log("Continuing without display settings update");
        }
    }

    /**
 * Update slide data
 */
    async updateSlideData(slides: any[]): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No authentication token, skipping slide data update");
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            await backendApi.put(`/api/sessions/slide-data`, {
                slides
            }, { headers });
        } catch (error) {
            console.error("Error updating slide data:", error);
            // Don't throw for display purposes
            console.log("Continuing without slide data update");
        }
    }

    /**
 * Update app settings
 */
    async updateAppSettings(settings: any): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No authentication token, skipping app settings update");
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            await backendApi.put(`/api/sessions/app-settings`, {
                settings
            }, { headers });
        } catch (error) {
            console.error("Error updating app settings:", error);
            // Don't throw for display purposes
            console.log("Continuing without app settings update");
        }
    }

    /**
 * Logout and deactivate session
 */
    async logout(): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            await backendApi.delete(`/api/sessions/logout`, { headers });
            this.sessionToken = null;
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    }

    /**
 * Get all sessions for the user
 */
    async getAllSessions(): Promise<SessionInfo[]> {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await backendApi.get(`/api/sessions/all`, { headers });
            return response.data;
        } catch (error) {
            console.error("Error getting sessions:", error);
            return [];
        }
    }

    /**
     * Sync settings from server (works for both authenticated and unauthenticated)
     */
    async syncFromServer(): Promise<{
        displaySettings: any;
        slideData: any[];
        appSettings: any;
    } | null> {
        try {
            console.log("🔄 Syncing from database...");

            try {
                const response = await backendApi.get(`/api/sessions/latest`);
                if (response.data) {
                    console.log("✅ Successfully synced from database");
                    return {
                        displaySettings: response.data.displaySettings,
                        slideData: response.data.slideData,
                        appSettings: response.data.appSettings
                    };
                }
            } catch (error) {
                console.debug("No latest session available from database:", error);
            }

            // Fallback: try to get current session data (for authenticated users)
            try {
                const sessionData = await this.getCurrentSession();
                if (sessionData) {
                    console.log("✅ Successfully synced from authenticated session");
                    return {
                        displaySettings: sessionData.displaySettings,
                        slideData: sessionData.slideData,
                        appSettings: sessionData.appSettings
                    };
                }
            } catch (error) {
                console.debug("No authenticated session available:", error);
            }

            return null;
        } catch (error) {
            console.error("Error syncing from database:", error);
            return null;
        }
    }

    /**
     * Sync settings to server
     */
    async syncToServer(data: {
        displaySettings?: any;
        slideData?: any[];
        appSettings?: any;
    }): Promise<void> {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("User not authenticated, skipping server sync");
                return;
            }

            console.log("🔄 Syncing to database...");

            const promises: Promise<void>[] = [];

            if (data.displaySettings) {
                promises.push(this.updateDisplaySettings(data.displaySettings));
            }

            if (data.slideData) {
                promises.push(this.updateSlideData(data.slideData));
            }

            if (data.appSettings) {
                promises.push(this.updateAppSettings(data.appSettings));
            }

            await Promise.all(promises);
            console.log("✅ Successfully synced to database");
        } catch (error) {
            console.error("Error syncing to database:", error);
            // Don't throw error for display purposes - just log it
            console.log("Continuing without server sync");
        }
    }

    /**
     * Initialize session on app startup
     */
    async initializeSession(): Promise<void> {
        try {
            console.log("🌍 Initializing session...");
            await this.createSession();
            console.log("✅ Session initialized successfully");
        } catch (error) {
            console.error("Error initializing session:", error);
            // For display purposes, we don't need to fail completely
            console.log("Continuing without session initialization");
        }
    }


}

export const sessionService = new SessionService();
export default sessionService; 