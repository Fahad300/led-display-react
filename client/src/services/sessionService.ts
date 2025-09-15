import { backendApi } from './api';
import { SlideshowData } from '../types';

export interface SessionData {
    sessionId: string;
    displaySettings: any;
    slideData: any[];
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

            // If no token, create a display-only session
            if (!token) {
                this.sessionToken = "display-session-" + Date.now();
                return this.sessionToken;
            }

            const headers: any = {};
            headers.Authorization = `Bearer ${token}`;

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
            this.sessionToken = "display-session-" + Date.now();
            return this.sessionToken;
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

    /**
 * Update slide data
 */
    async updateSlideData(slides: any[]): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // No authentication token, skipping slide data update
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            await backendApi.put(`/api/sessions/slide-data`, {
                slides
            }, { headers });
        } catch (error) {
            console.error("Error updating slide data:", error);
            // Don't throw for display purposes
            // Continuing without slide data update
        }
    }

    /**
 * Update app settings
 */
    async updateAppSettings(settings: any): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // No authentication token, skipping app settings update
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            await backendApi.put(`/api/sessions/app-settings`, {
                settings
            }, { headers });
        } catch (error) {
            console.error("Error updating app settings:", error);
            // Don't throw for display purposes
            // Continuing without app settings update
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
    } | null> {
        try {


            try {
                const response = await backendApi.get(`/api/sessions/latest`);
                if (response.data && response.data.slideshowData) {
                    const slideshowData = response.data.slideshowData;
                    return {
                        displaySettings: slideshowData.displaySettings,
                        slideData: slideshowData.slides
                    };
                }
            } catch (error) {
                console.debug("No latest session available from database:", error);
            }

            // Fallback: try to get current session data (for authenticated users)
            try {
                const sessionData = await this.getCurrentSession();
                if (sessionData) {

                    return {
                        displaySettings: sessionData.displaySettings,
                        slideData: sessionData.slideData
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
    }): Promise<void> {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem("token");
            if (!token) {
                // User not authenticated, skipping server sync
                return;
            }



            const promises: Promise<void>[] = [];

            // displaySettings now handled by unified slideshow data

            if (data.slideData) {
                promises.push(this.updateSlideData(data.slideData));
            }

            // appSettings removed - using unified slideshow data instead

            await Promise.all(promises);

        } catch (error) {
            console.error("Error syncing to database:", error);
            // Don't throw error for display purposes - just log it
            // Continuing without server sync
        }
    }

    /**
     * Save unified slideshow data to the database
     */
    async saveSlideshowData(slideshowData: SlideshowData): Promise<void> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token found, skipping slideshow data save (display-only mode)");
                return;
            }

            const headers: any = {};
            headers.Authorization = `Bearer ${token}`;

            await backendApi.post(`/api/sessions/slideshow-data`, { slideshowData }, { headers });
            console.log("✅ Slideshow data saved to database:", {
                slidesCount: slideshowData.slides.length,
                activeSlidesCount: slideshowData.slides.filter((slide: any) => slide.active).length,
                displaySettings: slideshowData.displaySettings,
                timestamp: slideshowData.lastUpdated,
                version: slideshowData.version
            });
        } catch (error) {
            console.error("Error saving slideshow data:", error);
            throw error;
        }
    }

    /**
     * Load unified slideshow data from the database
     */
    async loadSlideshowData(): Promise<SlideshowData | null> {
        try {
            const token = localStorage.getItem("token");

            if (token) {
                // Try authenticated endpoint first
                try {
                    const headers: any = {};
                    headers.Authorization = `Bearer ${token}`;

                    const response = await backendApi.get(`/api/sessions/slideshow-data`, { headers });
                    const slideshowData = response.data.slideshowData;

                    if (slideshowData) {
                        console.log("✅ Slideshow data loaded from database (authenticated):", {
                            slidesCount: slideshowData.slides?.length || 0,
                            activeSlidesCount: slideshowData.slides?.filter((slide: any) => slide.active).length || 0,
                            displaySettings: slideshowData.displaySettings,
                            lastUpdated: slideshowData.lastUpdated,
                            version: slideshowData.version
                        });
                        return slideshowData;
                    }
                } catch (authError) {
                    console.log("Authenticated endpoint failed, trying public endpoint:", authError);
                }
            }

            // Fallback to public endpoint (works for both authenticated and unauthenticated users)
            try {
                const response = await backendApi.get(`/api/sessions/latest`);
                const slideshowData = response.data.slideshowData;

                if (slideshowData) {
                    console.log("✅ Slideshow data loaded from database (public):", {
                        slidesCount: slideshowData.slides?.length || 0,
                        activeSlidesCount: slideshowData.slides?.filter((slide: any) => slide.active).length || 0,
                        displaySettings: slideshowData.displaySettings,
                        lastUpdated: slideshowData.lastUpdated,
                        version: slideshowData.version
                    });
                    return slideshowData;
                }
            } catch (publicError) {
                console.log("Public endpoint also failed:", publicError);
            }

            return null;
        } catch (error) {
            console.error("Error loading slideshow data:", error);
            return null;
        }
    }

    /**
     * Trigger immediate refresh on all remote displays
     */
    async triggerRemoteRefresh(refreshType: "all" | "data" | "settings" | "slides" = "all"): Promise<void> {
        try {
            const response = await backendApi.post("/api/sessions/trigger-refresh", {
                refreshType
            });

            console.debug(`Remote refresh triggered: ${refreshType}`, response.data);
            return response.data;
        } catch (error) {
            console.error("Error triggering remote refresh:", error);
            throw error;
        }
    }

    /**
     * Initialize session on app startup
     */
    async initializeSession(): Promise<void> {
        try {
            // Initializing session
            await this.createSession();

        } catch (error) {
            console.error("Error initializing session:", error);
            // For display purposes, we don't need to fail completely
            // Continuing without session initialization
        }
    }


}

export const sessionService = new SessionService();
export default sessionService; 