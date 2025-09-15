import React, { useEffect, useState, useRef, useCallback } from "react";
import { SLIDE_TYPES } from "../types";
import { ImageSlide } from "../components/slides/ImageSlide";
import { VideoSlide } from "../components/slides/VideoSlide";
import NewsSlideComponent from "../components/NewsSlideComponent";
import { EventSlideComponent } from "../components/slides/EventSlide";
import DocumentSlide from "../components/slides/DocumentSlide";
import TextSlide from "../components/slides/TextSlide";
import { TeamComparisonSlideComponent } from "../components/slides/TeamComparisonSlide";
import { CurrentEscalationsSlideComponent } from "../components/slides/CurrentEscalationsSlide";
import { GraphSlide } from "../components/slides/GraphSlide";
import SlideLogoOverlay from "../components/SlideLogoOverlay";
import { TestingOverlay } from "../components/TestingOverlay";
import DigitalClock from "../components/DigitalClock";
import SwiperSlideshow from "../components/SwiperSlideshow";
import { useUnified } from '../contexts/UnifiedContext';
import { useSettings } from '../contexts/SettingsContext';

/**
 * DisplayPage: A simple route for fullscreen slide display.
 * Uses the centralized SwiperSlideshow component for consistency with HomePage.
 */
const DisplayPage: React.FC = () => {
    // Load unified data from context
    const { slides, isLoading, syncFromDatabase, isDisplayPage } = useUnified();
    const { displaySettings } = useSettings();
    const [isSyncing, setIsSyncing] = useState(false);

    // Refs to track previous values for change detection
    const prevSlidesRef = useRef<string>("");
    const prevIsLoadingRef = useRef<boolean>(false);

    // Force update key for SwiperSlideshow
    const [forceUpdateKey, setForceUpdateKey] = useState(0);

    // Filter active slides
    const activeSlides = slides.filter(slide => slide.active);

    // Force update function to trigger slideshow re-render
    const forceSlideshowUpdate = useCallback(() => {
        setForceUpdateKey(prev => prev + 1);
        console.log("🔄 DisplayPage: Forcing slideshow update");
    }, []);

    // Direct sync function that immediately updates the slideshow
    const directSync = useCallback(async () => {
        if (isSyncing) return; // Prevent multiple simultaneous syncs

        setIsSyncing(true);
        try {
            console.log("🔄 DisplayPage: Performing direct sync...");
            await syncFromDatabase();

            // Force slideshow update after sync
            setTimeout(() => {
                forceSlideshowUpdate();
            }, 100); // Small delay to ensure data is processed
        } catch (error) {
            console.error("❌ DisplayPage: Direct sync failed:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, syncFromDatabase, forceSlideshowUpdate]);

    // Debug log for display page detection (only once)
    useEffect(() => {
        console.log("🖥️ DisplayPage: isDisplayPage =", isDisplayPage);
    }, [isDisplayPage]); // Include isDisplayPage in dependencies

    // Listen for settings changes and sync immediately
    useEffect(() => {
        const handleSettingsChange = () => {
            console.log("🔄 DisplayPage: Settings changed, syncing...");
            directSync();
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'displaySettings' && e.newValue) {
                console.log("🔄 DisplayPage: Settings changed in localStorage, syncing...");
                directSync();
            }
        };

        const handleSlidesChange = (e: CustomEvent) => {
            console.log("🔄 DisplayPage: Slides changed event received, forcing update...");
            forceSlideshowUpdate();
        };

        // Listen for custom settings change events
        window.addEventListener('settingsChanged', handleSettingsChange);
        // Listen for localStorage changes (cross-tab communication)
        window.addEventListener('storage', handleStorageChange);
        // Listen for slides change events
        window.addEventListener('slidesChanged', handleSlidesChange as EventListener);

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('slidesChanged', handleSlidesChange as EventListener);
        };
    }, [directSync, forceSlideshowUpdate]);

    // Force sync on mount to ensure we have the latest data
    useEffect(() => {
        const forceSync = async () => {
            console.log("🔄 DisplayPage: Force syncing on mount...");
            try {
                await syncFromDatabase();
            } catch (error) {
                console.error("❌ DisplayPage: Force sync failed:", error);
            }
        };

        // Small delay to ensure context is fully initialized
        const timeoutId = setTimeout(forceSync, 100);
        return () => clearTimeout(timeoutId);
    }, [syncFromDatabase]);

    // Debug logging - only when unified data actually changes
    useEffect(() => {
        const currentSlidesString = JSON.stringify(slides.map(slide => ({
            id: slide.id,
            name: slide.name,
            type: slide.type,
            active: slide.active,
            duration: slide.duration
        })));

        // Only log if slides data has changed
        if (currentSlidesString !== prevSlidesRef.current) {
            console.log("🖥️ DisplayPage: Unified slides data changed:", {
                isLoading,
                slidesCount: slides.length,
                activeSlidesCount: activeSlides.length,
                slidesSummary: slides.map(slide => ({
                    id: slide.id,
                    name: slide.name,
                    type: slide.type,
                    active: slide.active,
                    duration: slide.duration
                })),
                activeSlidesDetails: activeSlides.map(slide => ({
                    id: slide.id,
                    name: slide.name,
                    type: slide.type,
                    active: slide.active,
                    duration: slide.duration
                }))
            });
            prevSlidesRef.current = currentSlidesString;
        }

        // Only log if loading state has changed
        if (isLoading !== prevIsLoadingRef.current) {
            console.log("🖥️ DisplayPage: Loading state changed:", { isLoading });
            prevIsLoadingRef.current = isLoading;
        }
    }, [slides, isLoading, activeSlides]); // Include activeSlides in dependencies

    // Force slideshow update when slides data changes
    useEffect(() => {
        if (slides.length > 0) {
            console.log("🔄 DisplayPage: Slides data changed, forcing slideshow update");
            forceSlideshowUpdate();
        }
    }, [slides, forceSlideshowUpdate]);

    // Render slide content
    const renderSlideContent = (slide: any, onVideoEnd?: () => void) => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return <ImageSlide slide={slide} />;
            case SLIDE_TYPES.VIDEO:
                return <VideoSlide slide={slide} onVideoEnd={onVideoEnd} />;
            case SLIDE_TYPES.NEWS:
                return <NewsSlideComponent slide={slide} />;
            case SLIDE_TYPES.EVENT:
                return <EventSlideComponent slide={slide} />;
            case SLIDE_TYPES.DOCUMENT:
                return <DocumentSlide slide={slide} />;
            case SLIDE_TYPES.TEXT:
                return <TextSlide slide={slide} />;
            case SLIDE_TYPES.TEAM_COMPARISON:
                return <TeamComparisonSlideComponent slide={slide} />;
            case SLIDE_TYPES.CURRENT_ESCALATIONS:
                return <CurrentEscalationsSlideComponent slide={slide} />;
            case SLIDE_TYPES.GRAPH:
                return <GraphSlide slide={slide} />;
            default:
                return <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                    <p>Unknown slide type: {slide.type}</p>
                </div>;
        }
    };

    // Force fullscreen when display page loads (LED screen mode)
    useEffect(() => {
        const forceFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (error) {
                // Ignore fullscreen errors
            }
        };

        forceFullscreen();
    }, []);

    // Periodic sync from database (every 30 seconds for display page)
    // This ensures the display page gets updates when HomePage makes changes
    useEffect(() => {
        const syncInterval = setInterval(() => {
            console.log("🔄 DisplayPage: Periodic sync triggered...");
            directSync();
        }, 30000); // 30 seconds for more responsive updates

        return () => clearInterval(syncInterval);
    }, [directSync]);

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading slides...</p>
                </div>
            </div>
        );
    }

    if (activeSlides.length === 0) {
        return (
            <div className="w-full h-screen relative bg-black overflow-hidden">
                {/* Background Video */}
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/soliton-bg.mp4" type="video/mp4" />
                </video>

                {/* Black Overlay with 50% opacity */}
                <div className="absolute inset-0 bg-black bg-opacity-80"></div>

                {/* Pulsing Logo in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        {/* Outer pulsing ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse"></div>

                        {/* Logo with custom pulsing animation */}
                        <div className="relative z-10 animate-pulse" style={{
                            animation: 'logoPulse 2s ease-in-out infinite'
                        }}>
                            <img
                                src="/images/logo-persivia.svg"
                                alt="Persivia Logo"
                                className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Digital Clock */}
                {displaySettings.showDateStamp && (
                    <div className="absolute top-4 right-4 z-40">
                        <DigitalClock />
                    </div>
                )}

                {/* Sync Indicator - Only show when syncing */}
                {isSyncing && (
                    <div className="absolute top-4 left-4 z-40 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Syncing...</span>
                        </div>
                    </div>
                )}

                {/* Logo Overlay - Positioned last to ensure it's on top */}
                <SlideLogoOverlay
                    isFullscreen={true}
                    hideLogo={displaySettings.hidePersiviaLogo}
                />
            </div>
        );
    }

    return (
        <div
            className="display-page-fullscreen bg-black relative"
            onClick={async () => {
                // Try fullscreen on click
                try {
                    if (!document.fullscreenElement) {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (error) {
                    // Ignore
                }
            }}
        >
            {/* SwiperSlideshow Component - Same as HomePage */}
            <SwiperSlideshow
                key={`slideshow-${forceUpdateKey}-${activeSlides.length}`}
                slides={activeSlides}
                renderSlideContent={renderSlideContent}
                hidePagination={displaySettings.hidePagination}
                hideArrows={displaySettings.hideArrows}
                effect={displaySettings.swiperEffect || "slide"}
                isFullscreen={true}
            />

            {/* Digital Clock */}
            {displaySettings.showDateStamp && (
                <div className="absolute top-4 right-4 z-40">
                    <DigitalClock />
                </div>
            )}

            {/* Sync Indicator - Only show when syncing */}
            {isSyncing && (
                <div className="absolute top-4 right-4 z-40 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Syncing...</span>
                    </div>
                </div>
            )}

            {/* Testing Overlay */}
            <TestingOverlay />

            {/* Logo Overlay - Positioned last to ensure it's on top */}
            <SlideLogoOverlay
                isFullscreen={true}
                hideLogo={displaySettings.hidePersiviaLogo}
            />
        </div>
    );
};

export default DisplayPage;