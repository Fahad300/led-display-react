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

                        return;
                    } catch (error) {

                    }

                    // Method 2: Try document.body
                    try {
                        await document.body.requestFullscreen();

                        return;
                    } catch (error) {

                    }
                }
            } catch (error) {

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

            // Show sync indicator briefly
            setShowSyncIndicator(true);

            // Enhanced cache clearing and refresh
            const performEnhancedRefresh = async () => {
                try {


                    // Clear any cached data
                    if ('caches' in window) {
                        try {
                            const cacheNames = await caches.keys();
                            await Promise.all(
                                cacheNames.map(cacheName => caches.delete(cacheName))
                            );

                        } catch (cacheError) {

                        }
                    }

                    // Clear any stored data
                    try {
                        // Clear sessionStorage
                        sessionStorage.clear();


                        // Clear localStorage (but keep auth token if exists)
                        const authToken = localStorage.getItem("token");
                        localStorage.clear();
                        if (authToken) {
                            localStorage.setItem("token", authToken);

                        } else {

                        }
                    } catch (storageError) {

                    }

                    // Force reload all images and media
                    try {
                        const images = document.querySelectorAll('img');
                        images.forEach(img => {
                            if (img.src) {
                                img.src = img.src + '?t=' + Date.now();
                            }
                        });

                    } catch (imgError) {

                    }

                    // Wait a bit then perform hard refresh
                    setTimeout(() => {
                        setShowSyncIndicator(false);


                        // Force reload with cache clearing
                        window.location.reload();
                    }, 1500);

                } catch (error) {
                    console.error("Error during enhanced refresh:", error);
                    // Fallback to simple refresh
                    setTimeout(() => {
                        setShowSyncIndicator(false);
                        window.location.reload();
                    }, 1000);
                }
            };

            performEnhancedRefresh();
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

            }
        } catch (error) {

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

            {/* Cross-Device Sync Indicator */}
            <div className="absolute bottom-4 left-4 z-50 text-white text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live Sync</span>
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