import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Slide, SLIDE_TYPES, VideoSlide as VideoSlideType } from "../types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { preloadVideos, extractFileId } from '../utils/localFileServer';
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
    videoReadyState?: Map<string, boolean>;
    setVideoReadyState?: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
}> = ({ slides, renderSlideContent, onSlideChange, hidePagination = false, hideArrows = false, effect = "slide", isFullscreen = false, videoReadyState = new Map(), setVideoReadyState }) => {
    // Debug mode - only log when explicitly enabled
    const isDebugMode = process.env.REACT_APP_DEBUG_SWIPER_SLIDESHOW === 'true';

    // Video preloading cache
    const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());
    const swiperRef = useRef<SwiperType | null>(null);
    const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const videoReadyCheckRef = useRef<NodeJS.Timeout | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    // Video ready state is now managed by parent component
    // Removed videoDurations - not needed with simplified approach

    // Filter out inactive slides
    const activeSlides = useMemo(() => {
        return slides.filter(slide => slide.active);
    }, [slides]);

    /**
     * Aggressively preload next video slides for smoother transitions
     * Preloads current, next, and next+1 videos to ensure smooth playback
     */
    const preloadNextVideos = useCallback(async () => {
        if (activeSlides.length === 0) return;

        const currentIndex = currentSlideIndex;
        const nextIndex = (currentSlideIndex + 1) % activeSlides.length;
        const nextNextIndex = (currentSlideIndex + 2) % activeSlides.length;

        const videoUrls: string[] = [];
        const indicesToPreload = [currentIndex, nextIndex, nextNextIndex];

        indicesToPreload.forEach(index => {
            const slide = activeSlides[index];
            if (slide?.type === SLIDE_TYPES.VIDEO) {
                const videoSlide = slide as VideoSlideType;
                if (videoSlide.data.videoUrl) {
                    videoUrls.push(videoSlide.data.videoUrl);
                }
            }
        });

        if (videoUrls.length > 0) {
            try {
                console.log(`🚀 Preloading ${videoUrls.length} videos (current + next 2 slides)`);
                await preloadVideos(videoUrls);
                console.log(`✅ Successfully preloaded ${videoUrls.length} videos`);

                // Mark videos as ready in state
                indicesToPreload.forEach(index => {
                    const slide = activeSlides[index];
                    if (slide?.type === SLIDE_TYPES.VIDEO) {
                        if (setVideoReadyState) {
                            setVideoReadyState(prev => {
                                const newState = new Map(prev);
                                newState.set(slide.id, true);
                                return newState;
                            });
                        }
                    }
                });
            } catch (error) {
                console.warn('⚠️ Failed to preload some videos:', error);
            }
        }
    }, [activeSlides, currentSlideIndex]);

    /**
     * Force video to play when slide becomes active
     * Ensures immediate playback for preloaded videos
     */
    const forceVideoPlay = useCallback((slideId: string) => {
        const event = new CustomEvent('forceVideoPlay', {
            detail: { slideId }
        });
        window.dispatchEvent(event);
    }, []);

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

    /**
     * Clear all timers including video ready check timer
     */
    const clearAllTimers = useCallback(() => {
        if (autoplayTimeoutRef.current) {
            clearTimeout(autoplayTimeoutRef.current);
            autoplayTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (videoReadyCheckRef.current) {
            clearTimeout(videoReadyCheckRef.current);
            videoReadyCheckRef.current = null;
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

    /**
     * Custom autoplay function that respects individual slide durations
     * For video slides, waits until video is ready before starting playback
     */
    const startCustomAutoplay = useCallback((slideIndex: number) => {
        // Clear any existing timeout
        clearAllTimers();

        if (slideIndex >= 0 && slideIndex < activeSlides.length && swiperRef.current) {
            const slide = activeSlides[slideIndex];

            // Simple duration - no complex video duration logic
            const duration = slide.duration || 10; // Default duration in seconds

            if (isDebugMode) {
                console.log('SwiperSlideshow: Starting custom autoplay', {
                    slideIndex,
                    realIndex: swiperRef.current.realIndex,
                    slideName: slide.name,
                    duration,
                    isVideoSlide: slide.type === SLIDE_TYPES.VIDEO
                });
            }

            // Start countdown timer for TestingOverlay
            startCountdownTimer(duration);

            // For video slides, disable autoplay completely - let video control timing
            if (slide.type === SLIDE_TYPES.VIDEO) {
                if (isDebugMode) {
                    console.log('SwiperSlideshow: Video slide detected, disabling autoplay - video will control timing');
                }
                setIsVideoPlaying(true);

                // NO AUTOPLAY TIMEOUT for video slides - let video.onended handle it
                console.log('🎬 Video slide: No autoplay timeout set - waiting for video.onended event');
            } else {
                // For non-video slides, set normal autoplay timeout
                autoplayTimeoutRef.current = setTimeout(() => {
                    if (swiperRef.current && activeSlides.length > 1 && !isVideoPlaying) {
                        if (isDebugMode) {
                            console.log('SwiperSlideshow: Moving to next slide via custom autoplay');
                        }
                        swiperRef.current.slideNext();
                    }
                }, duration * 1000); // Convert to milliseconds
            }
        }
    }, [activeSlides, clearAllTimers, startCountdownTimer, isVideoPlaying, isDebugMode]);

    // Get autoplay configuration - disable built-in autoplay, use custom instead
    const getAutoplayConfig = useCallback(() => {
        return false; // Disable built-in autoplay, use custom implementation
    }, []);

    /**
     * Handle slide change with realIndex for loop mode compatibility
     * Aggressively preloads next videos and manages video ready state
     */
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        // Use realIndex for loop mode compatibility
        const newIndex = swiper.realIndex;
        setCurrentSlideIndex(newIndex);
        const currentSlide = activeSlides[newIndex];

        if (isDebugMode) {
            console.log('🔄 SwiperSlideshow: Slide changed', {
                activeIndex: swiper.activeIndex,
                realIndex: swiper.realIndex,
                totalSlides: activeSlides.length,
                slideName: currentSlide?.name,
                slideType: currentSlide?.type,
                isVideoReady: currentSlide ? videoReadyState.get(currentSlide.id) : false,
                isLoop: (swiper.loopedSlides || 0) > 0,
                loopedSlides: swiper.loopedSlides || 0
            });
        }

        // CRITICAL: Aggressively preload next videos BEFORE starting autoplay
        // This ensures videos are ready when we need them
        preloadNextVideos();

        // All slides in activeSlides are ready (video slides are filtered out if not ready)
        // For video slides, force play and start autoplay immediately
        if (currentSlide?.type === SLIDE_TYPES.VIDEO) {
            console.log('🎬 Video slide detected, forcing video play');
            forceVideoPlay(currentSlide.id);
        }

        // Start autoplay for all slides (videos are guaranteed to be ready)
        startCustomAutoplay(newIndex);

        onSlideChange?.(newIndex);

        // Dispatch enhanced custom event for TestingOverlay
        const event = new CustomEvent('slideshowSlideChange', {
            detail: {
                slideIndex: newIndex,
                slideName: currentSlide?.name,
                duration: currentSlide?.duration || 10,
                remainingTime: currentSlide?.duration || 10,
                isVideoSlide: currentSlide?.type === SLIDE_TYPES.VIDEO
            }
        });
        window.dispatchEvent(event);
    }, [onSlideChange, activeSlides, startCustomAutoplay, isDebugMode, preloadNextVideos]);

    /**
     * Handle video end - advance to next slide immediately
     * Clears all safety timeouts and ensures smooth transition
     */
    const handleVideoEnd = useCallback(() => {
        if (isDebugMode) {
            console.log('✅ SwiperSlideshow: Video ended, advancing to next slide');
        }
        setIsVideoPlaying(false);
        clearAllTimers();

        if (swiperRef.current && activeSlides.length > 1) {
            // Preload next videos before transitioning
            preloadNextVideos();

            // Use a small delay to ensure the video has fully ended and next slide is ready
            setTimeout(() => {
                if (swiperRef.current) {
                    console.log('🔄 SwiperSlideshow: Moving to next slide after video ended');
                    swiperRef.current.slideNext();
                }
            }, 200);
        } else if (swiperRef.current && activeSlides.length === 1) {
            // If only one slide (video), restart it after a brief pause
            setTimeout(() => {
                const videoElement = document.querySelector(`video[data-slide-id="${activeSlides[0]?.id}"]`) as HTMLVideoElement;
                if (videoElement) {
                    videoElement.currentTime = 0;
                    videoElement.play().catch(err => console.warn('Video replay failed:', err));
                    setIsVideoPlaying(true);
                }
            }, 1000);
        }
    }, [activeSlides, clearAllTimers, isDebugMode, preloadNextVideos]);


    // Enhanced render function that passes video handlers
    const enhancedRenderSlideContent = useCallback((slide: Slide) => {
        return renderSlideContent(slide, handleVideoEnd);
    }, [renderSlideContent, handleVideoEnd]);

    /**
     * Initialize autoplay when swiper is ready
     * Preloads videos and starts autoplay after ensuring first slide is ready
     */
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

        // Immediately preload videos for smoother experience
        preloadNextVideos();

        // Start autoplay when swiper is ready (only if multiple slides)
        if (activeSlides.length > 1) {
            const firstSlide = activeSlides[0];

            // If first slide is a video, wait a bit longer to ensure it's loaded
            const delay = firstSlide?.type === SLIDE_TYPES.VIDEO ? 1000 : 500;

            setTimeout(() => {
                startCustomAutoplay(0);
            }, delay);
        } else if (activeSlides.length === 1 && activeSlides[0]?.type === SLIDE_TYPES.VIDEO) {
            // Single video slide - just start the countdown
            startCountdownTimer(activeSlides[0].duration || 10);
        }
    }, [activeSlides, startCustomAutoplay, getAutoplayConfig, isDebugMode, preloadNextVideos, startCountdownTimer]);


    // Enhanced periodic check to ensure slideshow doesn't get stuck
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (swiperRef.current && activeSlides.length > 1) {
                const currentSlide = activeSlides[swiperRef.current.realIndex];

                if (currentSlide) {
                    // For non-video slides, check if autoplay is running
                    if (currentSlide.type !== SLIDE_TYPES.VIDEO && !isVideoPlaying && !autoplayTimeoutRef.current) {
                        if (isDebugMode) {
                            console.log('SwiperSlideshow: Health check - restarting autoplay for stuck non-video slide');
                        }
                        startCustomAutoplay(swiperRef.current.realIndex);
                    }

                    // For video slides, check if video is actually playing
                    if (currentSlide.type === SLIDE_TYPES.VIDEO && isVideoPlaying) {
                        const videoElement = document.querySelector(`video[data-slide-id="${currentSlide.id}"]`) as HTMLVideoElement;
                        if (videoElement && (videoElement.paused || videoElement.ended)) {
                            if (isDebugMode) {
                                console.log('SwiperSlideshow: Health check - video appears stuck, advancing slide');
                            }
                            setIsVideoPlaying(false);
                            swiperRef.current.slideNext();
                        }
                    }
                }
            }
        }, 8000); // Check every 8 seconds

        return () => clearInterval(checkInterval);
    }, [activeSlides, isVideoPlaying, isDebugMode, startCustomAutoplay]);

    /**
     * Handle video buffering and ready events
     * Manages video state and prevents autoplay interruption
     */
    useEffect(() => {
        // Removed video buffering handler - not needed with proper preloading

        // Video ready state is managed by preloading, no event listeners needed

        // No event listeners needed - videos are preloaded and filtered before slideshow
    }, [activeSlides, currentSlideIndex]);

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

    /**
     * Force Swiper update when slides change
     * Also preloads all videos in the slideshow for maximum smoothness
     */
    useEffect(() => {
        if (swiperRef.current && isDebugMode) {
            console.log('SwiperSlideshow: Slides changed, forcing Swiper update', {
                activeSlidesCount: activeSlides.length,
                slideIds: activeSlides.map(s => s.id)
            });
        }

        // Force Swiper to re-render when slides change
        if (swiperRef.current) {
            swiperRef.current.update();
        }

        // Preload all videos completely in background before slideshow starts
        const preloadAllVideos = async () => {
            const videoSlides = activeSlides.filter(slide => slide.type === SLIDE_TYPES.VIDEO);

            if (videoSlides.length === 0) return;

            console.log(`🚀 Preloading ${videoSlides.length} videos completely in background`);

            // Create video elements and preload them completely
            const preloadPromises = videoSlides.map(async (slide) => {
                const videoSlide = slide as VideoSlideType;
                const videoUrl = videoSlide.data.videoUrl;

                if (!videoUrl) return;

                return new Promise<void>((resolve) => {
                    const video = document.createElement('video');
                    video.preload = 'auto';
                    video.muted = true;
                    video.crossOrigin = 'anonymous';
                    video.style.display = 'none'; // Hidden video element

                    let isResolved = false;

                    const handleCanPlayThrough = () => {
                        if (isResolved) return;
                        isResolved = true;

                        console.log(`✅ Video fully preloaded: ${slide.name}`);
                        if (setVideoReadyState) {
                            setVideoReadyState(prev => {
                                const newState = new Map(prev);
                                newState.set(slide.id, true);
                                return newState;
                            });
                        }

                        // Clean up event listeners
                        video.removeEventListener('canplaythrough', handleCanPlayThrough);
                        video.removeEventListener('loadeddata', handleLoadedData);
                        video.removeEventListener('error', handleError);
                        video.removeEventListener('stalled', handleStalled);

                        resolve();
                    };

                    const handleLoadedData = () => {
                        console.log(`📊 Video data loaded: ${slide.name}`);
                    };

                    const handleError = (e: Event) => {
                        if (isResolved) return;
                        isResolved = true;

                        console.warn(`⚠️ Failed to preload video: ${slide.name}`, e);
                        video.removeEventListener('canplaythrough', handleCanPlayThrough);
                        video.removeEventListener('loadeddata', handleLoadedData);
                        video.removeEventListener('error', handleError);
                        video.removeEventListener('stalled', handleStalled);
                        resolve(); // Resolve anyway to not block other videos
                    };

                    const handleStalled = () => {
                        console.log(`⏸️ Video stalled during preload: ${slide.name}`);
                    };

                    video.addEventListener('canplaythrough', handleCanPlayThrough);
                    video.addEventListener('loadeddata', handleLoadedData);
                    video.addEventListener('error', handleError);
                    video.addEventListener('stalled', handleStalled);

                    // Start loading
                    video.src = videoUrl;
                    video.load();

                    // Store reference for cleanup
                    preloadedVideos.current.set(slide.id, video);

                    // Timeout fallback - resolve after 30 seconds regardless
                    setTimeout(() => {
                        if (!isResolved) {
                            console.warn(`⏰ Video preload timeout: ${slide.name}`);
                            isResolved = true;
                            video.removeEventListener('canplaythrough', handleCanPlayThrough);
                            video.removeEventListener('loadeddata', handleLoadedData);
                            video.removeEventListener('error', handleError);
                            video.removeEventListener('stalled', handleStalled);
                            resolve();
                        }
                    }, 30000);
                });
            });

            try {
                await Promise.all(preloadPromises);
                console.log(`✅ All ${videoSlides.length} videos preloaded successfully`);
            } catch (error) {
                console.warn('⚠️ Some videos failed to preload:', error);
            }
        };

        preloadAllVideos();
    }, [activeSlides, isDebugMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
            if (swiperRef.current) {
                swiperRef.current.autoplay?.stop();
            }
            // Clean up preloaded videos
            preloadedVideos.current.forEach((video) => {
                video.src = '';
                video.load();
            });
            preloadedVideos.current.clear();
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
                key={`swiper-${effect}-${hideArrows}-${hidePagination}-${activeSlides.map(s => s.id).join(',')}-${activeSlides.length}`}
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