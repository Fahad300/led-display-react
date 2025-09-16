import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Slide } from "../types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

/**
 * Rock-Solid Swiper Slideshow Component with Individual Slide Durations
 * 
 * Key improvements:
 * - Uses realIndex for loop mode compatibility
 * - Single autoplay timer management
 * - Video slide handling with timer pause/resume
 * - Enhanced event dispatching with countdown data
 * - Proper cleanup and error handling
 */
const SwiperSlideshow: React.FC<{
    slides: Slide[];
    renderSlideContent: (slide: Slide, onVideoEnd?: () => void) => React.ReactNode;
    onSlideChange?: (index: number) => void;
    hidePagination?: boolean;
    hideArrows?: boolean;
    effect?: string;
    isFullscreen?: boolean;
    settings?: any;
}> = ({ slides, renderSlideContent, onSlideChange, hidePagination = false, hideArrows = false, effect = "slide", isFullscreen = false }) => {
    // Debug mode - only log when explicitly enabled
    const isDebugMode = process.env.REACT_APP_DEBUG_SWIPER_SLIDESHOW === 'true';
    const swiperRef = useRef<SwiperType | null>(null);
    const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // Filter out inactive slides
    const activeSlides = useMemo(() => {
        return slides.filter(slide => slide.active);
    }, [slides]);

    // Get the appropriate effect module
    const getEffectModule = () => {
        switch (effect) {
            case "fade": return EffectFade;
            default: return undefined;
        }
    };

    // Get the effect configuration
    const getEffectConfig = () => {
        switch (effect) {
            case "fade":
                return {
                    fadeEffect: {
                        crossFade: true
                    }
                };
            default:
                return {};
        }
    };

    // Combine all required modules
    const effectModule = getEffectModule();
    const modules = [
        Navigation,
        Pagination,
        Autoplay,
        ...(effectModule ? [effectModule] : [])
    ];

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        if (autoplayTimeoutRef.current) {
            clearTimeout(autoplayTimeoutRef.current);
            autoplayTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    // Start countdown timer for TestingOverlay
    const startCountdownTimer = useCallback((duration: number) => {
        clearAllTimers();
        setRemainingTime(duration);

        countdownIntervalRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearAllTimers]);

    // Custom autoplay function that respects individual slide durations
    const startCustomAutoplay = useCallback((slideIndex: number) => {
        // Clear any existing timeout
        clearAllTimers();

        if (slideIndex >= 0 && slideIndex < activeSlides.length && swiperRef.current) {
            const slide = activeSlides[slideIndex];
            const duration = slide.duration || 10; // Duration in seconds

            if (isDebugMode) {
                console.log('SwiperSlideshow: Starting custom autoplay', {
                    slideIndex,
                    realIndex: swiperRef.current.realIndex,
                    slideName: slide.name,
                    duration,
                    isVideoSlide: slide.type === 'video-slide'
                });
            }

            // Start countdown timer for TestingOverlay
            startCountdownTimer(duration);

            // For video slides, don't set autoplay timeout - let video end event handle it
            if (slide.type !== 'video-slide') {
                // Set timeout to move to next slide (only if not a video playing)
                autoplayTimeoutRef.current = setTimeout(() => {
                    if (swiperRef.current && activeSlides.length > 1 && !isVideoPlaying) {
                        if (isDebugMode) {
                            console.log('SwiperSlideshow: Moving to next slide via custom autoplay');
                        }
                        swiperRef.current.slideNext();
                    }
                }, duration * 1000); // Convert to milliseconds
            } else {
                if (isDebugMode) {
                    console.log('SwiperSlideshow: Video slide detected, waiting for video end event');
                }
            }
        }
    }, [activeSlides, clearAllTimers, startCountdownTimer, isVideoPlaying, isDebugMode]);

    // Get autoplay configuration - disable built-in autoplay, use custom instead
    const getAutoplayConfig = useCallback(() => {
        return false; // Disable built-in autoplay, use custom implementation
    }, []);

    // Handle slide change with realIndex for loop mode compatibility
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        // Use realIndex for loop mode compatibility
        const newIndex = swiper.realIndex;
        setCurrentSlideIndex(newIndex);

        if (isDebugMode) {
            console.log('SwiperSlideshow: Slide changed', {
                activeIndex: swiper.activeIndex,
                realIndex: swiper.realIndex,
                totalSlides: activeSlides.length,
                slideName: activeSlides[newIndex]?.name,
                isLoop: (swiper.loopedSlides || 0) > 0,
                loopedSlides: swiper.loopedSlides || 0
            });
        }

        // Start custom autoplay for the new slide
        startCustomAutoplay(newIndex);

        onSlideChange?.(newIndex);

        // Dispatch enhanced custom event for TestingOverlay
        const currentSlide = activeSlides[newIndex];
        const event = new CustomEvent('slideshowSlideChange', {
            detail: {
                slideIndex: newIndex,
                slideName: currentSlide?.name,
                duration: currentSlide?.duration || 10,
                remainingTime: currentSlide?.duration || 10,
                isVideoSlide: currentSlide?.type === 'video-slide'
            }
        });
        window.dispatchEvent(event);
    }, [onSlideChange, activeSlides, startCustomAutoplay, isDebugMode]);

    // Handle video end - advance to next slide immediately
    const handleVideoEnd = useCallback(() => {
        if (isDebugMode) {
            console.log('SwiperSlideshow: Video ended, advancing to next slide');
        }
        setIsVideoPlaying(false);
        clearAllTimers();

        if (swiperRef.current && activeSlides.length > 1) {
            swiperRef.current.slideNext();
        }
    }, [activeSlides.length, clearAllTimers, isDebugMode]);


    // Enhanced render function that passes video handlers
    const enhancedRenderSlideContent = useCallback((slide: Slide) => {
        return renderSlideContent(slide, handleVideoEnd);
    }, [renderSlideContent, handleVideoEnd]);

    // Initialize autoplay when swiper is ready (ONLY in onSwiper, not useEffect)
    const handleSwiperInit = useCallback((swiper: SwiperType) => {
        if (isDebugMode) {
            console.log('SwiperSlideshow: Swiper initialized', {
                activeIndex: swiper.activeIndex,
                realIndex: swiper.realIndex,
                slides: swiper.slides.length,
                autoplayConfig: getAutoplayConfig()
            });
        }
        swiperRef.current = swiper;

        // Start autoplay when swiper is ready (only if multiple slides)
        if (activeSlides.length > 1) {
            setTimeout(() => {
                startCustomAutoplay(0);
            }, 500); // Small delay to ensure swiper is fully ready
        }
    }, [activeSlides.length, startCustomAutoplay, getAutoplayConfig, isDebugMode]);

    // Listen for video events to pause/resume autoplay
    useEffect(() => {
        const handleVideoStart = () => {
            if (isDebugMode) {
                console.log('SwiperSlideshow: Video started, pausing autoplay timer');
            }
            setIsVideoPlaying(true);
            if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
                autoplayTimeoutRef.current = null;
            }

            // Set a fallback timeout to advance if video gets stuck
            // This ensures videos don't get stuck indefinitely
            if (swiperRef.current) {
                const currentSlide = activeSlides[swiperRef.current.realIndex];
                if (currentSlide && currentSlide.type === 'video-slide') {
                    const maxVideoDuration = (currentSlide.duration || 30) * 1000 + 5000; // Add 5 seconds buffer
                    autoplayTimeoutRef.current = setTimeout(() => {
                        if (isDebugMode) {
                            console.log('SwiperSlideshow: Video fallback timeout triggered, advancing to next slide');
                        }
                        setIsVideoPlaying(false);
                        clearAllTimers();
                        if (swiperRef.current && activeSlides.length > 1) {
                            swiperRef.current.slideNext();
                        }
                    }, maxVideoDuration);
                }
            }
        };

        const handleVideoPause = () => {
            if (isDebugMode) {
                console.log('SwiperSlideshow: Video paused');
            }
            setIsVideoPlaying(false);
            // Don't restart autoplay for video slides - let them handle their own timing
            // Only restart for non-video slides if needed
            if (swiperRef.current) {
                const currentSlide = activeSlides[swiperRef.current.realIndex];
                if (currentSlide && currentSlide.type !== 'video-slide') {
                    startCustomAutoplay(swiperRef.current.realIndex);
                }
            }
        };

        const handleVideoEnd = () => {
            if (isDebugMode) {
                console.log('SwiperSlideshow: Video ended, advancing to next slide');
            }
            setIsVideoPlaying(false);
            clearAllTimers();

            // Advance to next slide when video ends
            if (swiperRef.current && activeSlides.length > 1) {
                swiperRef.current.slideNext();
            }
        };

        window.addEventListener('videoSlideStart', handleVideoStart);
        window.addEventListener('videoSlidePause', handleVideoPause);
        window.addEventListener('videoSlideEnd', handleVideoEnd);

        return () => {
            window.removeEventListener('videoSlideStart', handleVideoStart);
            window.removeEventListener('videoSlidePause', handleVideoPause);
            window.removeEventListener('videoSlideEnd', handleVideoEnd);
        };
    }, [startCustomAutoplay, isDebugMode]);

    // Periodic check to ensure slideshow doesn't get stuck
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (swiperRef.current && activeSlides.length > 1) {
                const currentSlide = activeSlides[swiperRef.current.realIndex];
                if (currentSlide && currentSlide.type === 'video-slide' && !isVideoPlaying) {
                    // If we're on a video slide but video isn't playing, something might be stuck
                    if (isDebugMode) {
                        console.log('SwiperSlideshow: Video slide detected but not playing, checking for stuck state');
                    }
                    // Try to advance to next slide
                    swiperRef.current.slideNext();
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkInterval);
    }, [activeSlides, isVideoPlaying, isDebugMode]);

    // Update Swiper settings when props change
    useEffect(() => {
        if (swiperRef.current) {
            if (isDebugMode) {
                console.log('SwiperSlideshow: Updating Swiper settings', {
                    effect,
                    hideArrows,
                    hidePagination
                });
            }

            // Update navigation
            if (hideArrows) {
                swiperRef.current.navigation?.destroy();
            } else {
                swiperRef.current.navigation?.init();
            }

            // Update pagination
            if (hidePagination) {
                swiperRef.current.pagination?.destroy();
            } else {
                swiperRef.current.pagination?.init();
            }

            // Update effect if it changed - force re-render by updating params
            if (effect !== swiperRef.current.params.effect) {
                swiperRef.current.params.effect = effect;
                swiperRef.current.update();
            }
        }
    }, [effect, hideArrows, hidePagination, isDebugMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
            if (swiperRef.current) {
                swiperRef.current.autoplay?.stop();
            }
        };
    }, [clearAllTimers]);

    // Don't render if no active slides
    if (activeSlides.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">No Active Slides</h3>
                    <p className="text-gray-500">Create and activate slides to see them here</p>
                </div>
            </div>
        );
    }

    if (isDebugMode) {
        console.log('SwiperSlideshow: Rendering with', {
            activeSlidesCount: activeSlides.length,
            effect,
            hideArrows,
            hidePagination,
            currentSlideIndex,
            remainingTime,
            isVideoPlaying,
            modules: modules.map(m => m.name || 'unknown')
        });
    }

    return (
        <div className="relative w-full h-full">
            <Swiper
                key={`swiper-${effect}-${hideArrows}-${hidePagination}-${activeSlides.length}`}
                modules={modules}
                effect={effect}
                {...getEffectConfig()}
                spaceBetween={0}
                slidesPerView={1}
                navigation={!hideArrows}
                pagination={!hidePagination ? {
                    clickable: true,
                    dynamicBullets: true
                } : false}
                autoplay={getAutoplayConfig()}
                onSwiper={handleSwiperInit}
                onSlideChange={handleSlideChange}
                className="w-full h-full"
                speed={800}
                grabCursor={true}
                observer={true}
                observeParents={true}
                loop={activeSlides.length > 1} // Enable loop if there are multiple slides
            >
                {activeSlides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div className="w-full h-full">
                            {enhancedRenderSlideContent(slide)}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default SwiperSlideshow;