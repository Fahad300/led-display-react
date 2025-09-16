import React, { useEffect } from "react";
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
 * DisplayPage: Simple display page with two core functions:
 * 1. Get the latest settings
 * 2. Get the latest unified object
 */
const DisplayPage: React.FC = () => {
    // Get latest settings and unified data
    const { slides, isLoading, syncFromDatabase } = useUnified();
    const { displaySettings, syncSettings } = useSettings();

    // Filter active slides
    const activeSlides = slides.filter(slide => slide.active);

    // Get latest data on mount
    useEffect(() => {
        const getLatestData = async () => {
            console.log("🖥️ DisplayPage: Getting latest settings and unified data...");
            try {
                // Get latest settings
                await syncSettings();
                // Get latest unified object
                await syncFromDatabase();
                console.log("✅ DisplayPage: Latest data loaded successfully");
            } catch (error) {
                console.error("❌ DisplayPage: Failed to load latest data:", error);
            }
        };

        getLatestData();
    }, [syncSettings, syncFromDatabase]);

    // Force Swiper refresh when slides data changes
    useEffect(() => {
        console.log("🔄 DisplayPage: Slides data changed, Swiper will auto-refresh", {
            totalSlides: slides.length,
            activeSlides: activeSlides.length,
            slideIds: activeSlides.map(s => s.id)
        });
    }, [slides, activeSlides]);

    // Periodic refresh for remote display (every 30 seconds)
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            console.log("🔄 DisplayPage: Periodic refresh for remote display...");
            try {
                await syncSettings();
                await syncFromDatabase();
                console.log("✅ DisplayPage: Periodic refresh completed");
            } catch (error) {
                console.error("❌ DisplayPage: Periodic refresh failed:", error);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(refreshInterval);
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
            {/* SwiperSlideshow Component - Auto-refresh when data changes */}
            <SwiperSlideshow
                key={`slideshow-${activeSlides.length}-${slides.length}-${JSON.stringify(activeSlides.map(s => s.id))}`}
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