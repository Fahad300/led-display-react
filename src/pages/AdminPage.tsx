import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlides } from "../contexts/SlideContext";
import { Slide, ImageSlide, VideoSlide, SLIDE_TYPES } from "../types";

interface SlideTypeCard {
    type: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    slide: Slide | null;
    onSave: (slide: Slide) => void;
}

const SLIDE_TYPE_CARDS: SlideTypeCard[] = [
    {
        type: SLIDE_TYPES.IMAGE,
        title: "Image Slider",
        description: "Create a slideshow with images and optional captions",
        icon: (
            <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
        ),
    },
    // Add more slide types here as needed
];

const SLIDE_TABS = [
    {
        id: "image",
        label: "Image Slides",
        type: SLIDE_TYPES.IMAGE,
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
        ),
    },
    {
        id: "video",
        label: "Video Slides",
        type: SLIDE_TYPES.VIDEO,
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
            </svg>
        ),
    },
];

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, slide, onSave }) => {
    const [editedSlide, setEditedSlide] = useState<Slide | null>(slide);
    const [filePreview, setFilePreview] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const slideType = editedSlide?.type;

        if ((slideType === SLIDE_TYPES.IMAGE && !isImage) ||
            (slideType === SLIDE_TYPES.VIDEO && !isVideo)) {
            alert(`Please select a ${slideType === SLIDE_TYPES.IMAGE ? "image" : "video"} file.`);
            return;
        }

        setIsUploading(true);
        try {
            // Here you would typically upload the file to your server/storage
            // For now, we'll use a local URL
            const previewUrl = URL.createObjectURL(file);
            setFilePreview(previewUrl);

            setEditedSlide((prev) => {
                if (!prev) return null;

                if (prev.type === SLIDE_TYPES.IMAGE) {
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            imageUrl: previewUrl,
                        },
                    } as ImageSlide;
                } else if (prev.type === SLIDE_TYPES.VIDEO) {
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            videoUrl: previewUrl,
                        },
                    } as VideoSlide;
                }
                return prev;
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        if (editedSlide) {
            onSave(editedSlide);
            onClose();
        }
    };

    if (!isOpen || !editedSlide) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-persivia-blue">
                        Edit {editedSlide.type === SLIDE_TYPES.IMAGE ? "Image" : "Video"} Slide
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-persivia-light-gray/50 rounded-lg transition-colors"
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

                {/* Edit Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Slide Name
                        </label>
                        <input
                            type="text"
                            value={editedSlide.name}
                            onChange={(e) =>
                                setEditedSlide((prev) =>
                                    prev ? { ...prev, name: e.target.value } : null
                                )
                            }
                            className="w-full px-3 py-2 border border-persivia-light-gray rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Upload {editedSlide.type === SLIDE_TYPES.IMAGE ? "Image" : "Video"}
                        </label>
                        <input
                            type="file"
                            accept={editedSlide.type === SLIDE_TYPES.IMAGE ? "image/*" : "video/*"}
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 border border-persivia-light-gray rounded-lg"
                        />
                    </div>

                    {/* Preview */}
                    {(editedSlide.type === SLIDE_TYPES.IMAGE && (editedSlide as ImageSlide).data.imageUrl) && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-persivia-light-gray/50">
                            <img
                                src={(editedSlide as ImageSlide).data.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {(editedSlide.type === SLIDE_TYPES.VIDEO && (editedSlide as VideoSlide).data.videoUrl) && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-persivia-light-gray/50">
                            <video
                                src={(editedSlide as VideoSlide).data.videoUrl}
                                controls
                                className="w-full h-full"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Caption
                        </label>
                        <input
                            type="text"
                            value={
                                editedSlide.type === SLIDE_TYPES.IMAGE
                                    ? (editedSlide as ImageSlide).data.caption
                                    : (editedSlide as VideoSlide).data.caption
                            }
                            onChange={(e) =>
                                setEditedSlide((prev) => {
                                    if (!prev) return null;
                                    return {
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            caption: e.target.value,
                                        },
                                    };
                                })
                            }
                            className="w-full px-3 py-2 border border-persivia-light-gray rounded-lg"
                        />
                    </div>

                    {editedSlide.type === SLIDE_TYPES.VIDEO && (
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="autoplay"
                                    checked={(editedSlide as VideoSlide).data.autoplay}
                                    onChange={(e) =>
                                        setEditedSlide((prev) => {
                                            if (!prev || prev.type !== SLIDE_TYPES.VIDEO) return prev;
                                            return {
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    autoplay: e.target.checked,
                                                },
                                            } as VideoSlide;
                                        })
                                    }
                                    className="mr-2"
                                />
                                <label htmlFor="autoplay" className="text-sm">
                                    Autoplay
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="muted"
                                    checked={(editedSlide as VideoSlide).data.muted}
                                    onChange={(e) =>
                                        setEditedSlide((prev) => {
                                            if (!prev || prev.type !== SLIDE_TYPES.VIDEO) return prev;
                                            return {
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    muted: e.target.checked,
                                                },
                                            } as VideoSlide;
                                        })
                                    }
                                    className="mr-2"
                                />
                                <label htmlFor="muted" className="text-sm">
                                    Muted
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="loop"
                                    checked={(editedSlide as VideoSlide).data.loop}
                                    onChange={(e) =>
                                        setEditedSlide((prev) => {
                                            if (!prev || prev.type !== SLIDE_TYPES.VIDEO) return prev;
                                            return {
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    loop: e.target.checked,
                                                },
                                            } as VideoSlide;
                                        })
                                    }
                                    className="mr-2"
                                />
                                <label htmlFor="loop" className="text-sm">
                                    Loop
                                </label>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Duration (seconds)
                        </label>
                        <input
                            type="number"
                            value={editedSlide.duration}
                            onChange={(e) =>
                                setEditedSlide((prev) =>
                                    prev
                                        ? {
                                            ...prev,
                                            duration: Number(e.target.value),
                                        }
                                        : null
                                )
                            }
                            min="1"
                            className="w-full px-3 py-2 border border-persivia-light-gray rounded-lg"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="active"
                            checked={editedSlide.active}
                            onChange={(e) =>
                                setEditedSlide((prev) =>
                                    prev
                                        ? {
                                            ...prev,
                                            active: e.target.checked,
                                        }
                                        : null
                                )
                            }
                            className="mr-2"
                        />
                        <label htmlFor="active" className="text-sm">
                            Active
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-persivia-blue hover:bg-persivia-light-gray/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className={`
                            px-4 py-2 bg-persivia-blue text-white rounded-lg transition-colors
                            ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-persivia-blue/90"}
                        `}
                    >
                        {isUploading ? "Uploading..." : "Save Changes"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

interface SlideCardProps {
    slide: Slide;
    onEdit: (slide: Slide) => void;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, onEdit }) => {
    const isImage = slide.type === SLIDE_TYPES.IMAGE;
    const isVideo = slide.type === SLIDE_TYPES.VIDEO;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer
                ${!slide.active ? "opacity-60" : ""}
            `}
            onClick={() => onEdit(slide)}
        >
            {/* Preview */}
            <div className="relative aspect-video rounded-t-xl overflow-hidden bg-persivia-light-gray/50">
                {isImage && (
                    <img
                        src={(slide as ImageSlide).data.imageUrl}
                        alt={slide.name}
                        className="w-full h-full object-cover"
                    />
                )}
                {isVideo && (
                    <video
                        src={(slide as VideoSlide).data.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => e.currentTarget.pause()}
                    />
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-persivia-blue truncate">
                            {slide.name}
                        </h3>
                        <p className="text-sm text-persivia-gray mt-1">
                            {isImage && (slide as ImageSlide).data.caption}
                            {isVideo && (slide as VideoSlide).data.caption}
                        </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-persivia-light-gray/50 text-persivia-gray">
                        {slide.duration}s
                    </span>
                </div>

                {isVideo && (
                    <div className="flex gap-2 mt-3">
                        {(slide as VideoSlide).data.autoplay && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-persivia-light-gray/50 text-persivia-gray">
                                Autoplay
                            </span>
                        )}
                        {(slide as VideoSlide).data.muted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-persivia-light-gray/50 text-persivia-gray">
                                Muted
                            </span>
                        )}
                        {(slide as VideoSlide).data.loop && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-persivia-light-gray/50 text-persivia-gray">
                                Loop
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const AdminPage: React.FC = () => {
    const { slides, addSlide, updateSlide } = useSlides();
    const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(SLIDE_TABS[0].id);

    const filteredSlides = slides.filter((slide) => {
        const currentTabType = SLIDE_TABS.find((tab) => tab.id === activeTab)?.type;
        return slide.type === currentTabType;
    });

    const activeSlides = filteredSlides.filter((slide) => slide.active);
    const inactiveSlides = filteredSlides.filter((slide) => !slide.active);

    const handleCreateSlide = (type: string) => {
        const newSlide: Slide = {
            id: `slide-${Date.now()}`,
            type,
            name: `New ${type} Slide`,
            duration: 5,
            active: true,
            dataSource: "manual",
            data:
                type === SLIDE_TYPES.IMAGE
                    ? {
                        imageUrl: "",
                        caption: "",
                    }
                    : {},
        };

        addSlide(newSlide);
        setSelectedSlide(newSlide);
        setIsEditModalOpen(true);
    };

    const handleEditSlide = (slide: Slide) => {
        setSelectedSlide(slide);
        setIsEditModalOpen(true);
    };

    const handleSaveSlide = (updatedSlide: Slide) => {
        updateSlide(updatedSlide);
    };

    return (
        <div className="min-h-screen bg-persivia-light-gray/50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-persivia-blue mb-2">
                        Slide Management
                    </h1>
                    <p className="text-persivia-gray">
                        Create and manage your display slides
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-persivia-light-gray">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {SLIDE_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm
                                        ${activeTab === tab.id
                                            ? "border-persivia-blue text-persivia-blue"
                                            : "border-transparent text-persivia-gray hover:text-persivia-blue hover:border-persivia-light-gray"
                                        }
                                    `}
                                    aria-current={activeTab === tab.id ? "page" : undefined}
                                >
                                    {tab.icon}
                                    <span className="ml-2">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Create New Slide Button */}
                <div className="mb-8">
                    <button
                        onClick={() => handleCreateSlide(SLIDE_TABS.find((tab) => tab.id === activeTab)?.type || SLIDE_TYPES.IMAGE)}
                        className="inline-flex items-center px-4 py-2 bg-persivia-blue text-white rounded-lg hover:bg-persivia-blue/90 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create New {activeTab === "video" ? "Video" : "Image"} Slide
                    </button>
                </div>

                {/* Active Slides */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-persivia-blue mb-4">
                        Active Slides
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeSlides.map((slide) => (
                            <SlideCard
                                key={slide.id}
                                slide={slide}
                                onEdit={handleEditSlide}
                            />
                        ))}
                    </div>
                </section>

                {/* Inactive Slides */}
                {inactiveSlides.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-persivia-gray mb-4">
                            Inactive Slides
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inactiveSlides.map((slide) => (
                                <SlideCard
                                    key={slide.id}
                                    slide={slide}
                                    onEdit={handleEditSlide}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <EditModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        slide={selectedSlide}
                        onSave={handleSaveSlide}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPage; 