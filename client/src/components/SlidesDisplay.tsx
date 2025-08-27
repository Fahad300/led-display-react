import React, { useMemo, useState, useEffect } from "react";
import { useSlides } from "../contexts/SlideContext";
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";
import { sessionService } from "../services/sessionService";
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, DocumentSlide as DocumentSlideType } from "../types";
import { EventSlideComponent, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, DocumentSlide } from "./slides";
import { VideoSlide } from "./slides/VideoSlide";
import SwiperSlideshow from "./SwiperSlideshow";
import SlideLogoOverlay from "./SlideLogoOverlay";
import { DigitalClock } from "./DigitalClock";
import NewsSlideComponent from "./NewsSlideComponent";
import { motion } from "framer-motion";
import { useEmployees } from "../contexts/EmployeeContext";

/**
 * Simple Animated Logo Component for LED Display with Video Background
 */
const AnimatedLogo: React.FC = () => {
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
                    onLoadStart={() => console.log("Video loading started: /videos/soliton-bg.mp4")}
                    onCanPlay={() => console.log("Video can play: /videos/soliton-bg.mp4")}
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

            {/* Pulsating Logo */}
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
    const { slides, isLoading, loadSlides } = useSlides();
    const { settings, onRefreshRequest } = useDisplaySettings();
    const { employees } = useEmployees();
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [eventSlideStates, setEventSlideStates] = useState<{ [key: string]: boolean }>({});

    // Load event slide states from database only
    useEffect(() => {
        const loadEventSlideStates = async () => {
            try {
                console.log("🔄 Loading event slide states from database...");

                // Always try to load from database
                const sessionData = await sessionService.syncFromServer();
                if (sessionData?.appSettings?.eventSlideStates) {
                    console.log("📊 Event slide states loaded from database:", sessionData.appSettings.eventSlideStates);
                    setEventSlideStates(sessionData.appSettings.eventSlideStates);
                } else {
                    // Default to active if no states are saved
                    const defaultStates = {
                        "birthday-event-slide": true,
                        "anniversary-event-slide": true
                    };
                    console.log("📊 Using default event slide states:", defaultStates);
                    setEventSlideStates(defaultStates);
                }
            } catch (error) {
                console.error("Error loading event slide states from database:", error);
                // Fallback to default states
                const defaultStates = {
                    "birthday-event-slide": true,
                    "anniversary-event-slide": true
                };
                setEventSlideStates(defaultStates);
            }
        };

        loadEventSlideStates();
    }, []);

    // Register refresh callback to respond to force refresh requests
    React.useEffect(() => {
        const cleanup = onRefreshRequest(() => {
            // Show refreshing indicator
            setIsRefreshing(true);

            // Reload slides when force refresh is triggered
            loadSlides();

            // Hide refreshing indicator after a short delay
            setTimeout(() => {
                setIsRefreshing(false);
            }, 1000);
        });

        return cleanup;
    }, [onRefreshRequest, loadSlides]);

    // Poll for event slide state updates (always active)
    useEffect(() => {
        const pollEventSlideStates = async () => {
            try {
                const sessionData = await sessionService.syncFromServer();
                if (sessionData?.appSettings?.eventSlideStates) {
                    console.log("🔄 Event slide states updated from polling:", sessionData.appSettings.eventSlideStates);
                    setEventSlideStates(sessionData.appSettings.eventSlideStates);
                }
            } catch (error) {
                console.debug("Error polling event slide states:", error);
            }
        };

        // Always set up polling for event slide state updates
        console.log("🔄 Setting up 5-second polling interval for event slide states");
        const pollInterval = setInterval(pollEventSlideStates, 5000);

        // Initial poll
        pollEventSlideStates();

        return () => {
            clearInterval(pollInterval);
        };
    }, []);

    // Helper functions for date checks
    const isBirthdayToday = (dob: string): boolean => {
        const today = new Date();
        const date = new Date(dob);
        return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    };

    const isAnniversaryToday = (dateOfJoining: string): boolean => {
        const today = new Date();
        const date = new Date(dateOfJoining);
        return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    };

    // Memoize processed slides to prevent unnecessary re-computations
    const processedSlides = useMemo(() => {
        if (isLoading) return [];

        console.log("🔄 Processing slides in SlidesDisplay...");
        console.log("📊 Current eventSlideStates:", eventSlideStates);
        console.log("📊 Total slides from context:", slides.length);

        // Remove any existing event slides
        const nonEventSlides = slides.filter(slide => slide.type !== SLIDE_TYPES.EVENT);
        console.log("📊 Non-event slides:", nonEventSlides.length);

        // Birthday event slide
        const birthdayEmployees = employees.filter(employee => isBirthdayToday(employee.dob));
        const birthdayActiveState = eventSlideStates["birthday-event-slide"] ?? true;
        console.log("🎂 Birthday employees:", birthdayEmployees.length, "Active state:", birthdayActiveState);

        const birthdayEventSlide: EventSlideType | null = birthdayEmployees.length > 0 ? {
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
                hasEvents: true
            },
            dataSource: "manual"
        } : null;

        // Anniversary event slide
        const anniversaryEmployees = employees.filter(employee => isAnniversaryToday(employee.dateOfJoining));
        const anniversaryActiveState = eventSlideStates["anniversary-event-slide"] ?? true;
        console.log("🎉 Anniversary employees:", anniversaryEmployees.length, "Active state:", anniversaryActiveState);

        const anniversaryEventSlide: EventSlideType | null = anniversaryEmployees.length > 0 ? {
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
                hasEvents: true
            },
            dataSource: "manual"
        } : null;

        // Add event slides if there are employees for today
        const eventSlides: EventSlideType[] = [birthdayEventSlide, anniversaryEventSlide].filter((s): s is EventSlideType => s !== null);
        const allSlides = [...nonEventSlides, ...eventSlides];

        console.log("📊 Final processed slides:", allSlides.length);
        console.log("📊 Event slides created:", eventSlides.length);
        eventSlides.forEach(slide => {
            console.log(`📊 Event slide: ${slide.name} - Active: ${slide.active}`);
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
                    return <VideoSlide slide={slide as VideoSlideType} />;
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
                default:
                    return null;
            }
        };
    }, []);

    // Check if there are active slides (slides with duration > 0 and active = true)
    const hasActiveSlides = useMemo(() => {
        return processedSlides.some(slide => slide.active && (slide.duration || 0) > 0);
    }, [processedSlides]);

    // Show loading component while slides are being loaded
    if (isLoading) {
        return <LoadingComponent />;
    }

    // Show animated logo if no slides to display (LED Display mode)
    if (processedSlides.length === 0) {
        return (
            <div className="relative w-full h-screen bg-black">
                <AnimatedLogo />

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

    return (
        <div className="relative w-full h-screen bg-black">
            <SwiperSlideshow
                key={`swiper-${settings.swiperEffect}`}
                slides={processedSlides}
                renderSlideContent={renderSlideContent}
                hidePagination={settings.hidePagination}
                hideArrows={settings.hideArrows}
                effect={settings.swiperEffect}
                isFullscreen={true}
            />
            {settings.showDateStamp && (
                <div className="absolute top-4 right-4 z-[10000]">
                    <DigitalClock />
                </div>
            )}
            {/* Only show logo overlay when there are active slides */}
            {hasActiveSlides && <SlideLogoOverlay isFullscreen={true} />}
        </div>
    );
};

export default SlidesDisplay;