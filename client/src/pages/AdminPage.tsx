import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlides } from "../contexts/SlideContext";
import { useToast } from "../contexts/ToastContext";
import { employees } from "../data/employees";
import SlideCard from "../components/SlideCard";
import {
    Slide,
    ImageSlide,
    VideoSlide,
    SLIDE_TYPES,
    ImageSlideData,
    VideoSlideData,
    NewsSlide,
    EventSlide,
    NewsSlideData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EventSlideData,
    DocumentSlide,
    DocumentSlideData
} from "../types";

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
    backgroundImage?: string;
}

/** Props for the edit modal component */
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    slide: Slide | null;
    onSave: (slide: Slide) => void;
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
    { id: "document-tab", type: SLIDE_TYPES.DOCUMENT, label: "Document Slides" },
];

/** Function to upload a file to the server */
const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${BACKEND_URL}/api/upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to upload file: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.url) {
            throw new Error("Invalid response: missing file URL");
        }

        return `${BACKEND_URL}${data.url}`;
    } catch (error) {
        console.error("Upload error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to upload file");
    }
};

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, slide, onSave }) => {
    const { addToast } = useToast();
    const [editedSlide, setEditedSlide] = useState<Slide | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (slide) {
            setEditedSlide(slide);
            setPendingFile(null);
            setPendingPreviewUrl(null);
        }
    }, [slide]);

    useEffect(() => {
        if (!isOpen) {
            setErrors({});
            setIsUploading(false);
            setPendingFile(null);
            setPendingPreviewUrl(null);
        }
    }, [isOpen]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editedSlide) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        const isExcel = file.type.includes("spreadsheet");
        const isPowerPoint = file.type.includes("presentation");
        const isWord = file.type.includes("word");

        if (editedSlide.type === SLIDE_TYPES.IMAGE && !isImage) {
            addToast("Please upload an image file", "error");
            return;
        }
        if (editedSlide.type === SLIDE_TYPES.VIDEO && !isVideo) {
            addToast("Please upload a video file", "error");
            return;
        }
        if (editedSlide.type === SLIDE_TYPES.DOCUMENT && !(isImage || isPdf || isExcel || isPowerPoint || isWord)) {
            addToast("Please upload a PDF, image, Excel, PowerPoint, Word", "error");
            return;
        }

        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            addToast("File size should be less than 100MB", "error");
            return;
        }

        setPendingFile(file);
        setPendingPreviewUrl(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, imageUrl: undefined, videoUrl: undefined }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!editedSlide?.name?.trim()) {
            newErrors.name = "Slide name is required";
        }

        if (editedSlide) {
            if (editedSlide.type === SLIDE_TYPES.IMAGE && !((pendingFile || (editedSlide as ImageSlide).data.imageUrl))) {
                newErrors.imageUrl = "Image is required";
            } else if (editedSlide.type === SLIDE_TYPES.VIDEO && !((pendingFile || (editedSlide as VideoSlide).data.videoUrl))) {
                newErrors.videoUrl = "Video is required";
            } else if (editedSlide.type === SLIDE_TYPES.NEWS) {
                const newsSlide = editedSlide as NewsSlide;
                if (!newsSlide.data.title?.trim()) newErrors.title = "Title is required";
                if (!newsSlide.data.details?.trim()) newErrors.content = "Details are required";
                if (!newsSlide.data.backgroundImage) newErrors.backgroundImage = "Background image is required";
            } else if (editedSlide.type === SLIDE_TYPES.EVENT) {
                const eventSlide = editedSlide as EventSlide;
                if (!eventSlide.data.title?.trim()) newErrors.title = "Title is required";
                if (!eventSlide.data.description?.trim()) newErrors.description = "Description is required";
                if (!eventSlide.data.date) newErrors.date = "Date is required";
            } else if (editedSlide.type === SLIDE_TYPES.DOCUMENT) {
                const documentSlide = editedSlide as DocumentSlide;
                if (!pendingFile && !documentSlide.data.fileUrl) newErrors.imageUrl = "A document file is required";
                if (!documentSlide.data.fileType && !pendingFile) newErrors.imageUrl = "File type is required";
            }

            // Only enforce 1-60s for non-video slides
            if (
                editedSlide.type !== SLIDE_TYPES.VIDEO &&
                (editedSlide.duration < 1 || editedSlide.duration > 60)
            ) {
                newErrors.duration = "Duration must be between 1 and 60 seconds";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!editedSlide || !validateForm()) return;
        setIsUploading(true);
        let updatedSlide = { ...editedSlide };
        try {
            if (pendingFile) {
                const fileUrl = await uploadFile(pendingFile);
                if (editedSlide.type === SLIDE_TYPES.IMAGE) {
                    updatedSlide = {
                        ...editedSlide,
                        data: {
                            ...editedSlide.data,
                            imageUrl: fileUrl,
                        } as ImageSlideData,
                    } as ImageSlide;
                } else if (editedSlide.type === SLIDE_TYPES.VIDEO) {
                    // For video, get duration
                    const video = document.createElement("video");
                    video.src = fileUrl;
                    await new Promise((resolve, reject) => {
                        video.onloadedmetadata = () => resolve(null);
                        video.onerror = () => reject(new Error("Failed to load video metadata"));
                    });
                    const duration = Math.ceil(video.duration);
                    updatedSlide = {
                        ...editedSlide,
                        duration,
                        data: {
                            ...editedSlide.data,
                            videoUrl: fileUrl,
                        } as VideoSlideData,
                    } as VideoSlide;
                } else if (editedSlide.type === SLIDE_TYPES.DOCUMENT) {
                    // Determine fileType
                    let fileType: DocumentSlideData["fileType"] = "other";
                    if (pendingFile.type.startsWith("image/")) fileType = "image";
                    else if (pendingFile.type === "application/pdf") fileType = "pdf";
                    else if (pendingFile.type.includes("spreadsheet")) fileType = "excel";
                    else if (pendingFile.type.includes("presentation")) fileType = "powerpoint";
                    else if (pendingFile.type.includes("word")) fileType = "word";
                    updatedSlide = {
                        ...editedSlide,
                        data: {
                            ...editedSlide.data,
                            fileUrl,
                            fileType,
                        } as DocumentSlideData,
                    } as DocumentSlide;
                }
            }
            onSave(updatedSlide);
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
            addToast(errorMessage, "error");
        } finally {
            setIsUploading(false);
            setPendingFile(null);
            setPendingPreviewUrl(null);
        }
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
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Common fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slide Name *
                        </label>
                        <input
                            type="text"
                            value={editedSlide.name}
                            onChange={(e) => setEditedSlide({ ...editedSlide, name: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/* Type-specific fields */}
                    {editedSlide.type === SLIDE_TYPES.NEWS && (
                        <NewsSlideFields
                            slide={editedSlide as NewsSlide}
                            onUpdate={setEditedSlide}
                            errors={errors}
                        />
                    )}

                    {editedSlide.type === SLIDE_TYPES.EVENT && (
                        <EventSlideFields
                            slide={editedSlide as EventSlide}
                            onUpdate={setEditedSlide}
                            errors={errors}
                        />
                    )}

                    {/* DocumentSlide fields */}
                    {editedSlide.type === SLIDE_TYPES.DOCUMENT && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Document (PDF, image, Excel, PowerPoint, Word) *
                            </label>
                            <input
                                type="file"
                                accept=".pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileInput}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.imageUrl ? "border-red-500" : "border-gray-300"}`}
                                disabled={isUploading}
                            />
                            {errors.imageUrl && (
                                <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>
                            )}
                            {/* Preview logic: show pendingPreviewUrl if exists, else show existing url */}
                            {(pendingPreviewUrl || (editedSlide.data as DocumentSlideData).fileUrl) && (
                                <div className="mt-2 flex justify-center">
                                    {(() => {
                                        const url = pendingPreviewUrl || (editedSlide.data as DocumentSlideData).fileUrl;
                                        const type = (editedSlide.data as DocumentSlideData).fileType;
                                        if (type === "image") {
                                            return <img src={url} alt="Preview" className="max-h-48 rounded shadow" />;
                                        }
                                        if (type === "pdf") {
                                            return <iframe src={url} title="PDF Preview" className="w-full h-48 rounded shadow border border-gray-200 bg-white" />;
                                        }
                                        if (["excel", "powerpoint", "word"].includes(type || "")) {
                                            return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title="Office Preview" className="w-full h-48 rounded shadow border border-gray-200 bg-white" />;
                                        }
                                        return <span className="text-gray-500">Preview not available</span>;
                                    })()}
                                </div>
                            )}
                            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Caption</label>
                            <input
                                type="text"
                                value={(editedSlide.data as DocumentSlideData).caption || ""}
                                onChange={e => setEditedSlide({
                                    ...editedSlide,
                                    data: {
                                        ...editedSlide.data,
                                        caption: e.target.value
                                    } as DocumentSlideData
                                })}
                                className="w-full px-3 py-2 border rounded-lg border-gray-300"
                            />
                        </div>
                    )}

                    {/* Image/Video upload field */}
                    {(editedSlide.type === SLIDE_TYPES.IMAGE || editedSlide.type === SLIDE_TYPES.VIDEO || editedSlide.type === SLIDE_TYPES.EVENT) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload {(() => {
                                    if (editedSlide.type === SLIDE_TYPES.IMAGE) return "Image";
                                    if (editedSlide.type === SLIDE_TYPES.VIDEO) return "Video";
                                    if (editedSlide.type === SLIDE_TYPES.EVENT) return "Event";
                                    return "File";
                                })()} *
                            </label>
                            <input
                                type="file"
                                accept={editedSlide.type === SLIDE_TYPES.VIDEO ? "video/*" : "image/*"}
                                onChange={handleFileInput}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.imageUrl || errors.videoUrl ? "border-red-500" : "border-gray-300"}`}
                                disabled={isUploading}
                            />
                            {(errors.imageUrl || errors.videoUrl) && (
                                <p className="mt-1 text-sm text-red-500">{errors.imageUrl || errors.videoUrl}</p>
                            )}
                            {/* Preview logic: show pendingPreviewUrl if exists, else show existing url */}
                            {editedSlide.type === SLIDE_TYPES.IMAGE && (pendingPreviewUrl || (editedSlide.data as ImageSlideData).imageUrl) && (
                                <div className="mt-2 flex justify-center">
                                    <img
                                        src={pendingPreviewUrl || (editedSlide.data as ImageSlideData).imageUrl}
                                        alt="Preview"
                                        className="max-h-48 rounded shadow"
                                    />
                                </div>
                            )}
                            {editedSlide.type === SLIDE_TYPES.VIDEO && (pendingPreviewUrl || (editedSlide.data as VideoSlideData).videoUrl) && (
                                <div className="mt-2 flex justify-center">
                                    <video
                                        src={pendingPreviewUrl || (editedSlide.data as VideoSlideData).videoUrl}
                                        controls
                                        className="max-h-48 rounded shadow"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Duration field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (seconds) *
                        </label>
                        <input
                            type="number"
                            value={editedSlide.duration}
                            disabled={editedSlide.type === SLIDE_TYPES.VIDEO} // Disable input for video slides
                            onChange={(e) => setEditedSlide({ ...editedSlide, duration: Math.max(1, Math.min(60, Number(e.target.value))) })}
                            min="1"
                            max="60"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.duration ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
                        {editedSlide.type === SLIDE_TYPES.VIDEO && (
                            <p className="mt-1 text-sm text-gray-500">
                                Duration is set automatically to the video's length and cannot be changed.
                            </p>
                        )}
                    </div>

                    {/* Active toggle */}
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={editedSlide.active}
                                onChange={(e) => setEditedSlide({ ...editedSlide, active: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                    </div>

                    {/* Action buttons */}
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
                            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
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
        case SLIDE_TYPES.DOCUMENT:
            return "Document";
        default:
            return "Unknown";
    }
};

const AdminPage: React.FC = () => {
    const { slides, addSlide, updateSlide, deleteSlide, isLoading } = useSlides();
    const { addToast } = useToast();
    const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [activeTabType, setActiveTabType] = useState<typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES]>(SLIDE_TYPES.IMAGE);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const filteredSlides = slides.filter((slide): slide is Slide =>
        slide.type === activeTabType
    );

    const activeSlides = filteredSlides.filter(slide => slide.active);
    const inactiveSlides = filteredSlides.filter(slide => !slide.active);

    const handleCreateSlide = useCallback(() => {
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
                            details: "",
                            backgroundImage: "",
                            newsImage: "",
                            overlayOpacity: 0.5,
                            textColor: "#FFFFFF",
                            textSize: "large",
                            textAlignment: "center"
                        },
                        dataSource: "manual" as const,
                    } as NewsSlide;
                case SLIDE_TYPES.DOCUMENT:
                    return {
                        id: crypto.randomUUID(),
                        type: SLIDE_TYPES.DOCUMENT,
                        name: "New Document Slide",
                        active: true,
                        duration: 10,
                        data: {
                            fileUrl: "",
                            fileType: "pdf",
                            caption: ""
                        },
                        dataSource: "manual" as const,
                    } as DocumentSlide;
                default:
                    throw new Error("Unsupported slide type");
            }
        })();

        addSlide(newSlide);
        setSelectedSlide(newSlide);
        setIsModalOpen(true);
    }, [activeTabType, addSlide]);

    const handleSaveSlide = useCallback(async (updatedSlide: Slide) => {
        setIsProcessing(true);
        try {
            console.log("Saving slide with newsImage:", updatedSlide.type === SLIDE_TYPES.NEWS ? (updatedSlide as NewsSlide).data.newsImage : undefined);

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
            console.error("Error saving slide:", error);
            addToast(error instanceof Error ? error.message : "Failed to save slide", "error");
        } finally {
            setIsProcessing(false);
        }
    }, [selectedSlide, updateSlide, addSlide, addToast]);

    const handleToggleActive = useCallback(async (id: string, active: boolean) => {
        const slide = slides.find((s) => s.id === id);
        if (slide) {
            try {
                await updateSlide({ ...slide, active });
                addToast(`Slide ${active ? "activated" : "deactivated"} successfully`, "success");
            } catch (error) {
                addToast(error instanceof Error ? error.message : "Failed to update slide status", "error");
            }
        }
    }, [slides, updateSlide, addToast]);

    // Show loading state while slides are being loaded
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Loading slides...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            disabled={isProcessing}
                            className={`px-6 py-3 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
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



/** Props for slide field components */
interface SlideFieldsProps<T extends Slide> {
    slide: T;
    onUpdate: (slide: T) => void;
    errors: FormErrors;
}

/** News slide fields component */
const NewsSlideFields: React.FC<SlideFieldsProps<NewsSlide>> = ({ slide, onUpdate, errors }) => {
    const handleNewsImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileUrl = await uploadFile(file);
                console.log("Setting newsImage to", fileUrl);
                onUpdate({
                    ...slide,
                    data: { ...slide.data, newsImage: fileUrl }
                });
            } catch (error) {
                console.error("Error uploading news image:", error);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                </label>
                <input
                    type="text"
                    value={slide.data.title}
                    onChange={(e) => onUpdate({
                        ...slide,
                        data: { ...slide.data, title: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.title ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Enter announcement title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Details *
                </label>
                <textarea
                    value={slide.data.details}
                    onChange={(e) => onUpdate({
                        ...slide,
                        data: { ...slide.data, details: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.content ? "border-red-500" : "border-gray-300"}`}
                    rows={4}
                    placeholder="Enter announcement details"
                />
                {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Image *
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            try {
                                const fileUrl = await uploadFile(file);
                                onUpdate({
                                    ...slide,
                                    data: { ...slide.data, backgroundImage: fileUrl }
                                });
                            } catch (error) {
                                console.error("Error uploading background image:", error);
                            }
                        }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.backgroundImage ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.backgroundImage && <p className="mt-1 text-sm text-red-500">{errors.backgroundImage}</p>}
                {slide.data.backgroundImage && (
                    <div className="mt-2">
                        <img
                            src={slide.data.backgroundImage}
                            alt="Background preview"
                            className="w-full h-32 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    News Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewsImageChange}
                    className="w-full px-3 py-2 border rounded-lg border-gray-300"
                />
                {slide.data.newsImage && (
                    <div className="mt-2">
                        <img
                            src={slide.data.newsImage}
                            alt="News preview"
                            className="w-full h-32 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Size
                    </label>
                    <select
                        value={slide.data.textSize || "large"}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: { ...slide.data, textSize: e.target.value as NewsSlideData["textSize"] }
                        })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2X Large</option>
                        <option value="3xl">3X Large</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Alignment
                    </label>
                    <select
                        value={slide.data.textAlignment || "center"}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: { ...slide.data, textAlignment: e.target.value as "left" | "center" | "right" }
                        })}
                        className="w-full px-3 py-2 border rounded-lg border-gray-300"
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overlay Opacity
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={(slide.data.overlayOpacity || 0.5) * 100}
                    onChange={(e) => onUpdate({
                        ...slide,
                        data: { ...slide.data, overlayOpacity: Number(e.target.value) / 100 }
                    })}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Transparent</span>
                    <span>Opaque</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                </label>
                <input
                    type="color"
                    value={slide.data.textColor || "#FFFFFF"}
                    onChange={(e) => onUpdate({
                        ...slide,
                        data: { ...slide.data, textColor: e.target.value }
                    })}
                    className="w-full h-10 px-1 py-1 border rounded-lg border-gray-300"
                />
            </div>
        </div>
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