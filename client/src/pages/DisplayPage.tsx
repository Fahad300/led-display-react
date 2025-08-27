import React, { useEffect, useState } from "react";
import SlidesDisplay from "../components/SlidesDisplay";
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";
import { sessionService } from "../services/sessionService";

/**
 * DisplayPage: A route for fullscreen slide display only.
 * This page is designed for LED screens and is publicly accessible.
 * It can be controlled remotely from the home page (admin machine).
 */
const DisplayPage: React.FC = () => {
    const { onRefreshRequest, settings } = useDisplaySettings();
    const [showSyncIndicator, setShowSyncIndicator] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Force fullscreen when display page loads (LED screen mode)
    useEffect(() => {
        const forceFullscreen = async () => {
            try {
                // Try multiple methods to ensure fullscreen works
                if (!document.fullscreenElement) {
                    // Method 1: Try document.documentElement
                    try {
                        await document.documentElement.requestFullscreen();
                        console.log("LED Display: Entered fullscreen via documentElement");
                        return;
                    } catch (error) {
                        console.log("documentElement fullscreen failed, trying body...");
                    }

                    // Method 2: Try document.body
                    try {
                        await document.body.requestFullscreen();
                        console.log("LED Display: Entered fullscreen via body");
                        return;
                    } catch (error) {
                        console.log("body fullscreen failed");
                    }
                }
            } catch (error) {
                console.log("Could not enter fullscreen automatically:", error);
            }
        };

        // Try immediately and then retry after delays
        forceFullscreen();

        // Retry after 500ms
        const timer1 = setTimeout(forceFullscreen, 500);

        // Retry after 1 second
        const timer2 = setTimeout(forceFullscreen, 1000);

        // Retry after 2 seconds
        const timer3 = setTimeout(forceFullscreen, 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    // Monitor fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);



    // Register refresh callback
    useEffect(() => {
        const cleanup = onRefreshRequest(() => {
            console.log("🔄 Display page received refresh request");
            // Show sync indicator briefly
            setShowSyncIndicator(true);

            setTimeout(() => {
                setShowSyncIndicator(false);
                // Force a hard refresh of the page
                console.log("🔄 Performing hard refresh of display page");
                window.location.reload();
            }, 1000);
        });

        return cleanup;
    }, [onRefreshRequest]);

    // Show sync indicator when settings change
    useEffect(() => {
        setShowSyncIndicator(true);
        const timer = setTimeout(() => {
            setShowSyncIndicator(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [settings]);

    // Force fullscreen on any user interaction
    const handleForceFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                console.log("LED Display: Forced fullscreen on interaction");
            }
        } catch (error) {
            console.log("Force fullscreen failed:", error);
        }
    };

    return (
        <div
            className="display-page-fullscreen bg-black relative"
            onClick={handleForceFullscreen}
            onKeyDown={handleForceFullscreen}
            tabIndex={0}
        >
            {/* Sync Indicator */}
            {showSyncIndicator && (
                <div className="absolute top-4 left-4 z-50 bg-green-500 text-white px-3 py-1 rounded-lg shadow-lg animate-pulse">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <span className="text-sm font-medium">Syncing...</span>
                    </div>
                </div>
            )}



            {/* Main Display */}
            <SlidesDisplay />

            {/* Cross-Device Sync Indicator with Environment */}
            <div className="absolute bottom-4 left-4 z-50 text-white text-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Live Sync</span>
                    </div>

                    {/* Environment Indicator */}
                    <div className="flex items-center gap-1 text-xs bg-black/50 px-2 py-1 rounded">
                        <span className="font-mono">
                            {sessionService.getEnvironmentStatus().environment === "production" ? "🌍 PROD" : "💻 DEV"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Fullscreen Status Indicator */}
            {!isFullscreen && (
                <span></span>
            )}


        </div>
    );
};

export default DisplayPage;