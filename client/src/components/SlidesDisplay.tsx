import React, { useMemo } from "react";
import { useSlides } from "../contexts/SlideContext";
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, DocumentSlide as DocumentSlideType } from "../types";
import { EventSlide, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, DocumentSlide } from "./slides";
import { VideoSlide } from "./slides/VideoSlide";
import { employees } from "../data/employees";
import SwiperSlideshow from "./SwiperSlideshow";
import SlideLogoOverlay from "./SlideLogoOverlay";
import { DigitalClock } from "./DigitalClock";
import NewsSlideComponent from "./NewsSlideComponent";
import { motion } from "framer-motion";

/**
 * Simple Animated Logo Component for LED Display with Video Background
 */
const AnimatedLogo: React.FC = () => {
    return (
        <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Video Background */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-20"
                style={{ zIndex: 1 }}
            >
                <source src="https://solitontechnologies.com/assets/img/video-slider.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Overlay for better logo visibility */}
            <div
                className="absolute inset-0 bg-black/30"
                style={{ zIndex: 2 }}
            />

            {/* Logo */}
            <motion.div
                className="relative z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: [0.8, 1.1, 1],
                    opacity: [0, 1, 1]
                }}
                transition={{
                    duration: 2,
                    ease: "easeOut",
                    repeat: Infinity,
                    repeatDelay: 1
                }}
            >
                <img
                    src="/images/logo-persivia.svg"
                    alt="Persivia Logo"
                    className="h-16 w-auto"
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
    const { slides, isLoading } = useSlides();
    const { settings } = useDisplaySettings();

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

        // Remove any existing event slides
        const nonEventSlides = slides.filter(slide => slide.type !== SLIDE_TYPES.EVENT);

        // Birthday event slide
        const birthdayEmployees = employees.filter(employee => isBirthdayToday(employee.dob));
        const birthdayEventSlide: EventSlideType | null = birthdayEmployees.length > 0 ? {
            id: "birthday-event-slide",
            name: "Birthday Celebrations",
            type: SLIDE_TYPES.EVENT,
            active: true,
            duration: 10,
            data: {
                title: "Birthday Celebrations",
                description: "Celebrating our team members' birthdays",
                date: new Date().toISOString(),
                isEmployeeSlide: true,
                employees: birthdayEmployees,
                eventType: "birthday"
            },
            dataSource: "manual"
        } : null;

        // Anniversary event slide
        const anniversaryEmployees = employees.filter(employee => isAnniversaryToday(employee.dateOfJoining));
        const anniversaryEventSlide: EventSlideType | null = anniversaryEmployees.length > 0 ? {
            id: "anniversary-event-slide",
            name: "Work Anniversaries",
            type: SLIDE_TYPES.EVENT,
            active: true,
            duration: 10,
            data: {
                title: "Work Anniversaries",
                description: "Celebrating our team members' work anniversaries",
                date: new Date().toISOString(),
                isEmployeeSlide: true,
                employees: anniversaryEmployees,
                eventType: "anniversary"
            },
            dataSource: "manual"
        } : null;

        // Add event slides if there are employees for today
        const eventSlides: EventSlideType[] = [birthdayEventSlide, anniversaryEventSlide].filter((s): s is EventSlideType => s !== null);
        const allSlides = [...nonEventSlides, ...eventSlides];
        return allSlides.filter(slide => slide.active);
    }, [slides, isLoading]);

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
                    return <EventSlide slide={slide as EventSlideType} />;
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

    // Show loading component while slides are being loaded
    if (isLoading) {
        return <LoadingComponent />;
    }

    // Show animated logo if no slides to display (LED Display mode)
    if (processedSlides.length === 0) {
        return <AnimatedLogo />;
    }

    return (
        <div className="relative w-full h-screen bg-black">
            <SwiperSlideshow
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
            <SlideLogoOverlay isFullscreen={true} />
        </div>
    );
};

export default SlidesDisplay;