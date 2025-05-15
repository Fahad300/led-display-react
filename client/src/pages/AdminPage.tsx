import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlides } from "../contexts/SlideContext";
import { useToast } from "../contexts/ToastContext";
import { Slide, ImageSlide, VideoSlide, SLIDE_TYPES, ImageSlideData, VideoSlideData, NewsSlide, EventSlide, TextSlide, CountdownSlide } from "../types";

/** Configuration for the backend API URL */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/** Type for form validation errors */
interface FormErrors {
    name?: string;
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
    duration?: string;
    title?: string;
    content?: string;
    description?: string;
    date?: string;
    time?: string;
    source?: string;
    location?: string;
    registrationLink?: string;
    textAlign?: string;
    fontSize?: string;
}

/** Interface for slide type card properties */
interface SlideTypeCard {
    type: typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES];
    title: string;
    description: string;
    icon: React.ReactNode;
}

/** Props for the edit modal component */
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    slide: Slide | null;
    onSave: (slide: Slide) => void;
}

/** Props for the slide preview component */
interface SlidePreviewProps {
    slide: ImageSlide;
    onEdit: (slide: ImageSlide) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, active: boolean) => void;
}

/** Type for the image upload response */
interface ImageUploadResponse {
    url: string;
    success: boolean;
    error?: string;
}

/** Type for slide tabs */
type SlideTab = {
    id: string;
    type: typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES];
    label: string;
};

/** Available tabs */
const SLIDE_TABS: SlideTab[] = [
    { id: "image-tab", type: SLIDE_TYPES.IMAGE, label: "Image Slides" },
    { id: "video-tab", type: SLIDE_TYPES.VIDEO, label: "Video Slides" },
    { id: "news-tab", type: SLIDE_TYPES.NEWS, label: "News Slides" },
    { id: "event-tab", type: SLIDE_TYPES.EVENT, label: "Event Slides" }
];

/** Function to get the API URL based on environment */
const getApiUrl = (): string => {
    return process.env.NODE_ENV === "development"
        ? `${BACKEND_URL}/api/upload`
        : "/api/upload";
};

/** Function to upload a file to the server */
const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return `${BACKEND_URL}${data.url}`;
};

/** Available slide type cards */
const SLIDE_TYPE_CARDS: SlideTypeCard[] = [
    {
        type: SLIDE_TYPES.IMAGE,
        title: "Image Slider",
        description: "Create a slideshow with images and optional captions",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        type: SLIDE_TYPES.VIDEO,
        title: "Video Slider",
        description: "Create a slideshow with videos and optional captions",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        type: SLIDE_TYPES.NEWS,
        title: "News Slider",
        description: "Create news announcements with title, content, and optional image",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-.59-1.42L15.5 4.5" />
            </svg>
        ),
    },
    {
        type: SLIDE_TYPES.EVENT,
        title: "Event Slider",
        description: "Create event announcements with details and registration links",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    }
];

/** Type guard for ImageSlide */
const isImageSlide = (slide: ImageSlide | VideoSlide): slide is ImageSlide => {
    return slide.type === SLIDE_TYPES.IMAGE;
};

/** Type guard for VideoSlide */
const isVideoSlide = (slide: ImageSlide | VideoSlide): slide is VideoSlide => {
    return slide.type === SLIDE_TYPES.VIDEO;
};

/** Function to update slide caption */
const updateSlideCaption = (slide: ImageSlide | VideoSlide, caption: string): ImageSlide | VideoSlide => {
    if (isImageSlide(slide)) {
        return {
            ...slide,
            data: {
                ...slide.data,
                caption,
            },
        };
    } else {
        return {
            ...slide,
            data: {
                ...slide.data,
                caption,
            },
        };
    }
};

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, slide, onSave }) => {
    const { addToast } = useToast();
    const [editedSlide, setEditedSlide] = useState<Slide | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Initialize or update editedSlide when the slide prop changes
    useEffect(() => {
        if (slide) {
            setEditedSlide(slide);
        }
    }, [slide]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setErrors({});
            setIsUploading(false);
        }
    }, [isOpen]);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editedSlide) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        // Validate file type based on slide type
        if (editedSlide.type === SLIDE_TYPES.IMAGE && !isImage) {
            addToast("Please upload an image file", "error");
            return;
        }
        if (editedSlide.type === SLIDE_TYPES.VIDEO && !isVideo) {
            addToast("Please upload a video file", "error");
            return;
        }

        // Update file size limit to 100MB
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            addToast("File size should be less than 100MB", "error");
            return;
        }

        setIsUploading(true);
        setErrors((prev) => ({ ...prev, imageUrl: undefined, videoUrl: undefined }));

        try {
            // Upload file to server
            const fileUrl = await uploadFile(file);

            if (editedSlide.type === SLIDE_TYPES.IMAGE) {
                setEditedSlide({
                    ...editedSlide,
                    data: {
                        ...editedSlide.data,
                        imageUrl: fileUrl,
                    } as ImageSlideData,
                } as ImageSlide);
            } else {
                setEditedSlide({
                    ...editedSlide,
                    data: {
                        ...editedSlide.data,
                        videoUrl: fileUrl,
                    } as VideoSlideData,
                } as VideoSlide);
            }

            addToast(`${isVideo ? "Video" : "Image"} uploaded successfully`, "success");
        } catch (error) {
            console.error("Upload error:", error);
            addToast("Failed to upload file", "error");
            setErrors((prev) => ({
                ...prev,
                [editedSlide.type === SLIDE_TYPES.IMAGE ? "imageUrl" : "videoUrl"]: "Failed to upload file",
            }));
        } finally {
            setIsUploading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedSlide) return;
        setEditedSlide({
            ...editedSlide,
            name: e.target.value,
        });
    };

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedSlide) return;

        if (editedSlide.type === SLIDE_TYPES.IMAGE) {
            setEditedSlide({
                ...editedSlide,
                data: {
                    ...editedSlide.data,
                    caption: e.target.value,
                } as ImageSlideData,
            } as ImageSlide);
        } else {
            setEditedSlide({
                ...editedSlide,
                data: {
                    ...editedSlide.data,
                    caption: e.target.value,
                } as VideoSlideData,
            } as VideoSlide);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedSlide) return;
        const duration = Math.max(1, Math.min(60, Number(e.target.value)));
        setEditedSlide({
            ...editedSlide,
            duration,
        });
    };

    const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedSlide) return;
        setEditedSlide({
            ...editedSlide,
            active: e.target.checked,
        });
    };

    const handleVideoSettingChange = (setting: "autoplay" | "muted" | "loop", value: boolean) => {
        if (!editedSlide || editedSlide.type !== SLIDE_TYPES.VIDEO) return;
        setEditedSlide({
            ...editedSlide,
            data: {
                ...editedSlide.data,
                [setting]: value,
            },
        } as VideoSlide);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!editedSlide?.name?.trim()) {
            newErrors.name = "Slide name is required";
        }

        if (editedSlide) {
            if (editedSlide.type === SLIDE_TYPES.IMAGE && !(editedSlide as ImageSlide).data.imageUrl) {
                newErrors.imageUrl = "Image is required";
            } else if (editedSlide.type === SLIDE_TYPES.VIDEO && !(editedSlide as VideoSlide).data.videoUrl) {
                newErrors.videoUrl = "Video is required";
            }

            if (editedSlide.duration < 1 || editedSlide.duration > 60) {
                newErrors.duration = "Duration must be between 1 and 60 seconds";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!editedSlide || !validateForm()) return;
        onSave(editedSlide);
        onClose();
    };

    if (!isOpen || !editedSlide) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {`${slide ? "Edit" : "Create"} ${getSlideTypeLabel(editedSlide.type)} Slide`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slide Name *
                        </label>
                        <input
                            type="text"
                            value={editedSlide.name}
                            onChange={handleNameChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload {editedSlide.type === SLIDE_TYPES.IMAGE ? "Image" : editedSlide.type === SLIDE_TYPES.VIDEO ? "Video" : "News" : "Event"} *
                        </label>
                        <input
                            type="file"
                            accept={editedSlide.type === SLIDE_TYPES.IMAGE ? "image/*" : editedSlide.type === SLIDE_TYPES.VIDEO ? "video/*" : "image/*"}
                            onChange={handleFileInput}
                            className={`w-full px-3 py-2 border rounded-lg ${errors.imageUrl || errors.videoUrl ? "border-red-500" : "border-gray-300"
                                }`}
                            disabled={isUploading}
                        />
                        {(errors.imageUrl || errors.videoUrl) && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.imageUrl || errors.videoUrl}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {editedSlide.type === SLIDE_TYPES.IMAGE && (editedSlide as ImageSlide).data.imageUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={(editedSlide as ImageSlide).data.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {editedSlide.type === SLIDE_TYPES.VIDEO && (editedSlide as VideoSlide).data.videoUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <video
                                src={(editedSlide as VideoSlide).data.videoUrl}
                                controls
                                className="w-full h-full"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Caption
                        </label>
                        <input
                            type="text"
                            value={editedSlide.data.caption || ""}
                            onChange={handleCaptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {editedSlide.type === SLIDE_TYPES.VIDEO && (
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={(editedSlide as VideoSlide).data.autoplay}
                                    onChange={(e) => handleVideoSettingChange("autoplay", e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Autoplay</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={(editedSlide as VideoSlide).data.muted}
                                    onChange={(e) => handleVideoSettingChange("muted", e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Muted</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={(editedSlide as VideoSlide).data.loop}
                                    onChange={(e) => handleVideoSettingChange("loop", e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Loop</span>
                            </label>
                        </div>
                    )}

                    {editedSlide.type === SLIDE_TYPES.IMAGE && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (seconds) *
                            </label>
                            <input
                                type="number"
                                value={editedSlide.duration}
                                onChange={handleDurationChange}
                                min="1"
                                max="60"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.duration ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.duration && (
                                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={editedSlide.active}
                                onChange={handleActiveChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className={`
                                px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                                ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}
                            `}
                        >
                            {isUploading ? "Uploading..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </motion.div>
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
        case SLIDE_TYPES.EVENT:
            return "Event";
        case SLIDE_TYPES.TEXT:
            return "Text";
        case SLIDE_TYPES.COUNTDOWN:
            return "Countdown";
        default:
            return "Unknown";
    }
};

const AdminPage: React.FC = () => {
    const { slides, addSlide, updateSlide, deleteSlide } = useSlides();
    const { addToast } = useToast();
    const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [activeTabType, setActiveTabType] = useState<typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES]>(SLIDE_TYPES.IMAGE);

    const filteredSlides = slides.filter((slide): slide is Slide =>
        slide.type === activeTabType
    );

    const activeSlides = filteredSlides.filter(slide => slide.active);
    const inactiveSlides = filteredSlides.filter(slide => !slide.active);

    const handleCreateSlide = () => {
        const newSlide = (() => {
            switch (activeTabType) {
                case SLIDE_TYPES.IMAGE:
                    return {
                        id: crypto.randomUUID(),
                        type: SLIDE_TYPES.IMAGE,
                        name: "New Image Slide",
                        active: true,
                        duration: 5,
                        data: {
                            imageUrl: "",
                            caption: ""
                        },
                        dataSource: "manual" as const,
                    } as ImageSlide;
                case SLIDE_TYPES.VIDEO:
                    return {
                        id: crypto.randomUUID(),
                        type: SLIDE_TYPES.VIDEO,
                        name: "New Video Slide",
                        active: true,
                        duration: 0,
                        data: {
                            videoUrl: "",
                            caption: "",
                            autoplay: true,
                            muted: true,
                            loop: true
                        },
                        dataSource: "manual" as const,
                    } as VideoSlide;
                case SLIDE_TYPES.NEWS:
                    return {
                        id: crypto.randomUUID(),
                        type: SLIDE_TYPES.NEWS,
                        name: "New News Slide",
                        active: true,
                        duration: 10,
                        data: {
                            title: "",
                            content: "",
                            date: new Date().toISOString().split("T")[0],
                            source: "",
                            imageUrl: "",
                            textAlign: "left",
                            fontSize: "text-base"
                        },
                        dataSource: "manual" as const,
                    } as NewsSlide;
                case SLIDE_TYPES.EVENT:
                    return {
                        id: crypto.randomUUID(),
                        type: SLIDE_TYPES.EVENT,
                        name: "New Event Slide",
                        active: true,
                        duration: 10,
                        data: {
                            title: "",
                            description: "",
                            date: new Date().toISOString().split("T")[0],
                            time: "",
                            location: "",
                            imageUrl: "",
                            registrationLink: "",
                            textAlign: "left",
                            fontSize: "text-base"
                        },
                        dataSource: "manual" as const,
                    } as EventSlide;
                default:
                    throw new Error("Unsupported slide type");
            }
        })();

        addSlide(newSlide);
        setSelectedSlide(newSlide);
        setIsModalOpen(true);
    };

    const handleEditSlide = (slide: Slide) => {
        setSelectedSlide(slide);
        setIsModalOpen(true);
    };

    const handleSaveSlide = async (updatedSlide: Slide) => {
        try {
            if (selectedSlide?.id) {
                await updateSlide(updatedSlide);
                addToast("Slide updated successfully", "success");
            } else {
                await addSlide(updatedSlide);
                addToast("Slide created successfully", "success");
            }
            setIsModalOpen(false);
            setSelectedSlide(null);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to save slide", "error");
        }
    };

    const handleDeleteSlide = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteSlide(id);
            addToast("Slide deleted successfully", "success");
            setDeleteConfirmId(null);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to delete slide", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        const slide = slides.find((s) => s.id === id);
        if (slide) {
            try {
                await updateSlide({ ...slide, active });
                addToast(`Slide ${active ? "activated" : "deactivated"} successfully`, "success");
            } catch (error) {
                addToast(error instanceof Error ? error.message : "Failed to update slide status", "error");
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Slide Management</h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {SLIDE_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabType(tab.type)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTabType === tab.type
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }
                            `}
                            aria-current={activeTabType === tab.type ? "page" : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Active Slides Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Slides</h2>
                <div className="space-y-6">
                    {activeSlides.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                            {`No active ${getSlideTypeLabel(activeTabType)} slides. Create a new slide to get started.`}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeSlides.map((slide) => (
                                <SlideCard
                                    key={slide.id}
                                    slide={slide}
                                    onEdit={(slide) => {
                                        setSelectedSlide(slide);
                                        setIsModalOpen(true);
                                    }}
                                    onDelete={(id) => setDeleteConfirmId(id)}
                                    onToggleActive={handleToggleActive}
                                />
                            ))}
                        </div>
                    )}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleCreateSlide}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{`Add New ${getSlideTypeLabel(activeTabType)} Slide`}</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Inactive Slides Section */}
            {inactiveSlides.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Inactive Slides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inactiveSlides.map((slide) => (
                            <SlideCard
                                key={slide.id}
                                slide={slide}
                                onEdit={(slide) => {
                                    setSelectedSlide(slide);
                                    setIsModalOpen(true);
                                }}
                                onDelete={(id) => setDeleteConfirmId(id)}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Edit Modal */}
            <EditModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSlide(null);
                }}
                slide={selectedSlide}
                onSave={handleSaveSlide}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Confirm Delete
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this slide? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!deleteConfirmId) return;
                                        setIsDeleting(true);
                                        try {
                                            await deleteSlide(deleteConfirmId);
                                            addToast("Slide deleted successfully", "success");
                                            setDeleteConfirmId(null);
                                        } catch (error) {
                                            addToast(error instanceof Error ? error.message : "Failed to delete slide", "error");
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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

    const getMediaUrl = () => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return (slide as ImageSlide).data.imageUrl;
            case SLIDE_TYPES.VIDEO:
                return (slide as VideoSlide).data.videoUrl;
            case SLIDE_TYPES.NEWS:
                return (slide as NewsSlide).data.imageUrl;
            case SLIDE_TYPES.EVENT:
                return (slide as EventSlide).data.imageUrl;
            default:
                return "";
        }
    };

    const getTitle = () => {
        switch (slide.type) {
            case SLIDE_TYPES.IMAGE:
                return (slide as ImageSlide).data.caption;
            case SLIDE_TYPES.VIDEO:
                return (slide as VideoSlide).data.caption;
            case SLIDE_TYPES.NEWS:
                return (slide as NewsSlide).data.title;
            case SLIDE_TYPES.EVENT:
                return (slide as EventSlide).data.title;
            default:
                return "";
        }
    };

    const getDescription = () => {
        switch (slide.type) {
            case SLIDE_TYPES.NEWS:
                const newsSlide = slide as NewsSlide;
                return `${newsSlide.data.content.substring(0, 100)}${newsSlide.data.content.length > 100 ? "..." : ""}`;
            case SLIDE_TYPES.EVENT:
                const eventSlide = slide as EventSlide;
                return `${eventSlide.data.description.substring(0, 100)}${eventSlide.data.description.length > 100 ? "..." : ""}`;
            default:
                return "";
        }
    };

    const mediaUrl = getMediaUrl();
    const title = getTitle();
    const description = getDescription();

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{slide.name}</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onToggleActive(slide.id, !slide.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slide.active ? "bg-persivia-teal" : "bg-slate-200"}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.active ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                </div>
            </div>

            {/* Media Preview */}
            {(slide.type === SLIDE_TYPES.IMAGE || slide.type === SLIDE_TYPES.VIDEO || slide.type === SLIDE_TYPES.NEWS || slide.type === SLIDE_TYPES.EVENT) && (
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
            {(slide.type === SLIDE_TYPES.NEWS || slide.type === SLIDE_TYPES.EVENT) && (
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
                        className="p-2 text-gray-600 hover:text-persivia-blue transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(slide.id)}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
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

/** Props for slide field components */
interface SlideFieldsProps<T extends Slide> {
    slide: T;
    onUpdate: (slide: T) => void;
    errors: FormErrors;
}

/** News slide fields component */
const NewsSlideFields: React.FC<SlideFieldsProps<NewsSlide>> = ({ slide, onUpdate, errors }) => {
    return (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                </label>
                <input
                    type="text"
                    value={slide.data.title}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, title: e.target.value } })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.title ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Enter news title"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                </label>
                <textarea
                    value={slide.data.content}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, content: e.target.value } })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.content ? "border-red-500" : "border-gray-300"}`}
                    rows={4}
                    placeholder="Enter news content"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                </label>
                <input
                    type="date"
                    value={slide.data.date}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, date: e.target.value } })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.date ? "border-red-500" : "border-gray-300"}`}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                </label>
                <input
                    type="text"
                    value={slide.data.source || ""}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, source: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    placeholder="Enter news source"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            // Handle file upload
                        }
                    }}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Alignment
                    </label>
                    <select
                        value={slide.data.textAlign || "left"}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, textAlign: e.target.value as "left" | "center" | "right" } })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                    </label>
                    <select
                        value={slide.data.fontSize || "text-base"}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, fontSize: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                        <option value="text-xl">Extra Large</option>
                    </select>
                </div>
            </div>
        </>
    );
};

/** Event slide fields component */
const EventSlideFields: React.FC<SlideFieldsProps<EventSlide>> = ({ slide, onUpdate, errors }) => {
    return (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                </label>
                <input
                    type="text"
                    value={slide.data.title}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, title: e.target.value } })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.title ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Enter event title"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                </label>
                <textarea
                    value={slide.data.description}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, description: e.target.value } })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.description ? "border-red-500" : "border-gray-300"}`}
                    rows={4}
                    placeholder="Enter event description"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                    </label>
                    <input
                        type="date"
                        value={slide.data.date}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, date: e.target.value } })}
                        className={`w-full px-3 py-2 border rounded-lg ${errors.date ? "border-red-500" : "border-gray-300"}`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                    </label>
                    <input
                        type="time"
                        value={slide.data.time || ""}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, time: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                </label>
                <input
                    type="text"
                    value={slide.data.location || ""}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, location: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    placeholder="Enter event location"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Link
                </label>
                <input
                    type="url"
                    value={slide.data.registrationLink || ""}
                    onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, registrationLink: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    placeholder="Enter registration link"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            // Handle file upload
                        }
                    }}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Alignment
                    </label>
                    <select
                        value={slide.data.textAlign || "left"}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, textAlign: e.target.value as "left" | "center" | "right" } })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                    </label>
                    <select
                        value={slide.data.fontSize || "text-base"}
                        onChange={(e) => onUpdate({ ...slide, data: { ...slide.data, fontSize: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                        <option value="text-xl">Extra Large</option>
                    </select>
                </div>
            </div>
        </>
    );
};

export default AdminPage; 