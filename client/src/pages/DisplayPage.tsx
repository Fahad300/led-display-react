import React, { useEffect, useState } from "react";
import SlidesDisplay from "../components/SlidesDisplay";
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";

/**
 * DisplayPage: A route for fullscreen slide display only.
 * This page is designed for LED screens and is publicly accessible.
 * It can be controlled remotely from the home page (admin machine).
 */
const DisplayPage: React.FC = () => {
    const { onRefreshRequest, settings } = useDisplaySettings();
    const [showSyncIndicator, setShowSyncIndicator] = useState(false);

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

    return (
        <div className="w-full h-screen bg-black relative">
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

            {/* Cross-Device Sync Indicator */}
            <div className="absolute bottom-4 left-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live Sync</span>
                </div>
            </div>
        </div>
    );
};

export default DisplayPage;