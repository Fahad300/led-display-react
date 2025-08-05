import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Slide } from "../types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, EffectCube, EffectCoverflow, EffectFlip, EffectCards, Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/effect-cube";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-flip";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * Swiper Slideshow Component with Dynamic Autoplay Timing
 */
const SwiperSlideshow: React.FC<{
    slides: Slide[];
    renderSlideContent: (slide: Slide) => React.ReactNode;
    onSlideChange?: (index: number) => void;
    hidePagination?: boolean;
    hideArrows?: boolean;
    effect?: string;
    isFullscreen?: boolean;
}> = ({ slides, renderSlideContent, onSlideChange, hidePagination = false, hideArrows = false, effect = "slide", isFullscreen = false }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [currentSlideDuration, setCurrentSlideDuration] = useState<number>(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const [videoError, setVideoError] = useState<boolean>(false);

    const swiperRef = useRef<SwiperType | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Filter out slides with 0 duration or inactive slides
    const activeSlides = useMemo(() => {
        const filtered = slides.filter(slide => slide.active && (slide.duration || 0) > 0);
        console.log(`Active slides: ${filtered.length} out of ${slides.length} total slides`);
        filtered.forEach((slide, index) => {
            console.log(`Slide ${index}: ${slide.name} - Duration: ${slide.duration}s - Active: ${slide.active}`);
        });
        return filtered;
    }, [slides]);

    // Memoize the effect module
    const effectModule = useMemo(() => {
        switch (effect) {
            case "fade": return EffectFade;
            case "cube": return EffectCube;
            case "coverflow": return EffectCoverflow;
            case "flip": return EffectFlip;
            case "cards": return EffectCards;
            default: return undefined;
        }
    }, [effect]);

    // Memoize the effect configuration
    const effectConfig = useMemo(() => {
        switch (effect) {
            case "fade":
                return { fadeEffect: { crossFade: true } };
            case "cube":
                return {
                    cubeEffect: {
                        shadow: true,
                        slideShadows: true,
                        shadowOffset: 20,
                        shadowScale: 0.94,
                        rotate: 50,
                        stretch: 0,
                        depth: 100,
                        modifier: 1
                    }
                };
            case "coverflow":
                return {
                    coverflowEffect: {
                        rotate: 50,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: true
                    }
                };
            case "flip":
                return {
                    flipEffect: {
                        slideShadows: true,
                        limitRotation: true
                    }
                };
            case "cards":
                return {
                    cardsEffect: {
                        perSlideOffset: 8,
                        perSlideRotate: 2,
                        rotate: true,
                        slideShadows: true
                    }
                };
            default:
                return {};
        }
    }, [effect]);

    // Memoize modules array
    const modules = useMemo(() => {
        const baseModules = [Navigation, Pagination, Autoplay];
        return effectModule ? [...baseModules, effectModule] : baseModules;
    }, [effectModule]);

    // Clear countdown timer
    const clearCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    // Start countdown for current slide
    const startCountdown = useCallback(() => {
        if (activeSlides.length === 0) return;

        const currentSlide = activeSlides[currentSlideIndex];
        const duration = currentSlide.duration || 5;

        console.log(`Starting countdown for slide ${currentSlideIndex} (${currentSlide.name}): ${duration}s`);

        // Set initial countdown
        setCurrentSlideDuration(duration);
        setTimeRemaining(duration);

        // Start countdown
        countdownRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!);
                    countdownRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [activeSlides, currentSlideIndex]);

    // Handle slide change
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        const newIndex = swiper.activeIndex;
        console.log(`Slide changed to index ${newIndex}`);

        setCurrentSlideIndex(newIndex);
        onSlideChange?.(newIndex);

        // Clear existing countdown and start new one
        clearCountdown();
        startCountdown();
    }, [onSlideChange, clearCountdown, startCountdown]);

    // Handle swiper initialization
    const handleSwiperInit = useCallback((swiper: SwiperType) => {
        swiperRef.current = swiper;
        console.log(`Swiper initialized with ${activeSlides.length} active slides`);

        // Start countdown for first slide
        if (activeSlides.length > 0) {
            setCurrentSlideIndex(0);
            startCountdown();
        }
    }, [activeSlides, startCountdown]);

    // Reset countdown when slides change
    useEffect(() => {
        console.log("Slides changed, resetting countdown");
        clearCountdown();
        setCurrentSlideIndex(0);

        if (activeSlides.length > 0) {
            startCountdown();
        }
    }, [activeSlides, clearCountdown, startCountdown]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearCountdown();
        };
    }, [clearCountdown]);

    // Memoize pagination configuration
    const paginationConfig = useMemo(() => {
        return !hidePagination ? {
            clickable: true,
            dynamicBullets: true
        } : false;
    }, [hidePagination]);

    // Don't render if no active slides - show animated logo instead
    if (activeSlides.length === 0) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
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
                            console.error("Video playback error in SwiperSlideshow:", e);
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
                <div className="relative z-10">
                    <img
                        src="/images/logo-persivia.svg"
                        alt="Persivia Logo"
                        className="h-16 w-auto"
                        style={{
                            animation: "pulse 3s ease-in-out infinite"
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <Swiper
                key={`swiper-${effect}`}
                modules={modules}
                effect={effect}
                {...effectConfig}
                spaceBetween={0}
                slidesPerView={1}
                navigation={!hideArrows}
                pagination={paginationConfig}
                autoplay={{
                    delay: activeSlides[currentSlideIndex]?.duration * 1000 || 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false
                }}
                onSlideChange={handleSlideChange}
                onSwiper={handleSwiperInit}
                className="w-full h-full"
                speed={800}
                grabCursor={false}
                allowTouchMove={false}
                observer={true}
                observeParents={true}
                loop={true}
            >
                {activeSlides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div className="w-full h-full">
                            {renderSlideContent(slide)}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default SwiperSlideshow; 