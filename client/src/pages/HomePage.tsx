import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSlides } from '../contexts/SlideContext';
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType } from '../types';
import { EventSlide, ImageSlide } from '../components/slides';
import { motion } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactConfetti from "react-confetti";
import { employees } from "../data/employees";
import SlideLogoOverlay from "../components/SlideLogoOverlay";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, EffectCube, EffectCoverflow, EffectFlip, EffectCards, Autoplay, Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/effect-cube";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-flip";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { faCompress, faExpand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";
import { VideoSlide } from "../components/slides/VideoSlide";

// Type for reordering result
interface ReorderResult {
    sourceIndex: number;
    destinationIndex: number;
}

// Update the TRANSITION_EFFECTS constant
const TRANSITION_EFFECTS = [
    { value: "slide", label: "Slide" },
    { value: "fade", label: "Fade" },
    { value: "cube", label: "Cube" },
    { value: "coverflow", label: "Coverflow" },
    { value: "flip", label: "Flip" },
    { value: "cards", label: "Cards" }
] as const;

/**
 * Get the icon for a slide type
 */
const getSlideTypeIcon = (type: string): React.ReactElement | null => {
    switch (type) {
        case SLIDE_TYPES.IMAGE:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case SLIDE_TYPES.VIDEO:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        case SLIDE_TYPES.NEWS:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            );
        case SLIDE_TYPES.EVENT:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        default:
            return null;
    }
};

/**
 * Slide Preview Component
 */
const SlidePreview: React.FC<{ slide: Slide }> = ({ slide }) => {
    const renderPreview = () => {
        switch (slide.type) {
            case SLIDE_TYPES.EVENT:
                return null; // No preview for event slides
            case SLIDE_TYPES.IMAGE:
                const imageSlide = slide as ImageSlideType;
                return (
                    <div className="w-full h-24 relative rounded-lg overflow-hidden bg-persivia-light-gray">
                        {imageSlide.data.imageUrl ? (
                            <img
                                src={imageSlide.data.imageUrl}
                                alt={imageSlide.data.caption || "Slide preview"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-persivia-gray">No image</span>
                            </div>
                        )}
                    </div>
                );
            case SLIDE_TYPES.VIDEO:
                const videoSlide = slide as VideoSlideType;
                return (
                    <div className="w-full h-24 relative rounded-lg overflow-hidden bg-persivia-light-gray">
                        {videoSlide.data.videoUrl ? (
                            <video
                                src={videoSlide.data.videoUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                onMouseOver={(e) => e.currentTarget.play()}
                                onMouseOut={(e) => e.currentTarget.pause()}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-persivia-gray">No video</span>
                            </div>
                        )}
                    </div>
                );
            case SLIDE_TYPES.NEWS:
                const newsSlide = slide as NewsSlide;
                return (
                    <div className="w-full h-24 relative rounded-lg overflow-hidden bg-persivia-light-gray">
                        {newsSlide.data.backgroundImage ? (
                            <img
                                src={newsSlide.data.backgroundImage}
                                alt={newsSlide.data.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-persivia-gray">No image</span>
                            </div>
                        )}
                    </div>
                );
            default:
                return ("");
        }
    };

    return (
        <div className="mt-2">
            {renderPreview()}
        </div>
    );
};

/**
 * Sortable Slide Card Component
 */
const SortableSlideCard: React.FC<{
    slide: Slide;
    index: number;
    onToggleActive: (slideId: string) => void;
}> = ({ slide, index, onToggleActive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    // Get display name based on slide type
    const getDisplayName = () => {
        if (slide.type === SLIDE_TYPES.EVENT) {
            const eventSlide = slide as EventSlideType;
            if (eventSlide.data.isEmployeeSlide && eventSlide.data.employeeId) {
                const employee = employees.find(emp => emp.id === eventSlide.data.employeeId);
                return employee ? employee.name : slide.name;
            }
        }
        return slide.name;
    };

    // Get display source based on slide type
    const getDisplaySource = () => {
        if (slide.type === SLIDE_TYPES.EVENT) {
            return "automated";
        }
        return slide.dataSource;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-persivia-light-gray rounded-xl shadow p-4 ${isDragging ? "ring-2 ring-persivia-teal opacity-75" : ""}`}
        >
            <div className="flex items-start gap-3">
                {/* Order Number and Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center gap-2 cursor-move p-1 hover:bg-persivia-light-teal rounded"
                >
                    <span className="text-lg font-bold text-persivia-blue">{index + 1}</span>
                    <svg className="w-5 h-5 text-persivia-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-persivia-blue">{getDisplayName()}</h3>
                        {slide.type === SLIDE_TYPES.EVENT ? (
                            <button
                                type="button"
                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-not-allowed"
                                title="Event slides are automatically activated on birthdays."
                                disabled
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"}`}
                                />
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="switch"
                                aria-checked={slide.active}
                                onClick={() => onToggleActive(slide.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"}`}
                                />
                            </button>
                        )}
                    </div>

                    {/* Slide Info */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-persivia-gray">
                        <div className="flex items-center gap-1">
                            {getSlideTypeIcon(slide.type)}
                            <span>{slide.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{slide.duration}s</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{getDisplaySource()}</span>
                        </div>
                    </div>

                    {/* Preview */}
                    <SlidePreview slide={slide} />
                </div>
            </div>
        </div>
    );
};

/**
 * Slide Management Column Component
 */
const SlideManagementColumn: React.FC<{
    slides: Slide[];
    onReorder: (result: ReorderResult) => void;
    onToggleActive: (slideId: string) => void;
}> = ({ slides, onReorder, onToggleActive }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = slides.findIndex(slide => slide.id === active.id);
            const newIndex = slides.findIndex(slide => slide.id === over.id);

            onReorder({
                sourceIndex: oldIndex,
                destinationIndex: newIndex
            });
        }
    };

    return (
        <div className="w-[450px] min-w-[400px] max-w-[500px] bg-persivia-white shadow-lg flex flex-col p-6 border-r border-persivia-light-gray">
            <h2 className="text-2xl font-bold text-center mb-6 text-persivia-blue">Slide Management</h2>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={slides.map(slide => slide.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {slides.map((slide, index) => (
                            <SortableSlideCard
                                key={slide.id}
                                slide={slide}
                                index={index}
                                onToggleActive={onToggleActive}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

/**
 * Swiper Slideshow Component
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
    // Get the appropriate effect module
    const getEffectModule = () => {
        switch (effect) {
            case "fade": return EffectFade;
            case "cube": return EffectCube;
            case "coverflow": return EffectCoverflow;
            case "flip": return EffectFlip;
            case "cards": return EffectCards;
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
    };

    // Combine all required modules
    const effectModule = getEffectModule();
    const modules = [
        Autoplay,
        Navigation,
        Pagination,
        ...(effectModule ? [effectModule] : [])
    ];

    return (
        <div className="relative w-full h-full">
            <Swiper
                key={effect}
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
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false
                }}
                onSlideChange={(swiper: SwiperType) => onSlideChange?.(swiper.activeIndex)}
                className="w-full h-full"
                speed={800}
                grabCursor={true}
                observer={true}
                observeParents={true}
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isVideoSlide = (slide: Slide): slide is VideoSlideType => {
    return slide.type === SLIDE_TYPES.VIDEO;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VideoSlideComponent: React.FC<{ slide: VideoSlideType }> = ({ slide }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Ensure video plays when it becomes active
        if (videoRef.current) {
            const playVideo = async () => {
                try {
                    if (slide.data.autoplay) {
                        await videoRef.current?.play();
                    }
                } catch (error) {
                    console.error("Video autoplay error:", error);
                }
            };
            playVideo();
        }
    }, [slide.data.autoplay]);

    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                key={slide.data.videoUrl}
                src={slide.data.videoUrl}
                className="absolute inset-0 w-full h-full object-contain"
                controls={false}
                autoPlay={slide.data.autoplay}
                muted={slide.data.muted}
                loop={slide.data.loop}
                playsInline
                onError={(e) => {
                    console.error("Video playback error:", e);
                    const target = e.target as HTMLVideoElement;
                    target.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full">
                            <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 class="text-xl font-bold mb-2 text-white">Video Error</h3>
                            <p class="text-gray-300">Failed to load video: ${slide.data.videoUrl}</p>
                        </div>
                    `;
                }}
            />
            {slide.data.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
                    <p className="text-center">{slide.data.caption}</p>
                </div>
            )}
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AnimatedCharacters: React.FC<{ text: string; className?: string; style?: React.CSSProperties }> = ({
    text,
    className = "",
    style = {}
}) => {
    const letters = Array.from(text);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: 0.2 * i }
        })
    };

    const childVariants = {
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200
            }
        },
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.5
        }
    };

    return (
        <motion.span
            style={{ display: "inline-block", ...style }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                    variants={childVariants}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.span>
    );
};

/**
 * Enhanced Animated Title Component with color and position animations
 */
const AnimatedTitle: React.FC<{
    text: string;
    className?: string;
    baseColor: string;
}> = ({ text, className = "", baseColor }) => {
    const letters = Array.from(text);
    const colors = [
        baseColor,
        "#FFD700", // Gold
        "#FF69B4", // Hot Pink
        "#00FFFF", // Cyan
        baseColor
    ];

    const containerVariants = {
        animate: {
            transition: {
                staggerChildren: 0.1,
                repeat: Infinity,
                repeatType: "reverse" as const,
                duration: 8
            }
        }
    };

    const letterVariants = {
        animate: {
            y: [0, -20, 0, 20, 0],
            x: [0, 10, 0, -10, 0],
            color: colors,
            textShadow: [
                "0 0 20px rgba(255,255,255,0.5)",
                "0 0 60px rgba(255,255,255,0.3)",
                "0 0 20px rgba(255,255,255,0.5)"
            ],
            transition: {
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse" as const,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            className={`inline-block ${className}`}
            variants={containerVariants}
            animate="animate"
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    className="inline-block"
                    variants={letterVariants}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.div>
    );
};

/**
 * News Slide Component
 */
const NewsSlideComponent: React.FC<{ slide: NewsSlide }> = ({ slide }) => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const {
        title,
        details,
        backgroundImage,
        overlayOpacity = 0.5,
        textColor = "#FFFFFF",
        textSize = "large",
        textAlignment = "center"
    } = slide.data;

    // Enhanced text size mapping for fullscreen
    const getTitleSize = () => {
        switch (textSize) {
            case "small": return "text-5xl md:text-6xl";
            case "medium": return "text-6xl md:text-7xl";
            case "large": return "text-7xl md:text-8xl";
            case "xl": return "text-8xl md:text-9xl";
            case "2xl": return "text-9xl md:text-[10rem]";
            default: return "text-7xl md:text-8xl";
        }
    };

    const getDetailsSize = () => {
        switch (textSize) {
            case "small": return "text-xl md:text-2xl";
            case "medium": return "text-2xl md:text-3xl";
            case "large": return "text-3xl md:text-4xl";
            case "xl": return "text-4xl md:text-5xl";
            case "2xl": return "text-5xl md:text-6xl";
            default: return "text-3xl md:text-4xl";
        }
    };

    // Enhanced animation variants with corrected easing
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.3
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        }
    };

    const textContainerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        }
    };

    return (
        <motion.div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* React Confetti Effect */}
            <ReactConfetti
                width={windowSize.width}
                height={windowSize.height}
                numberOfPieces={50}
                recycle={true}
                colors={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]}
                opacity={0.7}
                gravity={0.1}
            />

            {backgroundImage && (
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        transition: { duration: 1.5, ease: "easeOut" }
                    }}
                >
                    <img
                        src={backgroundImage}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.parentElement!.innerHTML = `
                                <div class="flex flex-col items-center justify-center h-full bg-base-300">
                                    <svg class="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-gray-500 text-2xl">Failed to load image</p>
                                </div>
                            `;
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: overlayOpacity,
                            transition: { duration: 1 }
                        }}
                    />
                </motion.div>
            )}

            <motion.div
                className={`relative w-full max-w-[90%] mx-auto px-8 py-16 ${textAlignment === "left"
                    ? "text-left"
                    : textAlignment === "right"
                        ? "text-right"
                        : "text-center"
                    }`}
                variants={textContainerVariants}
            >
                <motion.div className="space-y-12">
                    <motion.div
                        className={`font-bold tracking-tight ${getTitleSize()}`}
                    >
                        <AnimatedTitle
                            text={title}
                            baseColor={textColor}
                            className="leading-tight"
                        />
                    </motion.div>

                    <motion.div
                        className={`space-y-8 ${getDetailsSize()}`}
                        style={{ color: textColor }}
                    >
                        {details.split('\n').map((paragraph, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    transition: {
                                        delay: 1 + (index * 0.2),
                                        duration: 0.8,
                                        ease: "easeOut"
                                    }
                                }}
                                className="leading-tight"
                            >
                                {paragraph}
                            </motion.p>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

/**
 * Home Page Component - Displays the slideshow
 */
const HomePage: React.FC = () => {
    const { slides, updateSlide, reorderSlides } = useSlides();
    const { settings, updateSettings } = useDisplaySettings();
    const [orderedSlides, setOrderedSlides] = useState<Slide[]>([]);
    const [activeSlides, setActiveSlides] = useState<Slide[]>([]);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const [dateTime, setDateTime] = useState<string>("");

    // Process active slides to adjust EVENT slide duration and active state
    const processedActiveSlides = orderedSlides.map(slide => {
        if (slide.type === SLIDE_TYPES.EVENT) {
            const today = new Date();
            const hasBirthdays = employees.some(employee => {
                const dob = new Date(employee.dob);
                return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
            });
            if (hasBirthdays) {
                return { ...slide, duration: 10, active: true };
            } else {
                return { ...slide, duration: 0, active: false };
            }
        }
        return slide;
    });

    // Initialize ordered slides
    useEffect(() => {
        setOrderedSlides(slides);
    }, [slides]);

    // Update active slides when processedActiveSlides change
    useEffect(() => {
        setActiveSlides(processedActiveSlides.filter(slide => slide.active));
    }, [orderedSlides]);

    // Handle slide reordering
    const handleReorder = ({ sourceIndex, destinationIndex }: ReorderResult) => {
        const newSlides = Array.from(orderedSlides);
        const [removed] = newSlides.splice(sourceIndex, 1);
        newSlides.splice(destinationIndex, 0, removed);
        setOrderedSlides(newSlides);
        reorderSlides(newSlides);
    };

    // Handle slide activation toggle
    const handleToggleActive = (slideId: string) => {
        const slideToUpdate = orderedSlides.find(s => s.id === slideId);
        if (slideToUpdate) {
            const updatedSlide = { ...slideToUpdate, active: !slideToUpdate.active };
            updateSlide(updatedSlide);

            // Update local state to reflect the change immediately
            const newSlides = orderedSlides.map(slide =>
                slide.id === slideId ? updatedSlide : slide
            );
            setOrderedSlides(newSlides);
        }
    };

    // Date/time updater
    useEffect(() => {
        const update = () => setDateTime(new Date().toLocaleString());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            slidesContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    // Handle escape key for fullscreen
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === "Escape" && document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    const handleRefresh = () => window.location.reload();

    /**
     * Render content based on slide type
     */
    const renderSlideContent = (slide: Slide) => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return <ImageSlide slide={slide as ImageSlideType} />;
            case SLIDE_TYPES.VIDEO:
                return <VideoSlide slide={slide as VideoSlideType} />;
            case SLIDE_TYPES.NEWS:
                return <NewsSlideComponent slide={slide as NewsSlide} />;
            case SLIDE_TYPES.EVENT:
                return <EventSlide slide={slide as EventSlideType} />;
            default:
                return null;
        }
    };

    // Update settings handlers
    const handleEffectChange = (effect: string) => {
        updateSettings({ swiperEffect: effect });
    };

    const handleDateStampToggle = () => {
        updateSettings({ showDateStamp: !settings.showDateStamp });
    };

    const handlePaginationToggle = () => {
        updateSettings({ hidePagination: !settings.hidePagination });
    };

    const handleArrowsToggle = () => {
        updateSettings({ hideArrows: !settings.hideArrows });
    };

    // If there are no active slides, show a message
    if (activeSlides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-2xl font-bold mb-2">No Active Slides</h3>
                <p className="text-slate-500 mb-4">There are no active slides to display.</p>
                <a href="/admin" className="btn btn-primary">Go to Admin</a>
            </div>
        );
    }

    // --- UI ---
    return (
        <div className="flex h-full bg-persivia-light-gray">
            {/* Slide Management - First Column */}
            <SlideManagementColumn
                slides={orderedSlides}
                onReorder={handleReorder}
                onToggleActive={handleToggleActive}
            />

            {/* Slide Display - Middle Column */}
            <main className="flex-1 overflow-auto p-6 flex flex-col bg-persivia-white">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-center text-persivia-blue">LED Preview</h2>
                    <button
                        onClick={handleToggleFullscreen}
                        className="flex items-center gap-2 px-4 py-2 bg-persivia-blue text-white rounded-lg hover:bg-persivia-blue/90 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F11)"}
                    >
                        {isFullscreen ? (
                            <>
                                <FontAwesomeIcon icon={faCompress} />
                                <span>Exit Fullscreen</span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faExpand} />
                                <span>Enter Fullscreen</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center bg-persivia-light-gray/50 rounded-lg p-8">
                    <div
                        ref={slidesContainerRef}
                        className={`
                            relative
                            ${isFullscreen ? "fixed inset-0 z-[9999]" : "w-full aspect-video"}
                            rounded-lg
                            overflow-hidden
                            bg-black
                            shadow-[0_0_0_1px_rgba(19,77,103,0.1),0_0_0_3px_rgba(19,77,103,0.1),0_0_0_6px_rgba(19,77,103,0.1)]
                            before:content-['']
                            before:absolute
                            before:inset-0
                            before:rounded-lg
                            before:pointer-events-none
                            before:z-10
                            before:shadow-[inset_0_0_15px_rgba(19,77,103,0.2)]
                            before:border
                            before:border-persivia-light-teal/30
                            after:content-['']
                            after:absolute
                            after:inset-[-1px]
                            after:rounded-lg
                            after:pointer-events-none
                            after:z-[-1]
                            after:bg-gradient-to-r
                            after:from-persivia-teal/20
                            after:via-persivia-blue/20
                            after:to-persivia-teal/20
                            after:animate-gradient
                            ${isFullscreen ? "rounded-none before:rounded-none after:rounded-none" : ""}
                        `}
                    >
                        {/* Fullscreen Overlay Controls */}
                        {isFullscreen && (
                            <div className="absolute top-4 right-4 z-[10000] flex items-center gap-4 bg-black/50 rounded-lg p-2 text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={handleToggleFullscreen}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Exit Fullscreen (Esc)"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 20h4v-4H5v4zM15 20h4v-4h-4v4zM5 10h4V6H5v4zM15 10h4V6h-4v4z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className={`absolute inset-[1px] bg-persivia-white rounded-lg overflow-hidden ${isFullscreen ? "rounded-none" : ""}`}>
                            <SwiperSlideshow
                                slides={processedActiveSlides.filter(slide => slide.active)}
                                renderSlideContent={renderSlideContent}
                                onSlideChange={(index) => {
                                    // Handle slide change if needed
                                }}
                                hidePagination={settings.hidePagination}
                                hideArrows={settings.hideArrows}
                                effect={settings.swiperEffect}
                                isFullscreen={isFullscreen}
                            />
                            {/* Date/Time Stamp Overlay - Moved to top right */}
                            {settings.showDateStamp && (
                                <div className="absolute top-4 right-4 bg-persivia-blue/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-mono backdrop-blur-sm z-[10000]">
                                    {dateTime}
                                </div>
                            )}
                            <SlideLogoOverlay isFullscreen={isFullscreen} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Settings Panel - Right Column */}
            <aside className="w-[370px] min-w-[320px] max-w-[400px] bg-persivia-white shadow-lg flex flex-col p-6 border-l border-persivia-light-gray">
                <h2 className="text-2xl font-bold text-center mb-6 text-persivia-blue">Display Controls</h2>

                {/* Effect Card */}
                <div className="bg-persivia-light-gray/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-3">Effect</h3>
                    <div className="space-y-4">
                        {/* Effect Select */}
                        <div className="space-y-2">
                            <label htmlFor="effect" className="text-sm font-medium">
                                Transition Effect
                            </label>
                            <select
                                id="effect"
                                value={settings.swiperEffect}
                                onChange={(e) => handleEffectChange(e.target.value)}
                                className="w-full rounded-lg border border-persivia-light-gray bg-white px-3 py-2 text-sm"
                            >
                                {TRANSITION_EFFECTS.map((effect) => (
                                    <option key={effect.value} value={effect.value}>
                                        {effect.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Display Card */}
                <div className="bg-persivia-light-gray/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-3">Display</h3>
                    <div className="space-y-4">
                        {/* Fullscreen Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="fullscreen" className="text-sm font-medium">
                                Fullscreen
                            </label>
                            <button
                                id="fullscreen"
                                type="button"
                                role="switch"
                                aria-checked={isFullscreen}
                                onClick={handleToggleFullscreen}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isFullscreen ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isFullscreen ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {/* Date/Time Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="datetime" className="text-sm font-medium">
                                Show Date/Time
                            </label>
                            <button
                                id="datetime"
                                type="button"
                                role="switch"
                                aria-checked={settings.showDateStamp}
                                onClick={handleDateStampToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showDateStamp ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.showDateStamp ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {/* Hide Pagination Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="hidePagination" className="text-sm font-medium">
                                Hide Pagination
                            </label>
                            <button
                                id="hidePagination"
                                type="button"
                                role="switch"
                                aria-checked={settings.hidePagination}
                                onClick={handlePaginationToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.hidePagination ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.hidePagination ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {/* Hide Arrows Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="hideArrows" className="text-sm font-medium">
                                Hide Arrows
                            </label>
                            <button
                                id="hideArrows"
                                type="button"
                                role="switch"
                                aria-checked={settings.hideArrows}
                                onClick={handleArrowsToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.hideArrows ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.hideArrows ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    className="w-full bg-persivia-blue hover:bg-persivia-blue/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    Refresh Display
                </button>
            </aside>
        </div>
    );
};

export default HomePage; 