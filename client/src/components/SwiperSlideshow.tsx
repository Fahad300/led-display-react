import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { Slide } from "../types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, EffectCube, EffectCoverflow, EffectFlip, EffectCards, Navigation, Pagination } from "swiper/modules";
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
 * Swiper Slideshow Component with Dynamic Slide Durations
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
    const swiperRef = useRef<SwiperType | null>(null);
    const currentSlideIndex = useRef(0);
    const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    // Memoize the effect module to prevent unnecessary re-renders
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
                return {
                    fadeEffect: {
                        crossFade: true
                    }
                };
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
        const baseModules = [Navigation, Pagination];
        return effectModule ? [...baseModules, effectModule] : baseModules;
    }, [effectModule]);

    // Custom autoplay function with dynamic durations
    const startAutoplay = useCallback(() => {
        if (!swiperRef.current || slides.length === 0) return;

        const currentSlide = slides[currentSlideIndex.current];
        const duration = currentSlide.duration * 1000; // Convert to milliseconds

        // Clear existing timeout
        if (autoplayTimeoutRef.current) {
            clearTimeout(autoplayTimeoutRef.current);
        }

        // Set timeout for next slide
        autoplayTimeoutRef.current = setTimeout(() => {
            if (swiperRef.current) {
                const nextIndex = (currentSlideIndex.current + 1) % slides.length;
                swiperRef.current.slideTo(nextIndex);
            }
        }, duration);
    }, [slides]);

    // Handle slide change
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        currentSlideIndex.current = swiper.activeIndex;
        onSlideChange?.(swiper.activeIndex);

        // Start autoplay for the new slide
        startAutoplay();
    }, [onSlideChange, startAutoplay]);

    // Initialize autoplay when component mounts or slides change
    useEffect(() => {
        if (slides.length > 0 && isInitializedRef.current) {
            startAutoplay();
        }

        return () => {
            if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
            }
        };
    }, [slides, startAutoplay]);

    // Handle swiper initialization
    const handleSwiperInit = useCallback((swiper: SwiperType) => {
        swiperRef.current = swiper;
        isInitializedRef.current = true;

        // Start autoplay after initialization
        if (slides.length > 0) {
            startAutoplay();
        }
    }, [slides, startAutoplay]);

    // Memoize pagination configuration
    const paginationConfig = useMemo(() => {
        return !hidePagination ? {
            clickable: true,
            dynamicBullets: true
        } : false;
    }, [hidePagination]);

    return (
        <div className="relative w-full h-full">
            <Swiper
                modules={modules}
                effect={effect}
                {...effectConfig}
                spaceBetween={0}
                slidesPerView={1}
                navigation={!hideArrows}
                pagination={paginationConfig}
                onSlideChange={handleSlideChange}
                onSwiper={handleSwiperInit}
                className="w-full h-full"
                speed={800}
                grabCursor={true}
                observer={false}
                observeParents={false}
                loop={true}
            >
                {slides.map((slide) => (
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