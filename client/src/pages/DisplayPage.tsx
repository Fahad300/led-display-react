import React, { useEffect, useMemo } from "react";
import { SLIDE_TYPES, Employee } from "../types";
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
import realtimeSync, { SyncEvent } from '../utils/realtimeSync';
import { logger } from '../utils/logger';
import { videoPreloadManager } from '../utils/videoPreloadManager';
import { VideoSlide as VideoSlideType } from '../types';

/**
 * DisplayPage: Simple display page with two core functions:
 * 1. Get the latest settings
 * 2. Get the latest unified object
 */
const DisplayPage: React.FC = () => {
    // Get latest settings and unified data
    const { slides, employees, isLoading, syncFromDatabase } = useUnified();
    const { displaySettings, syncSettings } = useSettings();

    /**
     * Filter active slides and ensure video slides are only included when ready
     * This prevents buffering and black frames on the LED display
     */
    const activeSlides = useMemo(() => {
        return slides.filter(slide => {
            // Must be active
            if (!slide.active) return false;

            // For video slides, verify they're fully preloaded and ready
            if (slide.type === SLIDE_TYPES.VIDEO) {
                const videoSlide = slide as VideoSlideType;
                const isReady = videoPreloadManager.isVideoReady(videoSlide.data.videoUrl);

                if (!isReady) {
                    logger.debug(`⏳ DisplayPage: Skipping video slide (not ready): ${slide.name}`);
                }

                return isReady;
            }

            // All other slide types are always ready
            return true;
        });
    }, [slides]);

    /**
     * Preload all videos when slides change
     * This ensures videos are ready before being shown on the LED display
     */
    useEffect(() => {
        const preloadAllVideos = async () => {
            // Extract all video URLs
            const videoUrls: string[] = [];

            slides.forEach(slide => {
                if (slide.type === SLIDE_TYPES.VIDEO && slide.active) {
                    const videoSlide = slide as VideoSlideType;
                    if (videoSlide.data.videoUrl) {
                        videoUrls.push(videoSlide.data.videoUrl);
                    }
                }
            });

            if (videoUrls.length === 0) return;

            logger.info(`🎬 DisplayPage: Preloading ${videoUrls.length} videos`);

            // Preload all videos
            await videoPreloadManager.preloadMultipleVideos(videoUrls);

            logger.success(`✅ DisplayPage: Video preload complete`);
            videoPreloadManager.logCacheStats();
        };

        preloadAllVideos();
    }, [slides]);

    // Get latest data on mount
    useEffect(() => {
        const getLatestData = async () => {
            logger.sync("DisplayPage: Getting latest settings and unified data...");
            try {
                // Get latest settings
                await syncSettings();
                // Get latest unified object
                await syncFromDatabase();
                logger.success("DisplayPage: Latest data loaded successfully");
                logger.debug("DisplayPage: Current displaySettings:", displaySettings);
            } catch (error) {
                logger.error("DisplayPage: Failed to load latest data:", error);
            }
        };

        getLatestData();
    }, [syncSettings, syncFromDatabase]);

    // Debug: Log displaySettings changes
    useEffect(() => {
        logger.debug("DisplayPage: displaySettings changed:", displaySettings);
    }, [displaySettings]);

    // Force Swiper refresh when slides data changes
    useEffect(() => {
        logger.sync("DisplayPage: Slides data changed, Swiper will auto-refresh", {
            totalSlides: slides.length,
            activeSlides: activeSlides.length,
            slideIds: activeSlides.map(s => s.id)
        });

        // If we have very few active slides compared to total slides, force a refresh
        // This handles cases where the database might have stale data
        if (slides.length > 0 && activeSlides.length < slides.length * 0.5) {
            logger.warn("DisplayPage: Detected potential data mismatch, forcing refresh...");
            setTimeout(async () => {
                try {
                    logger.sync("DisplayPage: Forcing data refresh due to low active slide count...");
                    await syncFromDatabase();
                    logger.success("DisplayPage: Forced refresh completed");
                } catch (error) {
                    logger.error("DisplayPage: Forced refresh failed:", error);
                }
            }, 1000);
        }
    }, [slides, activeSlides, syncFromDatabase]);

    // Real-time sync - listen for immediate updates from HomePage
    useEffect(() => {
        logger.sync("DisplayPage: Setting up real-time sync listeners...");

        // Listen for slides changes from HomePage
        const unsubscribeSlides = realtimeSync.addEventListener('slides', async (event: SyncEvent) => {
            logger.sync("DisplayPage: Slides data changed, Swiper will auto-refresh", {
                totalSlides: event.data.totalCount,
                activeSlides: event.data.activeCount,
                slideIds: event.data.slides.map((s: any) => s.id),
                changes: event.data.changes,
                source: event.source
            });

            try {
                // Sync from database to get the latest data
                await syncFromDatabase();
                logger.success("DisplayPage: Successfully synced slides from database");
            } catch (error) {
                logger.error("DisplayPage: Failed to sync slides:", error);
            }
        });

        // Listen for settings changes from HomePage
        const unsubscribeSettings = realtimeSync.addEventListener('settings', async (event: SyncEvent) => {
            logger.sync("DisplayPage: Settings changed, updating display", {
                changes: event.data.changes,
                newSettings: event.data.displaySettings,
                source: event.source
            });

            try {
                // Sync settings from database
                await syncSettings();
                logger.success("DisplayPage: Successfully synced settings from database");
            } catch (error) {
                logger.error("DisplayPage: Failed to sync settings:", error);
            }
        });

        // Listen for API data changes
        const unsubscribeApiData = realtimeSync.addEventListener('api-data', async (event: SyncEvent) => {
            logger.data("DisplayPage: API data changed, updating display", {
                employeesCount: event.data.employees?.length || 0,
                hasGraphData: !!event.data.graphData,
                changes: event.data.changes,
                source: event.source
            });

            try {
                // Sync from database to get the latest API data
                await syncFromDatabase();
                logger.success("DisplayPage: Successfully synced API data from database");
            } catch (error) {
                logger.error("DisplayPage: Failed to sync API data:", error);
            }
        });

        // Listen for force reload events
        const unsubscribeForceReload = realtimeSync.addEventListener('force-reload', async (event: SyncEvent) => {
            logger.sync("DisplayPage: Force reload requested", {
                reason: event.data.reason,
                source: event.source
            });

            try {
                // Sync both settings and data
                await Promise.all([syncSettings(), syncFromDatabase()]);
                logger.success("DisplayPage: Force reload completed successfully");
            } catch (error) {
                logger.error("DisplayPage: Force reload failed:", error);
            }
        });

        // Fallback: Periodic sync every 5 minutes as backup (much less frequent)
        const fallbackInterval = setInterval(async () => {
            logger.sync("DisplayPage: Fallback sync (every 5 minutes)...");
            try {
                await Promise.all([syncSettings(), syncFromDatabase()]);
                logger.success("DisplayPage: Fallback sync completed");
            } catch (error) {
                logger.error("DisplayPage: Fallback sync failed:", error);
            }
        }, 300000); // 5 minutes

        logger.success("DisplayPage: Real-time sync listeners established");

        // Cleanup function
        return () => {
            logger.debug("DisplayPage: Cleaning up real-time sync listeners");
            unsubscribeSlides();
            unsubscribeSettings();
            unsubscribeApiData();
            unsubscribeForceReload();
            clearInterval(fallbackInterval);
        };
    }, [syncSettings, syncFromDatabase]);

    // Listen for settings changes and force reload events from home page
    useEffect(() => {
        const handleSettingsChanged = async (event: Event) => {
            const customEvent = event as CustomEvent;
            logger.debug("DisplayPage: Settings changed event received", customEvent.detail);

            // Since DisplayPage might be in a different tab, we need to sync from database
            // to get the latest settings AND slides data that were just saved together
            try {
                logger.sync("DisplayPage: Syncing settings and slides from database...");
                await syncSettings();
                await syncFromDatabase(); // Also sync slides data since they're saved together
                logger.success("DisplayPage: Settings and slides synced successfully");

                // Log the current state after sync
                logger.debug("DisplayPage: Current state after sync:", {
                    totalSlides: slides.length,
                    activeSlides: slides.filter(s => s.active).length,
                    slideIds: slides.filter(s => s.active).map(s => s.id)
                });
            } catch (error) {
                logger.error("DisplayPage: Failed to sync settings and slides:", error);
            }
        };

        const handleForceReload = async (event: Event) => {
            const customEvent = event as CustomEvent;
            logger.sync("DisplayPage: Force reload event received", customEvent.detail);
            try {
                // Refresh data instead of full page reload
                logger.sync("DisplayPage: Refreshing data from database...");
                await syncSettings();
                await syncFromDatabase();
                logger.success("DisplayPage: Data refreshed successfully without page reload");
            } catch (error) {
                logger.error("DisplayPage: Failed to refresh data:", error);
                // Fallback to page reload if data refresh fails
                logger.sync("DisplayPage: Falling back to page reload...");
                window.location.reload();
            }
        };

        window.addEventListener('settingsChanged', handleSettingsChanged);
        window.addEventListener('forceDisplayReload', handleForceReload);

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChanged);
            window.removeEventListener('forceDisplayReload', handleForceReload);
        };
    }, [syncSettings, syncFromDatabase]);

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
            {/* SwiperSlideshow Component - Stable key to prevent unnecessary reinitializations */}
            <SwiperSlideshow
                key={`display-slideshow-${activeSlides.map(s => s.id).sort().join('-')}-${displaySettings.swiperEffect}`}
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