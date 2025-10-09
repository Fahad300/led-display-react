import React, { useMemo, useState, useEffect } from "react";
import { useUnified } from "../contexts/UnifiedContext";
import { useSettings } from "../contexts/SettingsContext";
import { sessionService } from "../services/sessionService";
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, DocumentSlide as DocumentSlideType, TextSlide as TextSlideType } from "../types";
import { EventSlideComponent, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, DocumentSlide, TextSlide } from "./slides";
import { VideoSlide } from "./slides/VideoSlide";
import SwiperSlideshow from "./SwiperSlideshow";
import SlideLogoOverlay from "./SlideLogoOverlay";
import { DigitalClock } from "./DigitalClock";
import { TestingOverlay } from "./TestingOverlay";
import NewsSlideComponent from "./NewsSlideComponent";
import { motion } from "framer-motion";

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
    const { slides, employees, isLoading } = useUnified();
    const { displaySettings } = useSettings();
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [eventSlideStates, setEventSlideStates] = useState<{ [key: string]: boolean }>({});

    console.log('📺 SlidesDisplay - Component rendered:', {
        slidesCount: slides.length,
        isLoading,
        isRefreshing,
        employeesCount: employees.length,
        eventSlideStates,
        settings: {
            swiperEffect: displaySettings.swiperEffect,
            showDateStamp: displaySettings.showDateStamp,
            hidePagination: displaySettings.hidePagination,
            hideArrows: displaySettings.hideArrows,
            hidePersiviaLogo: displaySettings.hidePersiviaLogo
        },
        timestamp: new Date().toISOString()
    });

    // Load event slide states from database only
    useEffect(() => {
        const loadEventSlideStates = async () => {
            try {
                console.log('🔄 SlidesDisplay - Loading event slide states from database');

                // Event slide states are now managed through unified slideshow data
                console.log('🔄 SlidesDisplay - Event slide states managed through unified data');

                // Note: Event slide states are now managed through the unified slideshow data
                // For now, we'll use default states since event slide states are no longer stored separately
                // TODO: Integrate with unified slideshow data when event slide states are needed
                if (false) { // Disabled until event slide states are integrated with unified data
                    console.log('✅ SlidesDisplay - Event slide states loaded from database');
                    setEventSlideStates({});
                } else {
                    // Default to inactive - user must manually activate event slides
                    const defaultStates = {
                        "birthday-event-slide": false,
                        "anniversary-event-slide": false
                    };
                    console.log('⚠️ SlidesDisplay - Event slides default to inactive (user must manually activate):', defaultStates);
                    setEventSlideStates(defaultStates);
                }
            } catch (error) {
                console.error("Failed to load event slide states:", error instanceof Error ? error.message : String(error));
                // Fallback to inactive - user must manually activate
                const defaultStates = {
                    "birthday-event-slide": false,
                    "anniversary-event-slide": false
                };
                setEventSlideStates(defaultStates);
            }
        };

        loadEventSlideStates();
    }, [employees]); // Re-check when employees data updates

    // Listen for event slide toggle events from HomePage
    useEffect(() => {
        const handleForceReload = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { reason, slideId, active, eventType } = customEvent.detail || {};

            console.log('🔄 SlidesDisplay - Force reload event received:', {
                reason,
                slideId,
                active,
                eventType,
                timestamp: new Date().toISOString()
            });

            // Handle event slide toggle events
            if (reason === 'event_slide_toggle' && slideId && eventType) {
                console.log('🎯 SlidesDisplay - Updating event slide state:', {
                    slideId,
                    active,
                    eventType
                });

                setEventSlideStates(prevStates => ({
                    ...prevStates,
                    [slideId]: active
                }));

                console.log('✅ SlidesDisplay - Event slide state updated:', {
                    slideId,
                    active,
                    eventType
                });
            }
        };

        window.addEventListener('forceDisplayReload', handleForceReload);
        return () => window.removeEventListener('forceDisplayReload', handleForceReload);
    }, []);

    // SlidesDisplay no longer periodically reloads from database
    // It relies on the context's auto-save mechanism and the HomePage as the source of truth
    // The context will handle data persistence automatically

    // Poll for event slide state updates (always active)
    // Cross-device synchronization now handled by UnifiedContext

    // Memoize processed slides to prevent unnecessary re-computations
    const processedSlides = useMemo(() => {
        console.log('🔄 SlidesDisplay - Processing slides:', {
            isLoading,
            slidesCount: slides.length,
            employeesCount: employees.length,
            eventSlideStates
        });

        if (isLoading) {
            console.log('⏳ SlidesDisplay - Still loading, returning empty array');
            return [];
        }

        // Remove any existing event slides
        const nonEventSlides = slides.filter(slide => slide.type !== SLIDE_TYPES.EVENT);
        console.log('📋 SlidesDisplay - Non-event slides:', nonEventSlides.length);


        // Birthday event slide - Use API flags (API already does date checking)
        const birthdayEmployees = employees.filter(employee => employee.isBirthday === true);
        const birthdayActiveState = eventSlideStates["birthday-event-slide"] ?? false;
        console.log('🎂 SlidesDisplay - Birthday check:', {
            totalEmployees: employees.length,
            birthdayEmployees: birthdayEmployees.length,
            birthdayActiveState,
            birthdayEmployeeNames: birthdayEmployees.map(e => e.name),
            employeesData: employees.map(e => ({ name: e.name, isBirthday: e.isBirthday }))
        });

        const birthdayEventSlide: EventSlideType = {
            id: "birthday-event-slide",
            name: "Birthday Celebrations",
            type: SLIDE_TYPES.EVENT,
            active: birthdayActiveState,
            duration: 10,
            data: {
                title: "Birthday Celebrations",
                description: "Celebrating our team members' birthdays",
                date: new Date().toISOString(),
                isEmployeeSlide: true,
                employees: birthdayEmployees,
                eventType: "birthday",
                hasEvents: birthdayEmployees.length > 0,
                eventCount: birthdayEmployees.length
            },
            dataSource: "manual"
        };

        // Anniversary event slide - Use API flags (API already does date checking)
        const anniversaryEmployees = employees.filter(employee => employee.isAnniversary === true);
        const anniversaryActiveState = eventSlideStates["anniversary-event-slide"] ?? false;
        console.log('🎉 SlidesDisplay - Anniversary check:', {
            totalEmployees: employees.length,
            anniversaryEmployees: anniversaryEmployees.length,
            anniversaryActiveState,
            anniversaryEmployeeNames: anniversaryEmployees.map(e => e.name),
            employeesData: employees.map(e => ({ name: e.name, isAnniversary: e.isAnniversary }))
        });

        const anniversaryEventSlide: EventSlideType = {
            id: "anniversary-event-slide",
            name: "Work Anniversaries",
            type: SLIDE_TYPES.EVENT,
            active: anniversaryActiveState,
            duration: 10,
            data: {
                title: "Work Anniversaries",
                description: "Celebrating our team members' work anniversaries",
                date: new Date().toISOString(),
                isEmployeeSlide: true,
                employees: anniversaryEmployees,
                eventType: "anniversary",
                hasEvents: anniversaryEmployees.length > 0,
                eventCount: anniversaryEmployees.length
            },
            dataSource: "manual"
        };

        // Add event slides (always present, but may have 0 events)
        const eventSlides: EventSlideType[] = [birthdayEventSlide, anniversaryEventSlide];
        const allSlides = [...nonEventSlides, ...eventSlides];

        console.log('📊 SlidesDisplay - Final slide composition:', {
            nonEventSlides: nonEventSlides.length,
            eventSlides: eventSlides.length,
            totalSlides: allSlides.length,
            birthdaySlideCreated: !!birthdayEventSlide,
            anniversarySlideCreated: !!anniversaryEventSlide
        });

        // Debug logging for slide processing
        console.log('🔍 SlidesDisplay - Total slides from context:', slides.length);
        console.log('🔍 SlidesDisplay - Processed slides (allSlides):', allSlides.length);
        console.log('🔍 SlidesDisplay - All slides details:', allSlides.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            active: s.active,
            duration: s.duration
        })));

        const activeSlides = allSlides.filter(slide => slide.active && slide.duration > 0);
        console.log('✅ SlidesDisplay - Active slides ready for display:', {
            activeCount: activeSlides.length,
            activeSlides: activeSlides.map(s => ({ id: s.id, name: s.name, type: s.type, duration: s.duration }))
        });

        return allSlides; // Let SwiperSlideshow handle the active filtering
    }, [slides, isLoading, eventSlideStates, employees]);

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
                case SLIDE_TYPES.DOCUMENT:
                    return <DocumentSlide slide={slide as DocumentSlideType} />;
                case SLIDE_TYPES.TEXT:
                    return <TextSlide slide={slide as TextSlideType} />;
                default:
                    return null;
            }
        };
    }, []);

    // Check if there are active slides (slides with duration > 0 and active = true)
    const hasActiveSlides = useMemo(() => {
        const activeSlides = processedSlides.filter(slide => slide.active && (slide.duration || 0) > 0);
        console.log('🎯 SlidesDisplay - Active slides check:', {
            totalProcessedSlides: processedSlides.length,
            activeSlidesCount: activeSlides.length,
            hasActiveSlides: activeSlides.length > 0,
            activeSlidesDetails: activeSlides.map(s => ({ id: s.id, name: s.name, type: s.type, duration: s.duration }))
        });
        return activeSlides.length > 0;
    }, [processedSlides]);

    // Show loading component while slides are being loaded
    if (isLoading) {
        console.log('⏳ SlidesDisplay - Showing loading component');
        return <LoadingComponent />;
    }

    // Show animated logo if no slides to display (LED Display mode)
    if (processedSlides.length === 0) {
        console.log('🎭 SlidesDisplay - No slides available, showing animated logo');
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

    console.log('🎬 SlidesDisplay - Rendering slideshow with slides:', {
        slidesCount: processedSlides.length,
        activeSlidesCount: processedSlides.filter(s => s.active && s.duration > 0).length,
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
                slides={processedSlides}
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