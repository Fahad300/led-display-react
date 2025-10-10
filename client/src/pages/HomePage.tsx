import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUnified } from '../contexts/UnifiedContext';
import { useSettings } from '../contexts/SettingsContext';
import { dispatchSlidesChange } from '../utils/realtimeSync';
import { triggerDisplayUpdate } from '../utils/updateEvents';
import { connectSocket, disconnectSocket, onSocketStateChange, ConnectionState } from '../utils/socket';
import { Slide, SLIDE_TYPES, ImageSlide as ImageSlideType, VideoSlide as VideoSlideType, NewsSlide, EventSlide as EventSlideType, TeamComparisonSlide as TeamComparisonSlideType, GraphSlide as GraphSlideType, TextSlide as TextSlideType, Employee } from '../types';
import { logger } from '../utils/logger';
import { videoPreloadManager } from '../utils/videoPreloadManager';
import { EventSlideComponent, ImageSlide, CurrentEscalationsSlideComponent, TeamComparisonSlideComponent, GraphSlide, TextSlide } from "../components/slides";
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
import SwiperSlideshow from "../components/SwiperSlideshow";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { faCompress, faExpand, faTicket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { VideoSlide } from "../components/slides/VideoSlide";
import { DigitalClock } from "../components/DigitalClock";
import NewsSlideComponent from "../components/NewsSlideComponent";
import { useToast } from "../contexts/ToastContext";

// Version constant - update this when releasing new versions
const VERSION = "1.0.1";

// Type for reordering result
interface ReorderResult {
    sourceIndex: number;
    destinationIndex: number;
}

// Update the TRANSITION_EFFECTS constant
const TRANSITION_EFFECTS = [
    { value: "slide", label: "Slide" },
    { value: "fade", label: "Fade" }
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
                    <div className="w-16 h-12 relative rounded overflow-hidden bg-persivia-light-gray flex-shrink-0">
                        {imageSlide.data.imageUrl ? (
                            <img
                                src={imageSlide.data.imageUrl}
                                alt={imageSlide.data.caption || "Slide preview"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-persivia-gray">No image</span>
                            </div>
                        )}
                    </div>
                );
            case SLIDE_TYPES.VIDEO:
                const videoSlide = slide as VideoSlideType;
                return (
                    <div className="w-16 h-12 relative rounded overflow-hidden bg-persivia-light-gray flex-shrink-0">
                        {videoSlide.data.videoUrl ? (
                            <>
                                {/* Video thumbnail - using the video element to capture a frame */}
                                <video
                                    src={videoSlide.data.videoUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                    onLoadedMetadata={(e) => {
                                        // Seek to 1 second to get a good frame
                                        e.currentTarget.currentTime = 1;
                                    }}
                                />
                                {/* Play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                    <div className="w-4 h-4 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                        <svg className="w-2 h-2 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-persivia-gray">No video</span>
                            </div>
                        )}
                    </div>
                );
            case SLIDE_TYPES.NEWS:
                const newsSlide = slide as NewsSlide;
                return (
                    <div className="w-16 h-12 relative rounded overflow-hidden bg-persivia-light-gray flex-shrink-0">
                        {newsSlide.data.backgroundImage ? (
                            <img
                                src={newsSlide.data.backgroundImage}
                                alt={newsSlide.data.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-persivia-gray">No image</span>
                            </div>
                        )}
                    </div>
                );
            case SLIDE_TYPES.TEXT:
                return null; // No preview for text slides
            default:
                return null; // No preview for other slide types
        }
    };

    const preview = renderPreview();

    // Only show preview container if there's a preview to show
    if (!preview) {
        return null;
    }

    return (
        <div className="mt-2 flex justify-end">
            {preview}
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
            return "API";
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
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-persivia-blue">{getDisplayName()}</h3>
                            {slide.type === SLIDE_TYPES.EVENT && (
                                <span className={`text-xs px-2 py-1 rounded-full ${(slide as EventSlideType).data.hasEvents
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                    }`}>
                                    {(slide as EventSlideType).data.eventCount || 0} Event{((slide as EventSlideType).data.eventCount || 0) !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {slide.type === SLIDE_TYPES.EVENT ? (
                            <button
                                type="button"
                                role="switch"
                                aria-checked={slide.active}
                                onClick={() => {
                                    // Debug logging only in development
                                    if (process.env.NODE_ENV === 'development') {
                                        // Toggle clicked
                                    }
                                    onToggleActive(slide.id);
                                }}
                                disabled={!(slide as EventSlideType).data.hasEvents}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active
                                    ? "bg-persivia-teal"
                                    : "bg-slate-200"
                                    } ${!(slide as EventSlideType).data.hasEvents ? "opacity-50 cursor-not-allowed" : ""}`}
                                title={(slide as EventSlideType).data.hasEvents
                                    ? `Toggle ${(slide as EventSlideType).data.eventType} slide (${(slide as EventSlideType).data.eventCount} event${((slide as EventSlideType).data.eventCount || 0) !== 1 ? 's' : ''})`
                                    : `No ${(slide as EventSlideType).data.eventType}s today - slide disabled`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                        }`}
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
        <div className="w-[450px] min-w-[400px] max-w-[500px] h-[calc(100vh-68px)] bg-persivia-white shadow-lg flex flex-col p-6 border-r border-persivia-light-gray pb-30 pr-0">
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
                        {slides.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>No slides available</p>
                                <p className="text-sm">Check console for debug info</p>
                            </div>
                        ) : (
                            slides.map((slide, index) => {
                                logger.debug(`Rendering slide ${index}:`, {
                                    id: slide.id,
                                    name: slide.name,
                                    type: slide.type,
                                    active: slide.active
                                });
                                return (
                                    <SortableSlideCard
                                        key={slide.id}
                                        slide={slide}
                                        index={index}
                                        onToggleActive={onToggleActive}
                                        employees={employees}
                                    />
                                );
                            })
                        )}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isVideoSlide = (slide: Slide): slide is VideoSlideType => {
    return slide.type === SLIDE_TYPES.VIDEO;
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars








/**
 * Home Page Component - Displays the slideshow
 */


const HomePage: React.FC = () => {
    const queryClient = useQueryClient();
    const {
        slides,
        setSlides,
        reorderSlides,
        updateSlide,
        employees,
        saveToDatabase,
        refreshApiData,
        syncToRemoteDisplays,
        isEditing,
        setIsEditing,
        isDisplayPage,
        apiPollingState,
        hasUnsavedChanges,
        forceApiCheck,
        clearApiCache
    } = useUnified();

    // Socket.IO connection state (for future UI indication)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [socketState, setSocketState] = useState<ConnectionState>("disconnected");

    /**
     * Ensure event slides exist in the database - run once on mount
     * Event slides are stored like regular slides and their active state persists
     */
    useEffect(() => {
        const birthdaySlide = slides.find(s => s.id === "birthday-event-slide");
        const anniversarySlide = slides.find(s => s.id === "anniversary-event-slide");

        // Only initialize if slides have loaded and event slides don't exist
        const needsInitialization = (!birthdaySlide || !anniversarySlide) && slides.length > 0;

        if (needsInitialization) {
            logger.info("🎂 Initializing event slides in database");

            const newSlides: Slide[] = [];

            if (!birthdaySlide) {
                const birthdayEventSlide: EventSlideType = {
                    id: "birthday-event-slide",
                    name: "Birthday Celebrations",
                    type: SLIDE_TYPES.EVENT,
                    active: false, // Default to inactive until user enables
                    duration: 10,
                    data: {
                        title: "Birthday Celebrations",
                        description: "Celebrating our team members' birthdays",
                        date: new Date().toISOString(),
                        isEmployeeSlide: true,
                        employees: [],
                        eventType: "birthday",
                        hasEvents: false,
                        eventCount: 0
                    },
                    dataSource: "manual"
                };
                newSlides.push(birthdayEventSlide);
                logger.info("📝 Created birthday event slide");
            }

            if (!anniversarySlide) {
                const anniversaryEventSlide: EventSlideType = {
                    id: "anniversary-event-slide",
                    name: "Work Anniversaries",
                    type: SLIDE_TYPES.EVENT,
                    active: false, // Default to inactive until user enables
                    duration: 10,
                    data: {
                        title: "Work Anniversaries",
                        description: "Celebrating our team members' work anniversaries",
                        date: new Date().toISOString(),
                        isEmployeeSlide: true,
                        employees: [],
                        eventType: "anniversary",
                        hasEvents: false,
                        eventCount: 0
                    },
                    dataSource: "manual"
                };
                newSlides.push(anniversaryEventSlide);
                logger.info("📝 Created anniversary event slide");
            }

            if (newSlides.length > 0) {
                // Add new event slides to existing slides
                const updatedSlides = [...slides, ...newSlides];
                setSlides(updatedSlides);
                saveToDatabase(updatedSlides);
                logger.success("✅ Event slides initialized and saved to database");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides]); // Only depend on slides - setSlides and saveToDatabase are stable

    /**
     * Socket.IO Connection for Broadcasting Updates
     * 
     * HomePage connects to Socket.IO to broadcast updates to remote DisplayPages.
     * When admin saves slides/settings, it triggers network-wide updates.
     */
    useEffect(() => {
        logger.info("🔌 HomePage: Connecting to Socket.IO for broadcasting updates");

        // Connect to Socket.IO server
        connectSocket();

        // Subscribe to socket state changes
        const unsubscribe = onSocketStateChange((state: ConnectionState) => {
            setSocketState(state);
            logger.info(`📡 HomePage Socket state: ${state}`);

            if (state === "connected") {
                logger.success("✅ HomePage: Socket.IO connected - ready to broadcast");
            } else if (state === "error") {
                logger.warn("⚠️ HomePage: Socket.IO error - updates will use BroadcastChannel only");
            }
        });

        // Cleanup on unmount
        return () => {
            logger.info("🔌 HomePage: Disconnecting from Socket.IO");
            unsubscribe();
            disconnectSocket();
        };
    }, []);

    // NOTE: Auto-activation removed to respect user's manual toggles
    // Event slides will only be activated/deactivated by explicit user action

    // Debug logging for slides
    useEffect(() => {
        logger.debug("HomePage - Current slides:", {
            totalSlides: slides.length,
            eventSlides: slides.filter(s => s.type === SLIDE_TYPES.EVENT).length,
            allSlides: slides.map(s => ({ id: s.id, name: s.name, type: s.type, active: s.active }))
        });
    }, [slides]);

    // Debug logging for employees
    useEffect(() => {
        const birthdayEmployees = employees.filter(e => e.isBirthday === true);
        const anniversaryEmployees = employees.filter(e => e.isAnniversary === true);

        logger.data("HomePage - Current employees:", {
            totalEmployees: employees.length,
            birthdayCount: birthdayEmployees.length,
            anniversaryCount: anniversaryEmployees.length,
            birthdayEmployees: birthdayEmployees.map(e => ({ name: e.name, isBirthday: e.isBirthday })),
            anniversaryEmployees: anniversaryEmployees.map(e => ({ name: e.name, isAnniversary: e.isAnniversary }))
        });
    }, [employees]);

    /**
     * Process slides: Update employee data in event slides without changing their active state
     * Event slides are now stored in the database like regular slides
     */
    const processedSlides = useMemo(() => {
        const birthdayEmployees = employees.filter(employee => employee.isBirthday === true);
        const anniversaryEmployees = employees.filter(employee => employee.isAnniversary === true);

        // Update slides: refresh employee data in event slides while preserving their active state
        const updatedSlides = slides.map(slide => {
            // Update birthday event slide with current employee data
            if (slide.id === "birthday-event-slide" && slide.type === SLIDE_TYPES.EVENT) {
                const eventSlide = slide as EventSlideType;
                return {
                    ...eventSlide,
                    // Keep the active state from database! Don't change it!
                    active: eventSlide.active,
                    data: {
                        ...eventSlide.data,
                        employees: birthdayEmployees,
                        hasEvents: birthdayEmployees.length > 0,
                        eventCount: birthdayEmployees.length,
                        date: new Date().toISOString()
                    }
                } as EventSlideType;
            }

            // Update anniversary event slide with current employee data
            if (slide.id === "anniversary-event-slide" && slide.type === SLIDE_TYPES.EVENT) {
                const eventSlide = slide as EventSlideType;
                return {
                    ...eventSlide,
                    // Keep the active state from database! Don't change it!
                    active: eventSlide.active,
                    data: {
                        ...eventSlide.data,
                        employees: anniversaryEmployees,
                        hasEvents: anniversaryEmployees.length > 0,
                        eventCount: anniversaryEmployees.length,
                        date: new Date().toISOString()
                    }
                } as EventSlideType;
            }

            // Return all other slides unchanged
            return slide;
        });

        const birthdaySlide = updatedSlides.find(s => s.id === "birthday-event-slide");
        const anniversarySlide = updatedSlides.find(s => s.id === "anniversary-event-slide");

        logger.data("HomePage - Processed slides:", {
            totalSlides: updatedSlides.length,
            birthdayEmployees: birthdayEmployees.length,
            anniversaryEmployees: anniversaryEmployees.length,
            birthdaySlide: birthdaySlide ? {
                id: birthdaySlide.id,
                active: birthdaySlide.active,
                hasEvents: (birthdaySlide as EventSlideType).data.hasEvents,
                eventCount: (birthdaySlide as EventSlideType).data.eventCount
            } : "NOT FOUND",
            anniversarySlide: anniversarySlide ? {
                id: anniversarySlide.id,
                active: anniversarySlide.active,
                hasEvents: (anniversarySlide as EventSlideType).data.hasEvents,
                eventCount: (anniversarySlide as EventSlideType).data.eventCount
            } : "NOT FOUND"
        });

        return updatedSlides;
    }, [slides, employees]);

    // HomePage manages event slides locally for its own display
    // SlidesDisplay will create its own event slides based on the same logic
    // This prevents infinite loops and circular dependencies

    const { displaySettings, updateDisplaySettings, lastSynced } = useSettings();
    const { addToast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const [videoReadinessCheck, setVideoReadinessCheck] = useState(0); // Force re-render when videos become ready

    /**
     * Get active slides from processed slides (with employee counts injected)
     * Filter out video slides that aren't ready yet using the global video preload manager
     */
    const activeSlides = useMemo(() => {
        return processedSlides.filter(slide => {
            if (!slide.active) return false;

            // For video slides, only include if fully preloaded and ready
            if (slide.type === SLIDE_TYPES.VIDEO) {
                const videoSlide = slide as VideoSlideType;
                const isReady = videoPreloadManager.isVideoReady(videoSlide.data.videoUrl);

                if (!isReady) {
                    logger.debug(`⏳ Skipping video slide in HomePage (not ready): ${slide.name}`);
                }

                return isReady;
            }

            // All other slide types are always ready
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processedSlides, videoReadinessCheck]); // videoReadinessCheck intentionally forces re-computation when videos become ready

    // Create a key that changes when active slides change to force re-render
    const slideshowKey = useMemo(() => {
        return `slideshow-${activeSlides.map(s => s.id).join('-')}`;
    }, [activeSlides]);

    /**
     * Preload all videos in background and listen for ready state changes
     */
    useEffect(() => {
        const preloadAllVideos = async () => {
            // Extract all video URLs from processed slides
            const videoUrls: string[] = [];

            processedSlides.forEach(slide => {
                if (slide.type === SLIDE_TYPES.VIDEO) {
                    const videoSlide = slide as VideoSlideType;
                    if (videoSlide.data.videoUrl) {
                        videoUrls.push(videoSlide.data.videoUrl);
                    }
                }
            });

            if (videoUrls.length === 0) return;

            logger.info(`🎬 HomePage: Preloading ${videoUrls.length} videos in background`);

            // Preload all videos
            await videoPreloadManager.preloadMultipleVideos(videoUrls);

            // Force re-render to include newly ready videos
            setVideoReadinessCheck(prev => prev + 1);

            logger.success(`✅ HomePage: Video preload complete`);
            videoPreloadManager.logCacheStats();
        };

        preloadAllVideos();

        // Set up periodic check for video readiness (every 5 seconds)
        const readinessCheckInterval = setInterval(() => {
            // Check if any new videos have become ready
            const hasNewReadyVideos = processedSlides.some(slide => {
                if (slide.type === SLIDE_TYPES.VIDEO) {
                    const videoSlide = slide as VideoSlideType;
                    return videoPreloadManager.isVideoReady(videoSlide.data.videoUrl);
                }
                return false;
            });

            if (hasNewReadyVideos) {
                // Force re-render to include newly ready videos
                setVideoReadinessCheck(prev => prev + 1);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(readinessCheckInterval);
    }, [processedSlides]);

    // Determine if sync is needed
    const needsSync = useMemo(() => {
        // Check if there are API changes that need syncing
        const hasApiChanges = apiPollingState.hasApiChanges;

        // Check if settings need syncing (if lastSynced is null or very old)
        const settingsNeedSync = !lastSynced ||
            (Date.now() - lastSynced.getTime()) > 300000; // 5 minutes

        // Check if there are unsaved slide changes
        const hasSlideChanges = hasUnsavedChanges();

        // Check if we're currently in editing mode (which might have unsaved changes)
        const isInEditingMode = isEditing;

        const syncNeeded = hasApiChanges || settingsNeedSync || hasSlideChanges || isInEditingMode;

        logger.debug("HomePage: Sync detection:", {
            hasApiChanges,
            settingsNeedSync,
            hasSlideChanges,
            isInEditingMode,
            syncNeeded
        });

        return syncNeeded;
    }, [apiPollingState.hasApiChanges, lastSynced, hasUnsavedChanges, isEditing]);

    // Get sync status message
    const getSyncStatusMessage = () => {
        if (apiPollingState.hasApiChanges) {
            return "API data changes detected - sync available";
        }
        if (hasUnsavedChanges()) {
            return "Slide changes detected - sync available";
        }
        if (!lastSynced || (Date.now() - lastSynced.getTime()) > 300000) {
            return "Settings sync needed";
        }
        if (isEditing) {
            return "Unsaved changes detected";
        }
        return "Everything is up to date";
    };

    // Debug log for page detection
    useEffect(() => {
        logger.debug("HomePage: isDisplayPage =", isDisplayPage);
    }, [isDisplayPage]);

    // Simple test function
    const testDataFlow = async () => {
        logger.debug("Testing data flow...");
        logger.debug("Current slides:", slides.length);
        logger.debug("Active slides:", activeSlides.length);
        logger.debug("Display settings:", displaySettings);

        // Test saving data
        try {
            logger.debug("Testing save to database...");
            await saveToDatabase();
            logger.success("Save test successful!");
        } catch (error) {
            logger.error("Save test failed:", error);
        }
    };

    // API test function
    const testApiEndpoints = async () => {
        logger.api("Testing API endpoints...");
        try {
            const { testApiEndpoints } = await import('../services/api');
            await testApiEndpoints();
        } catch (error) {
            logger.error("API test failed:", error);
        }
    };

    // Make test functions available globally for browser console testing
    (window as any).testDataFlow = testDataFlow;
    (window as any).testApiEndpoints = testApiEndpoints;

    // Auto-save is now handled by UnifiedContext only
    // No duplicate auto-save logic needed here

    // Event processing is now handled in UnifiedContext - single source of truth


    // Handle slide reordering
    const handleReorder = async ({ sourceIndex, destinationIndex }: ReorderResult) => {
        if (sourceIndex === destinationIndex) return;

        // Use original slides for reordering to maintain data integrity
        const newSlides = [...slides];
        const [removed] = newSlides.splice(sourceIndex, 1);
        newSlides.splice(destinationIndex, 0, removed);

        // Update local state
        reorderSlides(newSlides);

        // Save to database FIRST (critical: must complete before display update)
        logger.sync("HomePage: Saving slide reorder to database...");
        await saveToDatabase();
        logger.success("HomePage: Slide reorder saved to database");

        // Dispatch real-time sync event to notify DisplayPage immediately
        // TODO: Remove dispatchSlidesChange when WebSocket is enabled - triggerDisplayUpdate will handle it
        dispatchSlidesChange(newSlides, [`slide-reordered-from-${sourceIndex}-to-${destinationIndex}`], 'homepage');

        // Trigger unified display update (WebSocket-ready)
        // Send ALL slides to DisplayPage (including inactive ones so DisplayPage knows full state)
        const activeCount = newSlides.filter(s => s.active).length;

        logger.info(`📡 Broadcasting reordered slides to DisplayPage: ${newSlides.length} total slides (${activeCount} active, ${newSlides.length - activeCount} inactive)`);

        await triggerDisplayUpdate("slides", "HomePage/reorder", queryClient, {
            slides: newSlides, // Send ALL slides (DisplayPage filters for display)
            sourceIndex,
            destinationIndex,
            slideId: removed.id
        });

        // Trigger display page refresh when slides are reordered
        logger.sync("HomePage: Triggering display page refresh for slide reorder...");
        const reloadEvent = new CustomEvent('forceDisplayReload', {
            detail: {
                timestamp: new Date().toISOString(),
                reason: 'slide_reorder',
                sourceIndex: sourceIndex,
                destinationIndex: destinationIndex,
                movedSlideId: removed.id,
                movedSlideName: removed.name
            }
        });
        window.dispatchEvent(reloadEvent);
        logger.success("HomePage: Display page refresh triggered for slide reorder");
    };

    // Handle slide activation toggle
    const handleToggleActive = async (slideId: string) => {
        logger.sync('HomePage - Slide activation toggle started:', {
            slideId: slideId,
            timestamp: new Date().toISOString()
        });

        const slideToUpdate = processedSlides.find(s => s.id === slideId);

        if (slideToUpdate) {
            const newActiveState = !slideToUpdate.active;

            logger.debug('HomePage - Slide activation toggle details:', {
                slideId: slideToUpdate.id,
                slideName: slideToUpdate.name,
                slideType: slideToUpdate.type,
                currentActiveState: slideToUpdate.active,
                newActiveState: newActiveState,
                slideDuration: slideToUpdate.duration,
                timestamp: new Date().toISOString()
            });

            // Event slides are now treated like regular slides - stored in database with persistent active state
            // No special handling needed!
            const updatedSlide = { ...slideToUpdate, active: newActiveState };

            logger.sync('HomePage - Calling updateSlide with:', {
                slideId: updatedSlide.id,
                slideName: updatedSlide.name,
                slideType: updatedSlide.type,
                active: updatedSlide.active,
                duration: updatedSlide.duration,
                timestamp: new Date().toISOString()
            });

            // Update local state (disable auto-save since we'll save explicitly)
            updateSlide(updatedSlide, false);

            // Save to database FIRST (critical: must complete before display update)
            logger.sync("HomePage: Saving slide toggle to database...");
            await saveToDatabase();
            logger.success("HomePage: Slide toggle saved to database");

            // Dispatch real-time sync event to notify DisplayPage immediately
            // TODO: Remove dispatchSlidesChange when WebSocket is enabled - triggerDisplayUpdate will handle it
            dispatchSlidesChange(processedSlides.map(s => s.id === slideId ? updatedSlide : s), [`slide-${slideId}-toggled-${newActiveState ? 'active' : 'inactive'}`], 'homepage');

            // Trigger unified display update (WebSocket-ready)
            // Send ALL slides to DisplayPage (including inactive ones so DisplayPage knows full state)
            const allSlidesAfterUpdate = processedSlides.map(s => s.id === slideId ? updatedSlide : s);
            const activeCount = allSlidesAfterUpdate.filter(s => s.active).length;

            logger.info(`📡 Broadcasting to DisplayPage: ${allSlidesAfterUpdate.length} total slides (${activeCount} active, ${allSlidesAfterUpdate.length - activeCount} inactive)`);

            await triggerDisplayUpdate("slides", "HomePage/toggleActive", queryClient, {
                slides: allSlidesAfterUpdate, // Send ALL slides (DisplayPage filters for display)
                slideId: updatedSlide.id,
                slideName: updatedSlide.name,
                active: updatedSlide.active
            });

            // Trigger display page refresh when slide active status changes
            logger.sync("HomePage: Triggering display page refresh for slide toggle...");
            const reloadEvent = new CustomEvent('forceDisplayReload', {
                detail: {
                    timestamp: new Date().toISOString(),
                    reason: 'slide_toggle_homepage',
                    slideId: updatedSlide.id,
                    slideName: updatedSlide.name,
                    active: updatedSlide.active
                }
            });
            window.dispatchEvent(reloadEvent);
            logger.success("HomePage: Display page refresh triggered for slide toggle");
        }
    };


    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            slidesContainerRef.current?.requestFullscreen().catch(err => {
                logger.error(`Error attempting to enable fullscreen: ${err.message}`);
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
    const renderSlideContent = (slide: Slide, onVideoEnd?: () => void) => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return <ImageSlide slide={slide as ImageSlideType} />;
            case SLIDE_TYPES.VIDEO:
                // Video slides are only rendered when ready, so no need to check isVideoReady
                return (
                    <VideoSlide
                        slide={slide as VideoSlideType}
                        onVideoEnd={onVideoEnd}
                        isVideoReady={true} // Always true since we filter out unready videos
                    />
                );
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
            case SLIDE_TYPES.TEXT:
                return <TextSlide slide={slide as TextSlideType} />;
            default:
                return null;
        }
    };

    // Update displaySettings handlers
    const handleEffectChange = async (effect: string) => {
        logger.sync('HomePage - Effect change started:', {
            newEffect: effect,
            currentEffect: displaySettings.swiperEffect,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ swiperEffect: effect });

            // Trigger unified display update (WebSocket-ready)
            const updatedSettings = { ...displaySettings, swiperEffect: effect };
            await triggerDisplayUpdate("settings", "HomePage/effectChange", queryClient, {
                displaySettings: updatedSettings,  // Send full settings for instant sync
                setting: "swiperEffect",
                value: effect
            });

            logger.success('HomePage - Effect change successful:', {
                newEffect: effect,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Slide effect updated successfully", "success");
        } catch (error) {
            logger.error("HomePage - Error updating slide effect:", error);
            addToast("❌ Failed to update slide effect", "error");
        }
    };

    const handleDateStampToggle = async () => {
        const newValue = !displaySettings.showDateStamp;
        logger.sync('HomePage - Date stamp toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.showDateStamp,
            timestamp: new Date().toISOString()
        });

        await updateDisplaySettings({ showDateStamp: newValue });

        // Trigger unified display update (WebSocket-ready)
        const updatedSettings = { ...displaySettings, showDateStamp: newValue };
        await triggerDisplayUpdate("settings", "HomePage/dateStamp", queryClient, {
            displaySettings: updatedSettings,  // Send full settings for instant sync
            setting: "showDateStamp",
            value: newValue
        });

        logger.success('HomePage - Date stamp toggle successful:', {
            newValue: newValue,
            timestamp: new Date().toISOString()
        });
        addToast("✅ Date stamp setting updated successfully", "success");
    };

    const handlePaginationToggle = async () => {
        const newValue = !displaySettings.hidePagination;
        logger.sync('HomePage - Pagination toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hidePagination,
            timestamp: new Date().toISOString()
        });

        await updateDisplaySettings({ hidePagination: newValue });

        // Trigger unified display update (WebSocket-ready)
        const updatedSettings = { ...displaySettings, hidePagination: newValue };
        await triggerDisplayUpdate("settings", "HomePage/pagination", queryClient, {
            displaySettings: updatedSettings,  // Send full settings for instant sync
            setting: "hidePagination",
            value: newValue
        });

        logger.success('HomePage - Pagination toggle successful:', {
            newValue: newValue,
            timestamp: new Date().toISOString()
        });
        addToast("✅ Pagination setting updated successfully", "success");
    };

    const handleArrowsToggle = async () => {
        const newValue = !displaySettings.hideArrows;
        logger.sync('HomePage - Arrows toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hideArrows,
            timestamp: new Date().toISOString()
        });

        await updateDisplaySettings({ hideArrows: newValue });

        // Trigger unified display update (WebSocket-ready)
        const updatedSettings = { ...displaySettings, hideArrows: newValue };
        await triggerDisplayUpdate("settings", "HomePage/arrows", queryClient, {
            displaySettings: updatedSettings,  // Send full settings for instant sync
            setting: "hideArrows",
            value: newValue
        });

        logger.success('HomePage - Arrows toggle successful:', {
            newValue: newValue,
            timestamp: new Date().toISOString()
        });
        addToast("✅ Arrow navigation setting updated successfully", "success");
    };

    const handleHidePersiviaLogoToggle = async () => {
        const newValue = !displaySettings.hidePersiviaLogo;
        logger.sync('HomePage - Logo visibility toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hidePersiviaLogo,
            timestamp: new Date().toISOString()
        });

        await updateDisplaySettings({ hidePersiviaLogo: newValue });

        // Trigger unified display update (WebSocket-ready)
        const updatedSettings = { ...displaySettings, hidePersiviaLogo: newValue };
        await triggerDisplayUpdate("settings", "HomePage/logo", queryClient, {
            displaySettings: updatedSettings,  // Send full settings for instant sync
            setting: "hidePersiviaLogo",
            value: newValue
        });

        logger.success('HomePage - Logo visibility toggle successful:', {
            newValue: newValue,
            timestamp: new Date().toISOString()
        });
        addToast("✅ Logo visibility setting updated successfully", "success");
    };

    const handleDevelopmentModeToggle = async () => {
        const newValue = !displaySettings.developmentMode;
        logger.sync('HomePage - Development mode toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.developmentMode,
            timestamp: new Date().toISOString()
        });

        await updateDisplaySettings({ developmentMode: newValue });

        // Trigger unified display update (WebSocket-ready)
        const updatedSettings = { ...displaySettings, developmentMode: newValue };
        await triggerDisplayUpdate("settings", "HomePage/devMode", queryClient, {
            displaySettings: updatedSettings,  // Send full settings for instant sync
            setting: "developmentMode",
            value: newValue
        });

        logger.success('HomePage - Development mode toggle successful:', {
            newValue: newValue,
            timestamp: new Date().toISOString()
        });
        addToast("✅ Development mode setting updated successfully", "success");
    };

    // Show controls even when there are no active slides

    // --- UI ---
    return (
        <div className="flex h-full bg-persivia-light-gray" data-editing={isEditing ? "true" : "false"}>
            {/* Slide Management - First Column */}
            <SlideManagementColumn
                slides={processedSlides}
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
                                    key={slideshowKey}
                                    slides={activeSlides}
                                    renderSlideContent={renderSlideContent}
                                    hidePagination={displaySettings.hidePagination}
                                    hideArrows={displaySettings.hideArrows}
                                    effect={displaySettings.swiperEffect}
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
                            {displaySettings.showDateStamp && (
                                <div className="absolute top-4 right-4 z-[10000]">
                                    <DigitalClock />
                                </div>
                            )}

                            <SlideLogoOverlay isFullscreen={isFullscreen} hideLogo={displaySettings.hidePersiviaLogo} />
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

                {/* Slide Statistics Card */}
                <div className="bg-persivia-light-gray/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-3">Slide Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-persivia-blue">
                                {processedSlides.length}
                            </div>
                            <div className="text-sm text-gray-600">Total Slides</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-persivia-teal">
                                {activeSlides.length}
                            </div>
                            <div className="text-sm text-gray-600">Active Slides</div>
                        </div>
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
                                value={displaySettings.swiperEffect}
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
                                aria-checked={displaySettings.showDateStamp}
                                onClick={handleDateStampToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${displaySettings.showDateStamp ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${displaySettings.showDateStamp ? "translate-x-5" : "translate-x-1"}`} />
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
                                aria-checked={displaySettings.hidePagination}
                                onClick={handlePaginationToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${displaySettings.hidePagination ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${displaySettings.hidePagination ? "translate-x-5" : "translate-x-1"}`} />
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
                                aria-checked={displaySettings.hideArrows}
                                onClick={handleArrowsToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${displaySettings.hideArrows ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${displaySettings.hideArrows ? "translate-x-5" : "translate-x-1"}`} />
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
                                aria-checked={displaySettings.hidePersiviaLogo}
                                onClick={handleHidePersiviaLogoToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${displaySettings.hidePersiviaLogo ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${displaySettings.hidePersiviaLogo ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {/* Development Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <label htmlFor="developmentMode" className="text-sm font-medium">
                                    Development Mode
                                </label>
                                <span className="text-xs text-gray-500">Show testing overlay in display page</span>
                            </div>
                            <button
                                id="developmentMode"
                                type="button"
                                role="switch"
                                aria-checked={displaySettings.developmentMode}
                                onClick={handleDevelopmentModeToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${displaySettings.developmentMode ? "bg-persivia-teal" : "bg-slate-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${displaySettings.developmentMode ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                </div>


                {/* Intelligent Force Sync Button */}
                <button
                    type="button"
                    onClick={async () => {
                        logger.sync("Force Sync button clicked!");
                        try {
                            logger.sync("HomePage: Force syncing - updating API data, unified objects, saving to database, syncing displays, and reloading...");

                            // Step 1: Clear any stale cached data first
                            logger.sync("Step 1: Clearing API cache...");
                            clearApiCache();

                            // Step 2: Update API data (refresh from external APIs)
                            logger.api("Step 2: Refreshing API data...");
                            await refreshApiData();

                            // Step 3: Force API check to ensure fresh data
                            logger.api("Step 3: Force API check...");
                            await forceApiCheck();

                            // Step 4: Save current state to database (preserve current settings)
                            logger.sync("Step 4: Saving current state to database...");
                            await saveToDatabase();

                            // Step 5: Sync to remote displays
                            logger.sync("Step 5: Syncing to remote displays...");
                            await syncToRemoteDisplays();

                            // Step 6: Force reload the display page silently
                            logger.sync("Step 6: Silently reloading display page...");

                            // Dispatch custom event to reload display page
                            const reloadEvent = new CustomEvent('forceDisplayReload', {
                                detail: {
                                    timestamp: new Date().toISOString(),
                                    reason: 'force_sync'
                                }
                            });
                            window.dispatchEvent(reloadEvent);

                            addToast("✅ Force sync completed - API updated, settings preserved, displays synced, page reloaded", "success");
                        } catch (error) {
                            logger.error("Error during force sync:", error);
                            addToast("❌ Failed to force sync", "error");
                        }
                    }}
                    disabled={!needsSync}
                    className={`w-full font-medium py-2 px-4 rounded-lg transition-all duration-200 mt-2 flex items-center justify-center gap-2 ${needsSync
                        ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {needsSync ? "Sync Now" : "All Synced"}
                </button>

                {/* Intelligent Sync Status */}
                <div className={`text-xs mt-2 px-2 py-1 rounded ${needsSync ? "text-green-700 bg-green-50" : "text-gray-600"}`}>
                    <p className="font-medium">{getSyncStatusMessage()}</p>
                    {needsSync && (
                        <p className="text-xs mt-1">
                            Click to update all displays with latest data
                        </p>
                    )}
                </div>

                {/* Stop Editing Button - Only show when editing */}
                {isEditing && (
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            addToast("✏️ Editing mode disabled - auto-save resumed", "info");
                        }}
                        className="w-full font-medium py-2 px-4 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Stop Editing
                    </button>
                )}



                {/* Auto-save info */}
                <div className="text-xs text-gray-500 text-center mt-2">
                    {isEditing && (
                        <div className="text-red-600 font-semibold">
                            ✏️ EDITING MODE - Auto-save disabled • Use Save & Sync to save and sync • Use Stop Editing to resume auto-save
                        </div>
                    )
                    }
                </div>

                {/* Version info */}
                <div className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Version {VERSION}</span>
                    </div>
                </div>

            </aside>
        </div>
    );
};

export default HomePage;