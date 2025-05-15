import React, { useState, useEffect, useRef } from 'react';
import { useSlides } from '../contexts/SlideContext';
import { useSettings } from '../contexts/SettingsContext';
import { Slide, SLIDE_TYPES, ImageSlide, TextSlide, CountdownSlide, VideoSlide, NewsSlide, EventSlide } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
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

// Add these types at the top of the file after the imports
interface FullscreenDocument extends Document {
    readonly fullscreenElement: Element | null;
    readonly webkitFullscreenElement?: Element | null;
    readonly msFullscreenElement?: Element | null;
    readonly mozFullscreenElement?: Element | null;
    exitFullscreen: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    mozExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
    requestFullscreen: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
    mozRequestFullscreen?: () => Promise<void>;
}

// Type for countdown time values
interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Type for reordering result
interface ReorderResult {
    sourceIndex: number;
    destinationIndex: number;
}

// Update the animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
    })
};

const fadeVariants = {
    enter: {
        opacity: 0,
        scale: 0.95,
        filter: "blur(4px)"
    },
    center: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)"
    },
    exit: {
        opacity: 0,
        scale: 1.05,
        filter: "blur(4px)"
    }
};

const flipVariants = {
    enter: (direction: number) => ({
        rotateY: direction > 0 ? 90 : -90,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        rotateY: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => ({
        rotateY: direction < 0 ? 90 : -90,
        opacity: 0,
        scale: 0.95
    })
};

const scaleVariants = {
    enter: {
        scale: 1.5,
        opacity: 0
    },
    center: {
        scale: 1,
        opacity: 1
    },
    exit: {
        scale: 0.5,
        opacity: 0
    }
};

const TRANSITION_EFFECTS = [
    { value: "slide", label: "Slide" },
    { value: "fade", label: "Fade" },
    { value: "flip", label: "3D Flip" },
    { value: "scale", label: "Scale" }
];

/**
 * Calculate time left for a target date
 */
const calculateTimeLeft = (targetDate: string): TimeLeft => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();

    if (difference > 0) {
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
};


/**
 * Get the icon for a slide type
 */
const getSlideTypeIcon = (type: string) => {
    switch (type) {
        case SLIDE_TYPES.IMAGE:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case SLIDE_TYPES.TEXT:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            );
        case SLIDE_TYPES.COUNTDOWN:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            case SLIDE_TYPES.IMAGE:
                const imageSlide = slide as ImageSlide;
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
                const videoSlide = slide as VideoSlide;
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
            case SLIDE_TYPES.TEXT:
                const textSlide = slide as TextSlide;
                return (
                    <div className="w-full h-24 bg-persivia-light-gray rounded-lg p-2 overflow-hidden">
                        <div className="text-xs text-persivia-blue font-medium line-clamp-2">
                            {textSlide.data.title}
                        </div>
                        <div className="text-xs text-persivia-gray mt-1 line-clamp-3">
                            {textSlide.data.content}
                        </div>
                    </div>
                );
            case SLIDE_TYPES.COUNTDOWN:
                const countdownSlide = slide as CountdownSlide;
                return (
                    <div className="w-full h-24 bg-persivia-light-gray rounded-lg p-2 overflow-hidden">
                        <div className="text-xs text-persivia-blue font-medium line-clamp-2">
                            {countdownSlide.data.title}
                        </div>
                        <div className="text-xs text-persivia-gray mt-1 line-clamp-2">
                            {countdownSlide.data.message}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="w-full h-24 bg-persivia-light-gray rounded-lg flex items-center justify-center">
                        <span className="text-persivia-gray">Preview not available</span>
                    </div>
                );
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-persivia-light-gray rounded-xl shadow p-4 ${isDragging ? "ring-2 ring-persivia-teal opacity-75" : ""
                }`}
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
                        <h3 className="font-semibold text-persivia-blue">{slide.name}</h3>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={slide.active}
                            onClick={() => onToggleActive(slide.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" : "bg-slate-200"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"
                                    }`}
                            />
                        </button>
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
                            <span>{slide.dataSource}</span>
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
 * Slideshow Component
 */
const Slideshow: React.FC<{
    slides: Slide[];
    effect: string;
    renderSlideContent: (slide: Slide) => React.ReactNode;
    onSlideChange?: (index: number) => void;
}> = ({ slides, effect, renderSlideContent, onSlideChange }) => {
    const [[page, direction], setPage] = useState([0, 0]);
    const [transitioning, setTransitioning] = useState(false);

    // Get the current variant based on the effect
    const getVariants = () => {
        switch (effect) {
            case "fade":
                return fadeVariants;
            case "flip":
                return flipVariants;
            case "scale":
                return scaleVariants;
            default:
                return slideVariants;
        }
    };

    // Get transition configuration based on effect
    const getTransition = () => {
        const baseTransition = {
            type: "spring",
            bounce: 0.2,
            duration: 0.6
        };

        switch (effect) {
            case "fade":
                return {
                    ...baseTransition,
                    type: "tween",
                    ease: "easeInOut"
                };
            case "flip":
                return {
                    ...baseTransition,
                    stiffness: 300,
                    damping: 30
                };
            case "scale":
                return {
                    ...baseTransition,
                    type: "tween",
                    ease: [0.43, 0.13, 0.23, 0.96]
                };
            default:
                return {
                    ...baseTransition,
                    stiffness: 300,
                    damping: 30
                };
        }
    };

    // Handle manual navigation
    const paginate = (newDirection: number) => {
        if (transitioning) return;
        setTransitioning(true);
        const newPage = page + newDirection;
        if (newPage < 0) {
            setPage([slides.length - 1, newDirection]);
        } else if (newPage >= slides.length) {
            setPage([0, newDirection]);
        } else {
            setPage([newPage, newDirection]);
        }
        onSlideChange?.(newPage < 0 ? slides.length - 1 : newPage >= slides.length ? 0 : newPage);
    };

    // Auto-advance slides every 5 seconds
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => paginate(1), 5000);
        return () => clearInterval(timer);
    }, [page, slides.length]);

    return (
        <div className="relative w-full h-full">
            <AnimatePresence
                initial={false}
                custom={direction}
                onExitComplete={() => setTransitioning(false)}
                mode="wait"
            >
                <motion.div
                    key={page}
                    custom={direction}
                    variants={getVariants()}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={getTransition()}
                    className="absolute w-full h-full"
                    style={{
                        perspective: "1200px",
                        transformStyle: "preserve-3d"
                    }}
                >
                    {slides[page] && renderSlideContent(slides[page])}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {slides.length > 1 && (
                <>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => paginate(-1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/80 hover:bg-white/90 transition-colors shadow-lg backdrop-blur text-persivia-blue"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => paginate(1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/80 hover:bg-white/90 transition-colors shadow-lg backdrop-blur text-persivia-blue"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </>
            )}

            {/* Pagination Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    {slides.map((_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => {
                                const direction = index > page ? 1 : -1;
                                setPage([index, direction]);
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                            animate={{
                                scale: index === page ? 1.2 : 1,
                                opacity: index === page ? 1 : 0.5
                            }}
                            className="w-2 h-2 rounded-full bg-persivia-blue"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Type guard for VideoSlide
 */
const isVideoSlide = (slide: Slide): slide is VideoSlide => {
    return slide.type === SLIDE_TYPES.VIDEO;
};

/**
 * Video Slide Component
 */
const VideoSlideComponent: React.FC<{ slide: VideoSlide }> = ({ slide }) => {
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

/**
 * Animated Text Component for character-by-character animation
 */
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
            case "small": return "text-4xl md:text-5xl";
            case "medium": return "text-5xl md:text-6xl";
            case "large": return "text-6xl md:text-7xl";
            case "xl": return "text-7xl md:text-8xl";
            case "2xl": return "text-8xl md:text-9xl";
            default: return "text-7xl md:text-8xl";
        }
    };

    const getDetailsSize = () => {
        switch (textSize) {
            case "small": return "text-2xl md:text-3xl";
            case "medium": return "text-3xl md:text-4xl";
            case "large": return "text-4xl md:text-5xl";
            case "xl": return "text-5xl md:text-6xl";
            case "2xl": return "text-6xl md:text-7xl";
            default: return "text-4xl md:text-5xl";
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
 * Render event slide
 */
const renderEventSlide = (slide: EventSlide) => {
    const {
        title,
        description,
        date,
        time,
        location,
        imageUrl,
        registrationLink,
        textAlign = 'left',
        fontSize = 'text-base'
    } = slide.data;

    return (
        <div className="flex flex-col items-center justify-center h-full bg-base-200 p-8">
            <div className={`w-full max-w-4xl mx-auto ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}>
                {imageUrl && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.parentElement!.innerHTML = `
                                    <div class="flex flex-col items-center justify-center h-64 bg-base-300">
                                        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p class="text-gray-500">Failed to load image</p>
                                    </div>
                                `;
                            }}
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold">{title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>
                        {time && (
                            <>
                                <span>•</span>
                                <time>{time}</time>
                            </>
                        )}
                        {location && (
                            <>
                                <span>•</span>
                                <span>{location}</span>
                            </>
                        )}
                    </div>
                    <div className={`${fontSize} whitespace-pre-wrap`}>{description}</div>
                    {registrationLink && (
                        <div className="mt-6">
                            <a
                                href={registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-persivia-blue hover:bg-persivia-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-persivia-blue"
                            >
                                Register Now
                                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Home Page Component - Displays the slideshow
 */
const HomePage: React.FC = () => {
    const { slides, updateSlide, reorderSlides } = useSlides();
    const { settings, updateSettings } = useSettings();
    const [orderedSlides, setOrderedSlides] = useState<Slide[]>([]);
    const [activeSlides, setActiveSlides] = useState<Slide[]>([]);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const [countdownTimers, setCountdownTimers] = useState<Record<string, TimeLeft>>({});
    const [swiperEffect, setSwiperEffect] = useState<string>("slide");
    const [showDateStamp, setShowDateStamp] = useState<boolean>(false);
    const [dateTime, setDateTime] = useState<string>("");

    // Initialize ordered slides
    useEffect(() => {
        setOrderedSlides(slides);
    }, [slides]);

    // Update active slides when ordered slides change
    useEffect(() => {
        setActiveSlides(orderedSlides.filter(slide => slide.active));
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

    // Set up interval for updating countdown timers
    useEffect(() => {
        // Extract all countdown slides
        const countdownSlides = slides.filter(
            slide => slide.type === SLIDE_TYPES.COUNTDOWN
        ) as CountdownSlide[];

        // Initial calculation of all timers
        const initialTimers: Record<string, TimeLeft> = {};
        countdownSlides.forEach(slide => {
            initialTimers[slide.id] = calculateTimeLeft(slide.data.targetDate);
        });
        setCountdownTimers(initialTimers);

        // Set up interval to update all timers every second
        const intervalId = setInterval(() => {
            setCountdownTimers(prevTimers => {
                const newTimers = { ...prevTimers };
                countdownSlides.forEach(slide => {
                    newTimers[slide.id] = calculateTimeLeft(slide.data.targetDate);
                });
                return newTimers;
            });
        }, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [slides]);

    // Date/time updater
    useEffect(() => {
        if (!showDateStamp) return;
        const update = () => setDateTime(new Date().toLocaleString());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [showDateStamp]);

    // Enhanced fullscreen toggle handler
    const handleToggleFullscreen = async () => {
        if (!slidesContainerRef.current) return;

        const doc = document as FullscreenDocument;
        const element = slidesContainerRef.current as FullscreenElement;

        try {
            if (!isFullscreen) {
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    await element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) {
                    await element.msRequestFullscreen();
                } else if (element.mozRequestFullscreen) {
                    await element.mozRequestFullscreen();
                }
            } else {
                if (doc.exitFullscreen) {
                    await doc.exitFullscreen();
                } else if (doc.webkitExitFullscreen) {
                    await doc.webkitExitFullscreen();
                } else if (doc.msExitFullscreen) {
                    await doc.msExitFullscreen();
                } else if (doc.mozExitFullscreen) {
                    await doc.mozExitFullscreen();
                }
            }
        } catch (error) {
            console.error("Fullscreen API error:", error);
        }
    };

    // Enhanced fullscreen change handler
    useEffect(() => {
        const doc = document as FullscreenDocument;

        const handleFullscreenChange = () => {
            const isFullscreenNow = !!(
                doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.msFullscreenElement ||
                doc.mozFullscreenElement
            );
            setIsFullscreen(isFullscreenNow);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("msfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("msfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
        };
    }, []);

    // Add keyboard shortcut handler for fullscreen
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // F11 or F key for fullscreen
            if ((e.key === "F11" || (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.altKey)) && slidesContainerRef.current) {
                e.preventDefault();
                handleToggleFullscreen();
            }
            // Escape key to exit fullscreen
            if (e.key === "Escape" && isFullscreen) {
                handleToggleFullscreen();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [isFullscreen]);

    // --- Settings Handlers ---
    const handleSettingsChange = (key: string, value: any) => {
        updateSettings({ ...settings, [key]: value });
    };
    const handleRefresh = () => window.location.reload();

    /**
     * Render content based on slide type
     */
    const renderSlideContent = (slide: Slide) => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return renderImageSlide(slide as ImageSlide);
            case SLIDE_TYPES.TEXT:
                return renderTextSlide(slide as TextSlide);
            case SLIDE_TYPES.COUNTDOWN:
                return renderCountdownSlide(slide as CountdownSlide, countdownTimers[slide.id]);
            case SLIDE_TYPES.VIDEO:
                if (isVideoSlide(slide)) {
                    return <VideoSlideComponent slide={slide} />;
                }
                return <div>Invalid video slide</div>;
            case SLIDE_TYPES.NEWS:
                return <NewsSlideComponent slide={slide as NewsSlide} />;
            case SLIDE_TYPES.EVENT:
                return renderEventSlide(slide as EventSlide);
            default:
                return <div>Unsupported slide type</div>;
        }
    };

    /**
     * Render image slide
     */
    const renderImageSlide = (slide: ImageSlide) => {
        const { imageUrl, caption } = slide.data;

        if (!imageUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">Missing Image</h3>
                    <p className="text-slate-500">This slide has no image URL.</p>
                </div>
            );
        }

        const captionElement = caption ? (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">{caption}</div>
        ) : null;

        return (
            <div className="relative w-full h-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt={caption || 'Slide image'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.parentElement!.innerHTML = `
              <div class="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 class="text-xl font-bold mb-2">Image Error</h3>
                <p class="text-slate-500">Failed to load image: ${imageUrl}</p>
              </div>
            `;
                    }}
                />
                {captionElement}
            </div>
        );
    };

    /**
     * Render text slide
     */
    const renderTextSlide = (slide: TextSlide) => {
        const { title, content, textAlign = 'center', fontSize = 'text-xl' } = slide.data;

        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-8">
                <div className={`text-center w-full max-w-4xl mx-auto ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}>
                    {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
                    <div className={`${fontSize} whitespace-pre-wrap`}>{content}</div>
                </div>
            </div>
        );
    };

    /**
     * Render countdown slide
     */
    const renderCountdownSlide = (slide: CountdownSlide, timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }) => {
        const { title, message } = slide.data;

        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-8">
                <div className="text-center w-full max-w-4xl mx-auto">
                    {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}

                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <div className="text-4xl font-bold">{timeLeft.days}</div>
                            <div className="text-sm text-slate-500">Days</div>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <div className="text-4xl font-bold">{timeLeft.hours}</div>
                            <div className="text-sm text-slate-500">Hours</div>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <div className="text-4xl font-bold">{timeLeft.minutes}</div>
                            <div className="text-sm text-slate-500">Minutes</div>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <div className="text-4xl font-bold">{timeLeft.seconds}</div>
                            <div className="text-sm text-slate-500">Seconds</div>
                        </div>
                    </div>

                    {message && <p className="text-xl">{message}</p>}
                </div>
            </div>
        );
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
                        title={isFullscreen ? "Exit Fullscreen (F11 or F)" : "Enter Fullscreen (F11 or F)"}
                    >
                        {isFullscreen ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 20h4v-4H5v4zM15 20h4v-4h-4v4zM5 10h4V6H5v4zM15 10h4V6h-4v4z" />
                                </svg>
                                <span>Exit Fullscreen</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 4l-5-5m-7 11v4m0-4H4m4 4l-5-5m11 5v-4m0 4h4m-4-4l5 5" />
                                </svg>
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
                            ${isFullscreen ? "w-full h-full" : "w-[800px] h-[600px]"}
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
                            ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}
                        `}
                    >
                        {/* Fullscreen Overlay Controls */}
                        {isFullscreen && (
                            <div className="absolute top-4 right-4 z-50 flex items-center gap-4 bg-black/50 rounded-lg p-2 text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
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
                        <div className="absolute inset-[1px] bg-persivia-white rounded-lg overflow-hidden">
                            <Slideshow
                                slides={activeSlides}
                                effect={swiperEffect}
                                renderSlideContent={renderSlideContent}
                                onSlideChange={(index) => {
                                    // Handle slide change if needed
                                }}
                            />
                            {/* Date/Time Stamp Overlay */}
                            {showDateStamp && (
                                <div className="absolute bottom-4 right-4 bg-persivia-blue text-white px-4 py-2 rounded-lg shadow text-sm font-mono opacity-90 select-none z-50">
                                    {dateTime}
                                </div>
                            )}
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
                                value={swiperEffect}
                                onChange={(e) => setSwiperEffect(e.target.value)}
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
                                aria-checked={showDateStamp}
                                onClick={() => setShowDateStamp(!showDateStamp)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showDateStamp ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showDateStamp ? "translate-x-5" : "translate-x-1"}`} />
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