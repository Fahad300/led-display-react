import React from "react";

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaUrl: string;
    mediaType: string;
    mediaName: string;
}

/**
 * Modal component for displaying media files (images and videos) in full size
 */
const MediaModal: React.FC<MediaModalProps> = ({
    isOpen,
    onClose,
    mediaUrl,
    mediaType,
    mediaName
}) => {
    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing ${mediaName}`}
            tabIndex={0}
        >
            <div
                className="relative max-w-4xl w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full p-2"
                    aria-label="Close modal"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <div className="bg-white rounded-lg overflow-hidden">
                    {mediaType.startsWith("image/") ? (
                        <img
                            src={mediaUrl}
                            alt={mediaName}
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />
                    ) : mediaType.startsWith("video/") ? (
                        <video
                            src={mediaUrl}
                            controls
                            className="w-full h-auto max-h-[80vh]"
                            autoPlay
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default MediaModal; 