import React, { useState, useCallback } from "react";
import { Slide, SLIDE_TYPES, ImageSlide, VideoSlide, NewsSlide, EventSlide } from "../types";
import { employees } from "../data/employees";

/** Props for the slide card component */
interface SlideCardProps {
    slide: Slide;
    onEdit: (slide: Slide) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, active: boolean) => void;
}

/** Component for displaying a single slide card */
const SlideCard: React.FC<SlideCardProps> = ({ slide, onEdit, onDelete, onToggleActive }) => {
    const [mediaError, setMediaError] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const getMediaUrl = useCallback(() => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return (slide as ImageSlide).data.imageUrl;
            case SLIDE_TYPES.VIDEO:
                return (slide as VideoSlide).data.videoUrl;
            case SLIDE_TYPES.NEWS: {
                const news = slide as NewsSlide;
                return news.data.newsImage || news.data.backgroundImage;
            }
            default:
                return "";
        }
    }, [slide]);

    const getTitle = useCallback(() => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return (slide as ImageSlide).data.caption;
            case SLIDE_TYPES.VIDEO:
                return (slide as VideoSlide).data.caption;
            case SLIDE_TYPES.NEWS:
                return (slide as NewsSlide).data.title;
            default:
                return "";
        }
    }, [slide]);

    const getDescription = useCallback(() => {
        switch (slide.type) {
            case SLIDE_TYPES.NEWS:
                const newsSlide = slide as NewsSlide;
                return `${newsSlide.data.details.substring(0, 100)}${newsSlide.data.details.length > 100 ? "..." : ""}`;
            default:
                return "";
        }
    }, [slide]);

    const handleToggleActive = useCallback(async (id: string, active: boolean) => {
        setIsProcessing(true);
        try {
            await onToggleActive(id, active);
        } finally {
            setIsProcessing(false);
        }
    }, [onToggleActive]);

    const mediaUrl = getMediaUrl();
    const title = getTitle();
    const description = getDescription();

    // Special handling for event slides
    if (slide.type === SLIDE_TYPES.EVENT) {
        const eventSlide = slide as EventSlide;
        const employee = employees.find((emp: typeof employees[0]) => emp.id === eventSlide.data.employeeId);

        if (employee) {
            return (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-500">Birthday Slide</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleToggleActive(slide.id, !slide.active)}
                                disabled={isProcessing}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" : "bg-slate-200"} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Automatic</span>
                            {slide.duration > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{slide.duration}s</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onDelete(slide.id)}
                                disabled={isProcessing}
                                className="p-2 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{slide.name}</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleToggleActive(slide.id, !slide.active)}
                        disabled={isProcessing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" : "bg-slate-200"} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                </div>
            </div>

            {/* Media Preview */}
            {(slide.type === SLIDE_TYPES.IMAGE || slide.type === SLIDE_TYPES.VIDEO || slide.type === SLIDE_TYPES.NEWS) && (
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    {!mediaError ? (
                        slide.type === SLIDE_TYPES.VIDEO ? (
                            <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                onError={() => setMediaError(true)}
                                muted
                                playsInline
                            />
                        ) : (
                            mediaUrl && (
                                <img
                                    src={mediaUrl}
                                    alt={title || slide.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setMediaError(true)}
                                />
                            )
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-4">
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-gray-500">Failed to load media</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content Preview */}
            {slide.type === SLIDE_TYPES.NEWS && (
                <div className="mt-4">
                    {title && <h4 className="font-medium text-gray-900 mb-1">{title}</h4>}
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{getSlideTypeLabel(slide.type)}</span>
                    {slide.duration > 0 && (
                        <>
                            <span>•</span>
                            <span>{slide.duration}s</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(slide)}
                        disabled={isProcessing}
                        className="p-2 text-gray-600 hover:text-persivia-blue transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(slide.id)}
                        disabled={isProcessing}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Get the label for a slide type */
const getSlideTypeLabel = (type: typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES]) => {
    switch (type) {
        case SLIDE_TYPES.IMAGE:
            return "Image";
        case SLIDE_TYPES.VIDEO:
            return "Video";
        case SLIDE_TYPES.NEWS:
            return "News";
        case SLIDE_TYPES.DOCUMENT:
            return "Document";
        default:
            return "Unknown";
    }
};

export default SlideCard; 