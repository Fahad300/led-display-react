import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUnified } from '../contexts/UnifiedContext';
import { useSettings } from '../contexts/SettingsContext';
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
                                console.log(`🏠 Rendering slide ${index}:`, {
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
    const {
        slides,
        reorderSlides,
        updateSlide,
        employees,
        saveToDatabase,
        syncFromDatabase,
        refreshApiData,
        syncToRemoteDisplays,
        isEditing,
        setIsEditing,
        isDisplayPage,
        forceMigrateVideoUrls
    } = useUnified();

    // Debug logging for slides
    useEffect(() => {
        console.log("🏠 HomePage - Current slides:", {
            totalSlides: slides.length,
            eventSlides: slides.filter(s => s.type === SLIDE_TYPES.EVENT).length,
            allSlides: slides.map(s => ({ id: s.id, name: s.name, type: s.type, active: s.active }))
        });
    }, [slides]);

    // Debug logging for employees
    useEffect(() => {
        console.log("👥 HomePage - Current employees:", {
            totalEmployees: employees.length,
            anniversaryCount: employees.filter(e => e.isAnniversary).length,
            birthdayCount: employees.filter(e => e.isBirthday).length
        });
    }, [employees]);
    const { displaySettings, updateDisplaySettings } = useSettings();
    const { addToast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const slidesContainerRef = useRef<HTMLDivElement>(null);

    // Get active slides directly from context - no local state needed
    const activeSlides = slides.filter(slide => slide.active);

    // Debug log for page detection
    useEffect(() => {
        console.log("🏠 HomePage: isDisplayPage =", isDisplayPage);
    }, [isDisplayPage]);

    // Simple test function
    const testDataFlow = async () => {
        console.log("🧪 Testing data flow...");
        console.log("Current slides:", slides.length);
        console.log("Active slides:", activeSlides.length);
        console.log("Display settings:", displaySettings);

        // Test saving data
        try {
            console.log("🧪 Testing save to database...");
            await saveToDatabase();
            console.log("✅ Save test successful!");
        } catch (error) {
            console.error("❌ Save test failed:", error);
        }
    };

    // Make test function available globally for browser console testing
    (window as any).testDataFlow = testDataFlow;

    // Auto-save is now handled by UnifiedContext only
    // No duplicate auto-save logic needed here

    // Event processing is now handled in UnifiedContext - single source of truth


    // Handle slide reordering
    const handleReorder = ({ sourceIndex, destinationIndex }: ReorderResult) => {
        if (sourceIndex === destinationIndex) return;

        // Use original slides for reordering to maintain data integrity
        const newSlides = [...slides];
        const [removed] = newSlides.splice(sourceIndex, 1);
        newSlides.splice(destinationIndex, 0, removed);

        reorderSlides(newSlides);
    };

    // Handle slide activation toggle
    const handleToggleActive = async (slideId: string) => {
        console.log('🔄 HomePage - Slide activation toggle started:', {
            slideId: slideId,
            timestamp: new Date().toISOString()
        });

        const slideToUpdate = slides.find(s => s.id === slideId);

        if (slideToUpdate) {
            const newActiveState = !slideToUpdate.active;

            console.log('🔄 HomePage - Slide activation toggle details:', {
                slideId: slideToUpdate.id,
                slideName: slideToUpdate.name,
                slideType: slideToUpdate.type,
                currentActiveState: slideToUpdate.active,
                newActiveState: newActiveState,
                slideDuration: slideToUpdate.duration,
                timestamp: new Date().toISOString()
            });

            // For event slides, log the toggle action
            if (slideToUpdate.type === SLIDE_TYPES.EVENT) {
                const eventSlide = slideToUpdate as EventSlideType;
                const hasEvents = eventSlide.data.hasEvents;

                console.log('🎉 HomePage - Event slide toggle:', {
                    eventSlideId: eventSlide.id,
                    eventSlideName: eventSlide.name,
                    eventType: eventSlide.data.eventType,
                    hasEvents: hasEvents,
                    newActiveState: newActiveState
                });
            }

            const updatedSlide = { ...slideToUpdate, active: newActiveState };

            console.log('💾 HomePage - Calling updateSlide with:', {
                slideId: updatedSlide.id,
                slideName: updatedSlide.name,
                slideType: updatedSlide.type,
                active: updatedSlide.active,
                duration: updatedSlide.duration,
                timestamp: new Date().toISOString()
            });

            updateSlide(updatedSlide);

            // Update local state to reflect the change immediately
            // Context handles the update automatically

            // Event slide states are now managed through the unified context
        }
    };


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
    const renderSlideContent = (slide: Slide, onVideoEnd?: () => void) => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return <ImageSlide slide={slide as ImageSlideType} />;
            case SLIDE_TYPES.VIDEO:
                return (
                    <VideoSlide slide={slide as VideoSlideType} onVideoEnd={onVideoEnd} />
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
            case SLIDE_TYPES.DOCUMENT:
                return <DocumentSlide slide={slide as DocumentSlideType} />;
            case SLIDE_TYPES.TEXT:
                return <TextSlide slide={slide as TextSlideType} />;
            default:
                return null;
        }
    };

    // Update displaySettings handlers
    const handleEffectChange = async (effect: string) => {
        console.log('⚙️ HomePage - Effect change started:', {
            newEffect: effect,
            currentEffect: displaySettings.swiperEffect,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ swiperEffect: effect });
            console.log('✅ HomePage - Effect change successful:', {
                newEffect: effect,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Slide effect updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating slide effect:", error);
            addToast("❌ Failed to update slide effect", "error");
        }
    };

    const handleDateStampToggle = async () => {
        const newValue = !displaySettings.showDateStamp;
        console.log('⚙️ HomePage - Date stamp toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.showDateStamp,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ showDateStamp: newValue });
            console.log('✅ HomePage - Date stamp toggle successful:', {
                newValue: newValue,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Date stamp setting updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating date stamp setting:", error);
            addToast("❌ Failed to update date stamp setting", "error");
        }
    };

    const handlePaginationToggle = async () => {
        const newValue = !displaySettings.hidePagination;
        console.log('⚙️ HomePage - Pagination toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hidePagination,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ hidePagination: newValue });
            console.log('✅ HomePage - Pagination toggle successful:', {
                newValue: newValue,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Pagination setting updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating pagination setting:", error);
            addToast("❌ Failed to update pagination setting", "error");
        }
    };

    const handleArrowsToggle = async () => {
        const newValue = !displaySettings.hideArrows;
        console.log('⚙️ HomePage - Arrows toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hideArrows,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ hideArrows: newValue });
            console.log('✅ HomePage - Arrows toggle successful:', {
                newValue: newValue,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Arrow navigation setting updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating arrow navigation setting:", error);
            addToast("❌ Failed to update arrow navigation setting", "error");
        }
    };

    const handleHidePersiviaLogoToggle = async () => {
        const newValue = !displaySettings.hidePersiviaLogo;
        console.log('⚙️ HomePage - Logo visibility toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.hidePersiviaLogo,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ hidePersiviaLogo: newValue });
            console.log('✅ HomePage - Logo visibility toggle successful:', {
                newValue: newValue,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Logo visibility setting updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating logo visibility setting:", error);
            addToast("❌ Failed to update logo visibility setting", "error");
        }
    };

    const handleDevelopmentModeToggle = async () => {
        const newValue = !displaySettings.developmentMode;
        console.log('⚙️ HomePage - Development mode toggle started:', {
            newValue: newValue,
            currentValue: displaySettings.developmentMode,
            timestamp: new Date().toISOString()
        });

        try {
            await updateDisplaySettings({ developmentMode: newValue });
            console.log('✅ HomePage - Development mode toggle successful:', {
                newValue: newValue,
                timestamp: new Date().toISOString()
            });
            addToast("✅ Development mode setting updated successfully", "success");
        } catch (error) {
            console.error("❌ HomePage - Error updating development mode setting:", error);
            addToast("❌ Failed to update development mode setting", "error");
        }
    };

    // Show controls even when there are no active slides

    // --- UI ---
    return (
        <div className="flex h-full bg-persivia-light-gray" data-editing={isEditing ? "true" : "false"}>
            {/* Slide Management - First Column */}
            <SlideManagementColumn
                slides={slides}
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
                                    key={`swiper-${displaySettings.swiperEffect}`}
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
                                {slides.length}
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


                {/* Force Sync Button */}
                <button
                    type="button"
                    onClick={async () => {
                        console.log("🔄 Force Sync button clicked!");
                        try {
                            console.log("🔄 HomePage: Force syncing - updating API data, unified objects, saving to database, syncing displays, and reloading...");

                            // Step 1: Update API data (refresh from external APIs)
                            console.log("📡 Step 1: Refreshing API data...");
                            await refreshApiData();

                            // Step 2: Update unified objects (sync from database)
                            console.log("🔄 Step 2: Syncing unified objects from database...");
                            await syncFromDatabase();

                            // Step 3: Save current state to database
                            console.log("💾 Step 3: Saving to database...");
                            await saveToDatabase();

                            // Step 4: Sync to remote displays
                            console.log("📡 Step 4: Syncing to remote displays...");
                            await syncToRemoteDisplays();

                            // Step 5: Force reload the display page silently
                            console.log("🔄 Step 5: Silently reloading display page...");

                            // Dispatch custom event to reload display page
                            const reloadEvent = new CustomEvent('forceDisplayReload', {
                                detail: {
                                    timestamp: new Date().toISOString(),
                                    reason: 'force_sync'
                                }
                            });
                            window.dispatchEvent(reloadEvent);

                            addToast("✅ Force sync completed - API updated, database saved, displays synced, page reloaded", "success");
                        } catch (error) {
                            console.error("❌ Error during force sync:", error);
                            addToast("❌ Failed to force sync", "error");
                        }
                    }}
                    className="w-full font-medium py-2 px-4 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Force Sync
                </button>

                {/* Force Sync Description */}
                <div className="text-xs text-gray-600 mt-2">
                    <p>Updates all the displays with the latest data from the API</p>
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