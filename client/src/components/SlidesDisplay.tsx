import React, { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnified } from "../contexts/UnifiedContext";
import { useSettings } from "../contexts/SettingsContext";
import { useUIStore } from "../stores/useUIStore";
import { sessionService } from "../services/sessionService";
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, TextSlide as TextSlideType } from "../types";
import { EventSlideComponent, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, TextSlide } from "./slides";
import { VideoSlide } from "./slides/VideoSlide";
import SwiperSlideshow from "./SwiperSlideshow";
import SlideLogoOverlay from "./SlideLogoOverlay";
import { DigitalClock } from "./DigitalClock";
import { TestingOverlay } from "./TestingOverlay";
import NewsSlideComponent from "./NewsSlideComponent";
import { motion } from "framer-motion";
import { onDisplayUpdate, UpdateEvent } from "../utils/updateEvents";
import { connectSocket, disconnectSocket, onSocketUpdate, onSocketStateChange, ConnectionState } from "../utils/socket";
import { logger } from "../utils/logger";

/**
 * Simple Animated Logo Component for LED Display with Video Background
 */
const AnimatedLogo: React.FC<{ hideLogo?: boolean }> = ({ hideLogo = false }) => {
    const [videoError, setVideoError] = useState(false);

    return (
        <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Video Background */}
            {!videoError && (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                    style={{ zIndex: 1 }}
                    onError={(e) => {
                        console.error("Video playback error in AnimatedLogo:", e);
                        setVideoError(true);
                    }}
                    onPlay={() => {
                        // Video started playing successfully
                    }}
                    onPause={() => {
                        // Video paused successfully
                    }}
                    onAbort={() => {
                        // Video loading was aborted
                    }}
                    onLoadStart={() => {
                        if (process.env.NODE_ENV === 'development') {
                            // Video loading started
                        }
                    }}
                    onCanPlay={() => {
                        if (process.env.NODE_ENV === 'development') {
                            // Video ready to play
                        }
                    }}
                >
                    <source src="/videos/soliton-bg.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}

            {/* Overlay for better logo visibility */}
            <div
                className="absolute inset-0 bg-black/30"
                style={{ zIndex: 2 }}
            />

            {/* Pulsating Logo - only show if not hidden */}
            {!hideLogo && (
                <motion.div
                    className="relative z-10"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                >
                    <img
                        src="/images/logo-persivia.svg"
                        alt="Persivia Logo"
                        className="display-logo"
                    />
                </motion.div>
            )}
        </div>
    );
};

/**
 * Loading Component for Slides Display
 */
const LoadingComponent: React.FC = () => {
    return (
        <div className="w-full h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-white text-lg">Loading slides...</p>
            </div>
        </div>
    );
};

/**
 * SlidesDisplay component: shows only the active slides in a fullscreen/clean view.
 */
const SlidesDisplay: React.FC = () => {
    const { slides, isLoading, syncFromDatabase, setSlides } = useUnified();
    const { displaySettings, syncSettings } = useSettings();
    const updateDisplaySettingsAction = useUIStore((state) => state.updateDisplaySettings);
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [lastUpdateTime, setLastUpdateTime] = React.useState<Date>(new Date());
    const [socketState, setSocketState] = React.useState<ConnectionState>("disconnected");

    console.log('📺 SlidesDisplay - Component rendered (DISPLAY-ONLY MODE):', {
        slidesCount: slides.length,
        activeCount: slides.filter(s => s.active).length,
        isLoading,
        isRefreshing,
        settings: {
            swiperEffect: displaySettings.swiperEffect,
            showDateStamp: displaySettings.showDateStamp,
            hidePagination: displaySettings.hidePagination,
            hideArrows: displaySettings.hideArrows,
            hidePersiviaLogo: displaySettings.hidePersiviaLogo
        },
        timestamp: new Date().toISOString()
    });

    /**
     * Unified Display Update Handler
     * 
     * This is the SINGLE listener for all display updates.
     * Handles updates from:
     * - HomePage (slides changed, settings changed)
     * - Other tabs/windows (via BroadcastChannel)
     * - Future: WebSocket server broadcasts
     * 
     * TODO: When WebSocket is enabled, this same handler will receive socket events.
     * No other code changes needed - just add socket.on("displayUpdate", handleDisplayUpdate)
     */
    const handleDisplayUpdate = React.useCallback(async (event: UpdateEvent) => {
        logger.info(`🔔 DisplayPage received update: ${event.type} from ${event.source}`, event);

        setIsRefreshing(true);
        setLastUpdateTime(new Date());

        try {
            // Handle different update types
            switch (event.type) {
                case "slides":
                    // If slides data is provided in the event, use it directly (faster, no database query)
                    if (event.data?.slides && Array.isArray(event.data.slides)) {
                        logger.info("🔄 Updating slides from Socket.IO data (instant sync)...");
                        logger.debug("📦 Received slides data:", {
                            slidesCount: event.data.slides.length,
                            activeCount: event.data.slides.filter((s: any) => s.active).length,
                            slideIds: event.data.slides.map((s: any) => s.id)
                        });
                        // Use setSlides from UnifiedContext to update local state
                        setSlides(event.data.slides);
                        logger.success("✅ Slides updated from Socket.IO data");
                    } else {
                        // Fallback to database sync if slides data not provided
                        logger.info("🔄 Syncing slides from database (fallback)...");
                        await syncFromDatabase();
                    }
                    break;

                case "settings":
                    // If settings data is provided in the event, use it directly (faster, no database query)
                    if (event.data?.displaySettings) {
                        logger.info("🔄 Updating settings from Socket.IO data (instant sync)...");
                        logger.debug("📦 Received settings data:", event.data.displaySettings);
                        // Update settings directly using Zustand store (instant sync)
                        await updateDisplaySettingsAction(event.data.displaySettings);
                        logger.success("✅ Settings updated from Socket.IO data");
                    } else {
                        // Fallback to database sync if settings data not provided
                        logger.info("🔄 Syncing settings from database (fallback)...");
                        await syncSettings();
                    }
                    break;

                case "api-data":
                    logger.info("🔄 Refreshing API data via React Query...");
                    await queryClient.refetchQueries({ queryKey: ["dashboardData"] });
                    break;

                case "all":
                case "force-reload":
                    logger.info("🔄 Full refresh: syncing everything...");
                    await Promise.all([
                        syncFromDatabase(),
                        syncSettings(),
                        queryClient.refetchQueries({ queryKey: ["dashboardData"] })
                    ]);
                    break;

                default:
                    logger.warn(`⚠️ Unknown update type: ${event.type}`);
            }

            logger.success(`✅ Display update completed: ${event.type}`);
        } catch (error) {
            logger.error(`❌ Failed to handle display update: ${event.type}`, error);
        } finally {
            setIsRefreshing(false);
        }
    }, [syncFromDatabase, syncSettings, queryClient, setSlides, updateDisplaySettingsAction]);

    /**
     * Subscribe to display update events (BroadcastChannel - for same-browser tabs)
     * This replaces all the scattered realtimeSync and custom event listeners
     */
    useEffect(() => {
        logger.info("🎧 DisplayPage: Subscribing to unified update events (BroadcastChannel)");

        const unsubscribe = onDisplayUpdate(handleDisplayUpdate);

        return () => {
            logger.info("🔇 DisplayPage: Unsubscribing from update events");
            unsubscribe();
        };
    }, [handleDisplayUpdate]);

    /**
     * Socket.IO Connection for Real-Time Network Updates
     * 
     * This provides instant updates across the network when:
     * - Admin updates slides/settings from HomePage
     * - Changes come from different devices/networks
     * - BroadcastChannel can't reach (different browser instances)
     * 
     * Falls back to 5-minute polling if socket disconnects.
     */
    useEffect(() => {
        logger.info("🔌 DisplayPage: Connecting to Socket.IO for real-time updates");

        // Connect to Socket.IO server
        connectSocket();

        // Subscribe to socket state changes
        const unsubscribeState = onSocketStateChange((state: ConnectionState) => {
            setSocketState(state);
            logger.info(`📡 Socket state changed: ${state}`);

            if (state === "connected") {
                logger.success("✅ Socket.IO connected - real-time updates enabled");
            } else if (state === "error" || state === "disconnected") {
                logger.warn(`⚠️ Socket.IO ${state} - falling back to polling`);
            }
        });

        // Subscribe to socket update events
        const unsubscribeUpdates = onSocketUpdate((event) => {
            logger.info(`📡 Socket update received: ${event.type} from ${event.source}`);

            // Use the same handler as BroadcastChannel updates
            handleDisplayUpdate({
                type: event.type,
                timestamp: new Date().toISOString(),
                source: event.source || "socket",
                data: event.data
            });
        });

        // Cleanup on unmount
        return () => {
            logger.info("🔌 DisplayPage: Disconnecting from Socket.IO");
            unsubscribeState();
            unsubscribeUpdates();
            disconnectSocket();
        };
    }, [handleDisplayUpdate]);

    /**
     * Fallback Polling (5-minute intervals)
     * 
     * This provides reliability in case:
     * - BroadcastChannel fails
     * - Network issues prevent updates
     * - WebSocket disconnects (future)
     * 
     * Ensures display never gets stale for more than 5 minutes.
     */
    useEffect(() => {
        logger.info("⏰ DisplayPage: Starting 5-minute fallback polling");

        const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

        const pollInterval = setInterval(async () => {
            const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
            logger.info(`🔄 Fallback poll triggered (${Math.round(timeSinceLastUpdate / 1000)}s since last update)`);

            try {
                setIsRefreshing(true);

                // Sync everything
                await Promise.all([
                    syncFromDatabase(),
                    syncSettings(),
                    queryClient.refetchQueries({ queryKey: ["dashboardData"] })
                ]);

                setLastUpdateTime(new Date());
                logger.success("✅ Fallback poll completed successfully");
            } catch (error) {
                logger.error("❌ Fallback poll failed", error);
            } finally {
                setIsRefreshing(false);
            }
        }, POLLING_INTERVAL);

        return () => {
            logger.info("🛑 DisplayPage: Stopping fallback polling");
            clearInterval(pollInterval);
        };
    }, [lastUpdateTime, syncFromDatabase, syncSettings, queryClient]);

    /**
     * ✅ DISPLAY-ONLY APPROACH
     * 
     * DisplayPage is ONLY for displaying slides - NO calculations!
     * 
     * HomePage/AdminPage responsibilities:
     * - Calculate processedSlides (with employee data for event slides)
     * - Broadcast complete, ready-to-display slides via Socket.IO
     * - Save to database for persistence
     * 
     * DisplayPage responsibilities:
     * - Receive slides from Socket.IO
     * - Display them as-is
     * - That's it!
     * 
     * NO employee data calculations
     * NO active state changes
     * NO data transformations
     * Just pure display of what HomePage sends!
     */
    const processedSlides = useMemo(() => {
        console.log('🔄 SlidesDisplay - Using slides as-is (display-only mode):', {
            isLoading,
            slidesCount: slides.length
        });

        if (isLoading) {
            console.log('⏳ SlidesDisplay - Still loading, returning empty array');
            return [];
        }

        // Just return slides directly - HomePage already calculated everything
        console.log('📊 SlidesDisplay - Displaying slides from HomePage:', {
            totalSlides: slides.length,
            activeSlides: slides.filter(s => s.active).length,
            slideDetails: slides.map(s => ({ id: s.id, name: s.name, type: s.type, active: s.active }))
        });

        return slides;
    }, [slides, isLoading]);

    // Memoize the render function to prevent unnecessary re-renders
    const renderSlideContent = useMemo(() => {
        return (slide: Slide) => {
            switch (slide.type) {
                case SLIDE_TYPES.IMAGE:
                    return <ImageSlide slide={slide as ImageSlideType} />;
                case SLIDE_TYPES.VIDEO:
                    return (
                        <VideoSlide slide={slide as VideoSlideType} />
                    );
                case SLIDE_TYPES.NEWS:
                    return <NewsSlideComponent slide={slide as NewsSlide} />;
                case SLIDE_TYPES.EVENT:
                    return <EventSlideComponent slide={slide as EventSlideType} />;
                case SLIDE_TYPES.CURRENT_ESCALATIONS:
                    return <CurrentEscalationsSlideComponent slide={slide} />;
                case SLIDE_TYPES.TEAM_COMPARISON:
                    return <TeamComparisonSlideComponent slide={slide as TeamComparisonSlideType} />;
                case SLIDE_TYPES.GRAPH:
                    return <GraphSlide slide={slide as GraphSlideType} />;
                case SLIDE_TYPES.TEXT:
                    return <TextSlide slide={slide as TextSlideType} />;
                default:
                    return null;
            }
        };
    }, []);

    // Filter only active slides (slides with active = true and duration > 0)
    const activeSlides = useMemo(() => {
        const filtered = processedSlides.filter(slide => slide.active && (slide.duration || 0) > 0);
        console.log('🎯 SlidesDisplay - Active slides filter:', {
            totalProcessedSlides: processedSlides.length,
            activeSlidesCount: filtered.length,
            inactiveSlidesFiltered: processedSlides.length - filtered.length,
            activeSlides: filtered.map(s => ({ id: s.id, name: s.name, type: s.type, duration: s.duration, active: s.active })),
            inactiveSlides: processedSlides.filter(s => !s.active || (s.duration || 0) <= 0).map(s => ({ id: s.id, name: s.name, active: s.active }))
        });
        return filtered;
    }, [processedSlides]);

    // Check if there are any active slides
    const hasActiveSlides = activeSlides.length > 0;

    // Show loading component while slides are being loaded
    if (isLoading) {
        console.log('⏳ SlidesDisplay - Showing loading component');
        return <LoadingComponent />;
    }

    // Show animated logo if no active slides to display (LED Display mode)
    if (activeSlides.length === 0) {
        console.log('🎭 SlidesDisplay - No active slides available, showing animated logo', {
            totalSlides: processedSlides.length,
            activeSlides: activeSlides.length
        });
        return (
            <div className="relative w-full h-screen bg-black">
                <AnimatedLogo hideLogo={displaySettings.hidePersiviaLogo} />

                {/* Refresh Indicator */}
                {isRefreshing && (
                    <div className="absolute top-4 left-4 z-[10001] bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refreshing slides...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    console.log('🎬 SlidesDisplay - Rendering slideshow with active slides:', {
        totalProcessedSlides: processedSlides.length,
        activeSlidesCount: activeSlides.length,
        inactiveSlidesCount: processedSlides.length - activeSlides.length,
        activeSlides: activeSlides.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            active: s.active,
            duration: s.duration
        })),
        settings: {
            swiperEffect: displaySettings.swiperEffect,
            hidePagination: displaySettings.hidePagination,
            hideArrows: displaySettings.hideArrows,
            showDateStamp: displaySettings.showDateStamp,
            hidePersiviaLogo: displaySettings.hidePersiviaLogo
        }
    });

    return (
        <div className="relative w-full h-screen bg-black">
            <SwiperSlideshow
                key={`swiper-${displaySettings.swiperEffect}`}
                slides={activeSlides}
                renderSlideContent={renderSlideContent}
                hidePagination={displaySettings.hidePagination}
                hideArrows={displaySettings.hideArrows}
                effect={displaySettings.swiperEffect}
                isFullscreen={true}
                settings={displaySettings}
            />
            {displaySettings.showDateStamp && (
                <div className="absolute top-4 right-4 z-[10000]">
                    <DigitalClock />
                </div>
            )}
            {/* Testing overlay - always visible during testing */}
            <TestingOverlay />
            {/* Only show logo overlay when there are active slides and not hidden by settings */}
            {hasActiveSlides && !displaySettings.hidePersiviaLogo && <SlideLogoOverlay isFullscreen={true} />}
        </div>
    );
};

export default SlidesDisplay;