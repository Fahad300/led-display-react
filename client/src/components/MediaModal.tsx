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
                            onError={(e) => {
                                console.error("Error loading image in modal:", mediaUrl);
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E";
                            }}
                        />
                    ) : mediaType.startsWith("video/") ? (
                        <video
                            src={mediaUrl}
                            controls
                            className="w-full h-auto max-h-[80vh]"
                            autoPlay
                        />
                    ) : (
                        <div className="p-8 text-center">
                            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600">Document preview not available</p>
                            <p className="text-sm text-gray-500 mt-2">{mediaName}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaModal; 