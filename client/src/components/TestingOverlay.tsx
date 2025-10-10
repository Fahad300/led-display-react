import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUnified } from '../contexts/UnifiedContext';
import { useSettings } from '../contexts/SettingsContext';
import { SLIDE_TYPES } from '../types';

/**
 * Testing overlay component to clearly indicate test data
 * This prevents people from taking photos/videos thinking it's real content
 * 
 * To enable/disable: Use the Development Mode toggle in the Home page settings
 */
export const TestingOverlay: React.FC = () => {
    // Get development mode setting from SettingsContext
    const { displaySettings } = useSettings();
    const isTestingMode = displaySettings.developmentMode;

    // Debug mode - only log when explicitly enabled
    const isDebugMode = process.env.REACT_APP_DEBUG_TESTING_OVERLAY === 'true';

    // Get slideshow data from unified context
    const { slides, employees } = useUnified();

    // State for slideshow visual indicator
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSlideshowActive, setIsSlideshowActive] = useState(false);

    /**
     * ✅ FIX: Use slides directly - don't recalculate processedSlides
     * 
     * TestingOverlay was auto-activating event slides based on employee count,
     * ignoring the actual active state from HomePage/Database.
     * 
     * Solution: Just use slides as-is (HomePage already processed them)
     */
    const processedSlides = useMemo(() => {
        // Just return slides directly - HomePage already handles event slide creation and employee data
        return slides;
    }, [slides]);

    // Memoize active slides to prevent unnecessary re-renders
    const activeSlides = useMemo(() => {
        const active = processedSlides.filter(slide => slide.active);

        if (isDebugMode) {
            console.log('TestingOverlay - Processed slides:', {
                totalProcessedSlides: processedSlides.length,
                activeSlides: active.length,
                slides: processedSlides.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    active: s.active
                }))
            });
        }

        return active;
    }, [processedSlides, isDebugMode]);

    // Function to get slide type name
    const getSlideTypeName = (slideType: string): string => {
        const typeMap: { [key: string]: string } = {
            [SLIDE_TYPES.IMAGE]: 'Image',
            [SLIDE_TYPES.VIDEO]: 'Video',
            [SLIDE_TYPES.NEWS]: 'News',
            [SLIDE_TYPES.EVENT]: 'Event',
            [SLIDE_TYPES.CURRENT_ESCALATIONS]: 'Current Escalations',
            [SLIDE_TYPES.TEAM_COMPARISON]: 'Team Comparison',
            [SLIDE_TYPES.GRAPH]: 'Graph',
            [SLIDE_TYPES.DOCUMENT]: 'Document',
            [SLIDE_TYPES.TEXT]: 'Text'
        };
        return typeMap[slideType] || 'Unknown';
    };

    // Memoize the current slide to prevent unnecessary re-renders
    const currentSlide = useMemo(() => {
        // Ensure currentSlideIndex is within bounds of activeSlides
        const validIndex = Math.min(currentSlideIndex, activeSlides.length - 1);
        return activeSlides[validIndex] || null;
    }, [activeSlides, currentSlideIndex]);

    // Start countdown timer
    const startCountdown = (duration: number) => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        setCountdown(duration);
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Reset currentSlideIndex when active slides change
    useEffect(() => {
        if (activeSlides.length > 0 && currentSlideIndex >= activeSlides.length) {
            setCurrentSlideIndex(0);
        }
    }, [activeSlides.length, currentSlideIndex]);

    // Monitor slideshow state and countdown
    useEffect(() => {
        if (activeSlides.length > 0 && currentSlide) {
            startCountdown(currentSlide.duration || 10);
        }

        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [currentSlideIndex, activeSlides.length, currentSlide]);

    // Check if we're on the display page only
    useEffect(() => {
        const checkDisplayPage = () => {
            const isDisplayPage = window.location.pathname === '/display';
            setIsSlideshowActive(isDisplayPage);
        };

        checkDisplayPage();
        window.addEventListener('popstate', checkDisplayPage);

        return () => window.removeEventListener('popstate', checkDisplayPage);
    }, []);

    // Listen for slide changes from SwiperSlideshow component
    useEffect(() => {
        const handleSlideChange = (event: CustomEvent) => {
            if (event.detail && typeof event.detail.slideIndex === 'number') {
                if (isDebugMode) {
                    console.log('TestingOverlay: Slide change event', {
                        slideIndex: event.detail.slideIndex,
                        remainingTime: event.detail.remainingTime,
                        slideName: event.detail.slideName,
                        activeSlidesCount: activeSlides.length
                    });
                }

                // Ensure the slide index is within bounds of active slides
                const newIndex = Math.min(event.detail.slideIndex, activeSlides.length - 1);
                setCurrentSlideIndex(Math.max(0, newIndex));

                // If we have remaining time from the event, use it
                if (event.detail.remainingTime) {
                    setCountdown(event.detail.remainingTime);
                }
            }
        };

        window.addEventListener('slideshowSlideChange', handleSlideChange as EventListener);

        return () => {
            window.removeEventListener('slideshowSlideChange', handleSlideChange as EventListener);
        };
    }, [isDebugMode, activeSlides.length]);

    // Don't render if testing mode is explicitly disabled
    if (!isTestingMode) {
        return null;
    }

    return (
        <>
            {/* Slideshow Visual Indicator - Only show on display page */}
            {isSlideshowActive && activeSlides.length > 0 && (
                <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg shadow-lg border border-white/20 pointer-events-none">
                    <div className="space-y-2 text-sm">
                        {/* Slide Counter */}
                        <div className="flex items-center space-x-2">
                            <span className="text-yellow-400 font-bold">📊</span>
                            <span>Slide: {currentSlideIndex + 1} / {activeSlides.length}</span>
                        </div>

                        {/* Current Slide Name */}
                        <div className="flex items-center space-x-2">
                            <span className="text-blue-400 font-bold">📝</span>
                            <span className="max-w-xs truncate" title={currentSlide?.name || 'Unknown'}>
                                {currentSlide?.name || 'Unknown'}
                            </span>
                        </div>

                        {/* Slide Type */}
                        <div className="flex items-center space-x-2">
                            <span className="text-cyan-400 font-bold">🏷️</span>
                            <span>{getSlideTypeName(currentSlide?.type || '')}</span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center space-x-2">
                            <span className="text-green-400 font-bold">⏱️</span>
                            <span>Duration: {currentSlide?.duration || 10}s</span>
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center space-x-2">
                            <span className="text-red-400 font-bold">⏰</span>
                            <span className={`font-bold ${countdown <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                Next: {countdown}s
                            </span>
                        </div>

                        {/* Next Slide */}
                        {activeSlides.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400 font-bold">➡️</span>
                                <span className="max-w-xs truncate" title={activeSlides[(currentSlideIndex + 1) % activeSlides.length]?.name || 'Unknown'}>
                                    Next: {activeSlides[(currentSlideIndex + 1) % activeSlides.length]?.name || 'Unknown'}
                                </span>
                            </div>
                        )}

                        {/* Effect */}
                        <div className="flex items-center space-x-2">
                            <span className="text-orange-400 font-bold">🎭</span>
                            <span>Effect: {displaySettings.swiperEffect || 'slide'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom banner for extra visibility */}
            <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 shadow-lg border-t-2 border-red-400">
                    <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            <span className="font-bold text-lg">⚠️ TESTING ENVIRONMENT ⚠️</span>
                        </div>
                        <div className="text-sm opacity-90">
                            This is NOT real data - Do not take photos or videos
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
