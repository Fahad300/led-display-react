import React, { useEffect, useState } from "react";
import SlidesDisplay from "../components/SlidesDisplay";
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";

/**
 * DisplayPage: A route for fullscreen slide display only.
 * This page is designed for LED screens and is publicly accessible.
 * It can be controlled remotely from the home page (admin machine).
 */
const DisplayPage: React.FC = () => {
    const { onRefreshRequest } = useDisplaySettings();
    const [showSyncIndicator, setShowSyncIndicator] = useState(false);

    // Register refresh callback
    useEffect(() => {
        const cleanup = onRefreshRequest(() => {
            // Show sync indicator briefly
            setShowSyncIndicator(true);
            setTimeout(() => {
                setShowSyncIndicator(false);
                // Force a hard refresh of the page
                window.location.reload();
            }, 1000);
        });

        return cleanup;
    }, [onRefreshRequest]);

    return (
        <div className="w-full h-screen bg-black relative">
            <SlidesDisplay />

            {/* Sync Indicator */}
            {showSyncIndicator && (
                <div className="absolute top-4 left-4 z-[10001] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refreshing...</span>
                    </div>
                </div>
            )}

            {/* Cross-Device Sync Indicator */}
            <div className="absolute bottom-4 left-4 z-[10001] bg-blue-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live Sync</span>
                </div>
            </div>
        </div>
    );
};

export default DisplayPage;