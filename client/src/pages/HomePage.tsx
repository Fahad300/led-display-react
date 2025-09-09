import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSlides } from '../contexts/SlideContext';
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, DocumentSlide as DocumentSlideType, TextSlide as TextSlideType, Employee } from '../types';
import { EventSlideComponent, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, DocumentSlide, TextSlide } from "../components/slides";
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
import SlideLogoOverlay from "../components/SlideLogoOverlay";
import { useEmployees } from "../contexts/EmployeeContext";
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
import { faCompress, faExpand, faTicket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDisplaySettings } from "../contexts/DisplaySettingsContext";
import { VideoSlide } from "../components/slides/VideoSlide";
import { useNavigate } from 'react-router-dom';
import { DigitalClock } from "../components/DigitalClock";
import NewsSlideComponent from "../components/NewsSlideComponent";
import { sessionService } from "../services/sessionService";
import { useToast } from "../contexts/ToastContext";
import { useUnifiedPolling } from "../contexts/UnifiedPollingContext";

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
        case SLIDE_TYPES.CURRENT_ESCALATIONS:
            return (
                <FontAwesomeIcon icon={faTicket} />
            );
        case SLIDE_TYPES.TEAM_COMPARISON:
            return (
                <FontAwesomeIcon icon={faTicket} />
            );
        case SLIDE_TYPES.TEXT:
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        default:
            return null;
    }
};

/**
 * Get the label for a slide type
 */
const getSlideTypeLabel = (type: typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES]) => {
    switch (type) {
        case SLIDE_TYPES.IMAGE:
            return "Image";
        case SLIDE_TYPES.VIDEO:
            return "Video";
        case SLIDE_TYPES.NEWS:
            return "News";
        case SLIDE_TYPES.EVENT:
            return "Event";
        case SLIDE_TYPES.DOCUMENT:
            return "Document";
        case SLIDE_TYPES.CURRENT_ESCALATIONS:
            return "Escalations";
        case SLIDE_TYPES.TEAM_COMPARISON:
            return "Team Comparison";
        case SLIDE_TYPES.GRAPH:
            return "Graph";
        case SLIDE_TYPES.TEXT:
            return "Text";
        default:
            return "Unknown";
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
            case SLIDE_TYPES.TEXT:
                const textSlide = slide as TextSlideType;
                return (
                    <div className="w-full h-24 relative rounded-lg overflow-hidden bg-persivia-light-gray">
                        <div className="flex items-center justify-center h-full p-2">
                            <div
                                className="text-xs text-gray-600 text-center line-clamp-3"
                                dangerouslySetInnerHTML={{
                                    __html: textSlide.data.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                                }}
                            />
                        </div>
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
    employees: Employee[];
}> = ({ slide, index, onToggleActive, employees }) => {
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
                const employee = employees.find((emp: Employee) => emp.id === eventSlide.data.employeeId);
                return employee ? employee.name : slide.name;
            }
        }
        return slide.name;
    };

    // Helper to get display source label for a slide
    const getDisplaySource = (slide: Slide): string => {
        if (
            slide.type === SLIDE_TYPES.EVENT &&
            (slide.data?.eventType === "birthday" || slide.data?.eventType === "anniversary")
        ) {
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
                                role="switch"
                                aria-checked={slide.active}
                                onClick={() => {
                                    // Debug logging only in development
                                    if (process.env.NODE_ENV === 'development') {
                                        console.log("Toggle clicked:", slide.id, slide.active ? 'ON' : 'OFF');
                                    }
                                    onToggleActive(slide.id);
                                }}
                                disabled={!(slide as EventSlideType).data.hasEvents}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" :
                                    (slide as EventSlideType).data.hasEvents ? "bg-slate-200" : "bg-slate-200 cursor-not-allowed opacity-50"
                                    }`}
                                title={!(slide as EventSlideType).data.hasEvents ? "No events today - cannot activate this slide" : ""}
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
                            <span>{getDisplaySource(slide)}</span>
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
    employees: Employee[];
}> = ({ slides, onReorder, onToggleActive, employees }) => {
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
        <div className="w-[450px] min-w-[400px] max-w-[500px] h-[calc(100vh-68px)] bg-persivia-white shadow-lg flex flex-col p-6 border-r border-persivia-light-gray pb-30">
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
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-[2rem]">
                        {slides.map((slide, index) => (
                            <SortableSlideCard
                                key={slide.id}
                                slide={slide}
                                index={index}
                                onToggleActive={onToggleActive}
                                employees={employees}
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






/**
 * Home Page Component - Displays the slideshow
 */


const HomePage: React.FC = () => {
    const { slides, reorderSlides, updateSlide, isEditing } = useSlides();
    const { settings, updateSettings, forceRefresh } = useDisplaySettings();
    const { employees } = useEmployees();
    const { addToast } = useToast();
    const { refreshAll, triggerImmediateRefresh } = useUnifiedPolling();
    const navigate = useNavigate();
    const [dateTime, setDateTime] = useState(new Date().toLocaleString());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const [orderedSlides, setOrderedSlides] = useState<Slide[]>([]);
    const [activeSlides, setActiveSlides] = useState<Slide[]>([]);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const [, setDateTimeState] = useState<string>("");
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [eventSlideStates, setEventSlideStates] = useState<{ [key: string]: boolean }>({});

    // Ref to track previous eventSlideStates to prevent unnecessary updates
    const prevEventSlideStates = useRef(eventSlideStates);


    // Helper functions for date checks - use API flags instead of recalculating
    const isBirthdayToday = (employee: Employee): boolean => {
        return employee.isBirthday === true;
    };

    const isAnniversaryToday = (employee: Employee): boolean => {
        return employee.isAnniversary === true;
    };

    // Process active slides to adjust EVENT slide duration and active state
    const processedActiveSlides = useMemo(() => {
        // Debug logging for slides


        return orderedSlides.map(slide => {
            if (slide.type === SLIDE_TYPES.EVENT) {
                // Birthday event slide
                if (slide.id === "birthday-event-slide") {
                    const birthdayEmployees = employees.filter(employee => isBirthdayToday(employee));
                    const hasBirthdays = birthdayEmployees.length > 0;
                    return {
                        ...slide,
                        duration: hasBirthdays && slide.active ? 10 : 0,
                        active: slide.active, // Respect the manual toggle state
                        data: {
                            ...slide.data,
                            employees: birthdayEmployees,
                            eventType: "birthday" as "birthday",
                            hasEvents: hasBirthdays
                        }
                    };
                }
                // Anniversary event slide
                if (slide.id === "anniversary-event-slide") {
                    const anniversaryEmployees = employees.filter(employee => isAnniversaryToday(employee));
                    const hasAnniversaries = anniversaryEmployees.length > 0;
                    return {
                        ...slide,
                        duration: hasAnniversaries && slide.active ? 10 : 0,
                        active: slide.active, // Respect the manual toggle state
                        data: {
                            ...slide.data,
                            employees: anniversaryEmployees,
                            eventType: "anniversary" as "anniversary",
                            hasEvents: hasAnniversaries
                        }
                    };
                }
            }
            return slide;
        });
    }, [orderedSlides]);

    // Load event slide states from database app settings
    useEffect(() => {
        const loadEventSlideStates = async () => {
            try {
                const sessionData = await sessionService.syncFromServer();
                if (sessionData?.appSettings?.eventSlideStates) {
                    setEventSlideStates(sessionData.appSettings.eventSlideStates);
                } else {
                    // Initialize with default values if none exist
                    const defaultStates = {
                        "birthday-event-slide": false,
                        "anniversary-event-slide": false
                    };
                    setEventSlideStates(defaultStates);
                    // Save default states to database
                    await sessionService.updateAppSettings({ eventSlideStates: defaultStates });
                }
            } catch (error) {
                console.error("Error loading event slide states:", error);
                // Fallback to default states
                const defaultStates = {
                    "birthday-event-slide": false,
                    "anniversary-event-slide": false
                };
                setEventSlideStates(defaultStates);
            }
        };

        loadEventSlideStates();
    }, []);

    // Initialize ordered slides and update active slides
    useEffect(() => {
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
            console.log("Event slides update - Employees:", employees.length, "Birthdays:", employees.filter(employee => isBirthdayToday(employee)).length, "Anniversaries:", employees.filter(employee => isAnniversaryToday(employee)).length);
        }

        // Always recreate event slides when employees data changes or when eventSlideStates change
        // This ensures event slides have correct hasEvents values based on current employee data
        const hasEmployeesData = employees.length > 0;
        const shouldUpdate = orderedSlides.length === 0 ||
            eventSlideStates !== prevEventSlideStates.current ||
            hasEmployeesData;

        if (shouldUpdate) {
            // Remove any existing event slides
            const nonEventSlides = slides.filter(slide => slide.type !== SLIDE_TYPES.EVENT);

            // Birthday event slide - always create, but only active if there are birthdays
            const birthdayEmployees = employees.filter(employee => isBirthdayToday(employee));
            const birthdayActiveState = eventSlideStates["birthday-event-slide"];
            const hasBirthdays = birthdayEmployees.length > 0;

            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
                console.log("Birthday slide:", hasBirthdays ? `${birthdayEmployees.length} employees` : "No birthdays");
            }

            const birthdayEventSlide: EventSlideType = {
                id: "birthday-event-slide",
                name: "Birthday Celebrations",
                type: SLIDE_TYPES.EVENT,
                active: hasBirthdays ? (birthdayActiveState ?? false) : false, // Only active if there are birthdays
                duration: hasBirthdays ? 10 : 0, // Only show duration if there are birthdays
                data: {
                    title: "Birthday Celebrations",
                    description: hasBirthdays
                        ? "Celebrating our team members' birthdays"
                        : "No birthdays today - cannot activate this slide",
                    date: new Date().toISOString(),
                    isEmployeeSlide: true,
                    employees: birthdayEmployees,
                    eventType: "birthday",
                    hasEvents: hasBirthdays
                },
                dataSource: "manual"
            };

            // Anniversary event slide - always create, but only active if there are anniversaries
            const anniversaryEmployees = employees.filter(employee => isAnniversaryToday(employee));
            const anniversaryActiveState = eventSlideStates["anniversary-event-slide"];
            const hasAnniversaries = anniversaryEmployees.length > 0;

            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
                console.log("Anniversary slide:", hasAnniversaries ? `${anniversaryEmployees.length} employees` : "No anniversaries");
            }

            const anniversaryEventSlide: EventSlideType = {
                id: "anniversary-event-slide",
                name: "Work Anniversaries",
                type: SLIDE_TYPES.EVENT,
                active: hasAnniversaries ? (anniversaryActiveState ?? false) : false, // Only active if there are anniversaries
                duration: hasAnniversaries ? 10 : 0, // Only show duration if there are anniversaries
                data: {
                    title: "Work Anniversaries",
                    description: hasAnniversaries
                        ? "Celebrating our team members' work anniversaries"
                        : "No work anniversaries today - cannot activate this slide",
                    date: new Date().toISOString(),
                    isEmployeeSlide: true,
                    employees: anniversaryEmployees,
                    eventType: "anniversary",
                    hasEvents: hasAnniversaries
                },
                dataSource: "manual"
            };

            // Always add both event slides (they will show as inactive if no events)
            const eventSlides: EventSlideType[] = [birthdayEventSlide, anniversaryEventSlide];
            setOrderedSlides([...nonEventSlides, ...eventSlides]);
        } else {
            // Just update the non-event slides without recreating the entire array
            const nonEventSlides = slides.filter(slide => slide.type !== SLIDE_TYPES.EVENT);
            const eventSlides = orderedSlides.filter(slide => slide.type === SLIDE_TYPES.EVENT);

            setOrderedSlides([...nonEventSlides, ...eventSlides]);
        }

        // Store current eventSlideStates for comparison
        prevEventSlideStates.current = eventSlideStates;

    }, [slides, eventSlideStates, employees]);

    // Update active slides when processedActiveSlides change
    useEffect(() => {
        const active = processedActiveSlides.filter(slide => slide.active);
        setActiveSlides(active);
    }, [processedActiveSlides]);

    // Handle slide reordering
    const handleReorder = ({ sourceIndex, destinationIndex }: ReorderResult) => {
        const newSlides = Array.from(orderedSlides);
        const [removed] = newSlides.splice(sourceIndex, 1);
        newSlides.splice(destinationIndex, 0, removed);
        setOrderedSlides(newSlides);
        reorderSlides(newSlides);
    };

    // Handle slide activation toggle
    const handleToggleActive = async (slideId: string) => {
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
            console.log("Toggle slide:", slideId);
        }
        const slideToUpdate = orderedSlides.find(s => s.id === slideId);

        if (slideToUpdate) {
            // For event slides, log the toggle action
            if (slideToUpdate.type === SLIDE_TYPES.EVENT) {
                const eventSlide = slideToUpdate as EventSlideType;
                const hasEvents = eventSlide.data.hasEvents;

                // Debug logging only in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Event slide toggle: ${eventSlide.data.eventType} - ${hasEvents ? 'has events' : 'no events'}`);
                }
            }

            const updatedSlide = { ...slideToUpdate, active: !slideToUpdate.active };
            updateSlide(updatedSlide);

            // Update local state to reflect the change immediately
            const newSlides = orderedSlides.map(slide =>
                slide.id === slideId ? updatedSlide : slide
            );
            setOrderedSlides(newSlides);

            // Store event slide state separately for persistence
            if (slideId === "birthday-event-slide" || slideId === "anniversary-event-slide") {
                const newEventStates = {
                    ...eventSlideStates,
                    [slideId]: updatedSlide.active
                };

                setEventSlideStates(newEventStates);

                // Save to database via app settings
                try {
                    await sessionService.updateAppSettings({ eventSlideStates: newEventStates });

                } catch (error) {
                    console.error("Error saving event slide states to database:", error);
                }
            }
        }
    };

    // Date/time updater
    useEffect(() => {
        const update = () => setDateTimeState(new Date().toLocaleString());
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
                return <EventSlideComponent slide={slide as EventSlideType} />;
            case SLIDE_TYPES.CURRENT_ESCALATIONS:
                return <CurrentEscalationsSlideComponent slide={slide} />;
            case SLIDE_TYPES.TEAM_COMPARISON:
                return <TeamComparisonSlideComponent slide={slide as TeamComparisonSlideType} />;
            case SLIDE_TYPES.GRAPH:
                return <GraphSlide slide={slide as GraphSlideType} />;
            case SLIDE_TYPES.DOCUMENT:
                return <DocumentSlide slide={slide as DocumentSlideType} />;
            case SLIDE_TYPES.TEXT:
                return <TextSlide slide={slide as TextSlideType} />;
            default:
                return null;
        }
    };

    // Update settings handlers
    const handleEffectChange = async (effect: string) => {
        try {
            await updateSettings({ swiperEffect: effect });
            addToast("✅ Slide effect updated successfully", "success");
        } catch (error) {
            console.error("Error updating slide effect:", error);
            addToast("❌ Failed to update slide effect", "error");
        }
    };

    const handleDateStampToggle = async () => {
        try {
            await updateSettings({ showDateStamp: !settings.showDateStamp });
            addToast("✅ Date stamp setting updated successfully", "success");
        } catch (error) {
            console.error("Error updating date stamp setting:", error);
            addToast("❌ Failed to update date stamp setting", "error");
        }
    };

    const handlePaginationToggle = async () => {
        try {
            await updateSettings({ hidePagination: !settings.hidePagination });
            addToast("✅ Pagination setting updated successfully", "success");
        } catch (error) {
            console.error("Error updating pagination setting:", error);
            addToast("❌ Failed to update pagination setting", "error");
        }
    };

    const handleArrowsToggle = async () => {
        try {
            await updateSettings({ hideArrows: !settings.hideArrows });
            addToast("✅ Arrow navigation setting updated successfully", "success");
        } catch (error) {
            console.error("Error updating arrow navigation setting:", error);
            addToast("❌ Failed to update arrow navigation setting", "error");
        }
    };

    const handleHidePersiviaLogoToggle = async () => {
        try {
            await updateSettings({ hidePersiviaLogo: !settings.hidePersiviaLogo });
            addToast("✅ Logo visibility setting updated successfully", "success");
        } catch (error) {
            console.error("Error updating logo visibility setting:", error);
            addToast("❌ Failed to update logo visibility setting", "error");
        }
    };

    // Show controls even when there are no active slides

    // --- UI ---
    return (
        <div className="flex h-full bg-persivia-light-gray">
            {/* Slide Management - First Column */}
            <SlideManagementColumn
                slides={orderedSlides}
                onReorder={handleReorder}
                onToggleActive={handleToggleActive}
                employees={employees}
            />

            {/* Slide Display - Middle Column */}
            <main className="flex-1 p-6 flex flex-col bg-persivia-white">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-center text-persivia-blue">LED Preview</h2>
                    {isEditing && (
                        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Syncing paused - editing in progress</span>
                        </div>
                    )}
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
                            {activeSlides.length > 0 ? (
                                <SwiperSlideshow
                                    key={`swiper-${settings.swiperEffect}`}
                                    slides={processedActiveSlides.filter(slide => slide.active)}
                                    renderSlideContent={renderSlideContent}
                                    onSlideChange={(index) => {
                                        setCurrentSlideIndex(index);
                                    }}
                                    hidePagination={settings.hidePagination}
                                    hideArrows={settings.hideArrows}
                                    effect={settings.swiperEffect}
                                    isFullscreen={isFullscreen}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-light-gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-600">No Active Slides</h3>
                                    <p className="text-slate-500 text-center">Create and activate slides to see them here</p>
                                </div>
                            )}
                            {/* Date/Time Stamp Overlay - Moved to top right */}
                            {settings.showDateStamp && (
                                <div className="absolute top-4 right-4 z-[10000]">
                                    <DigitalClock />
                                </div>
                            )}

                            <SlideLogoOverlay isFullscreen={isFullscreen} hideLogo={settings.hidePersiviaLogo} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Settings Panel - Right Column */}
            <aside className="w-[370px] min-w-[320px] max-w-[400px] bg-persivia-white shadow-lg flex flex-col p-6 border-l border-persivia-light-gray">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-center text-persivia-blue">Display Controls</h2>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Live Sync</span>
                    </div>
                </div>

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

                        {/* Hide Persivia Logo Toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="hidePersiviaLogo" className="text-sm font-medium">
                                Hide Persivia Logo
                            </label>
                            <button
                                id="hidePersiviaLogo"
                                type="button"
                                role="switch"
                                aria-checked={settings.hidePersiviaLogo}
                                onClick={handleHidePersiviaLogoToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.hidePersiviaLogo ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.hidePersiviaLogo ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Force Refresh Button - Single button for immediate refresh on all displays */}
                <button
                    onClick={async () => {
                        try {
                            // Refresh both local data and trigger remote refresh
                            await Promise.all([
                                triggerImmediateRefresh(), // Immediate local data refresh
                                sessionService.triggerRemoteRefresh("all") // Remote refresh for all displays
                            ]);
                            addToast("✅ Force refresh sent to all remote displays", "success");
                        } catch (error) {
                            console.error("Error triggering force refresh:", error);
                            addToast("❌ Failed to trigger force refresh", "error");
                        }
                    }}
                    className="w-full font-medium py-2 px-4 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Force Refresh All Displays
                </button>

                {/* Auto-polling info */}
                <div className="text-xs text-gray-500 text-center mt-2">
                    Data auto-syncs every 5 minutes • Use Force Refresh for immediate updates
                </div>


            </aside>
        </div>
    );
};

export default HomePage;