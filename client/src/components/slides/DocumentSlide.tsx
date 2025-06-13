import React from "react";
import { DocumentSlide as DocumentSlideType } from "../../types";

interface DocumentSlideProps {
    slide: DocumentSlideType;
}

/**
 * DocumentSlide component for displaying various document types (PDF, Office files, images)
 * Optimized for full-screen LED display
 */
const DocumentSlide: React.FC<DocumentSlideProps> = ({ slide }) => {
    const { fileUrl, fileType, caption } = slide.data;

    // Log rendering details for debugging
    console.log("[DocumentSlide] Rendering with:", { fileUrl, fileType, caption });

    // Early return if no file URL
    if (!fileUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-persivia-blue mb-4">No Document Selected</h2>
                    <p className="text-gray-600">Please select a document in the admin panel.</p>
                </div>
            </div>
        );
    }

    // Determine the appropriate viewer based on file type
    const renderDocument = () => {
        // For images, use a full-screen img tag
        if (fileType === "image") {
            return (
                <img
                    src={fileUrl}
                    alt={caption || "Document"}
                    className="w-full h-full object-contain bg-persivia-white"
                />
            );
        }

        // For PDFs, use a full-screen iframe
        if (fileType === "pdf") {
            return (
                <iframe
                    src={fileUrl}
                    className="w-full h-full border-0 bg-persivia-white"
                    title={caption || "PDF Document"}
                />
            );
        }

        // For Office files (Excel, PowerPoint, Word), use Office Online viewer
        if (["excel", "powerpoint", "word"].includes(fileType)) {
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
            return (
                <iframe
                    src={officeViewerUrl}
                    className="w-full h-full border-0 bg-persivia-white"
                    title={caption || "Office Document"}
                />
            );
        }

        // Fallback for unsupported file types
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-persivia-blue mb-4">Unsupported File Type</h2>
                    <p className="text-gray-600">This file type cannot be displayed.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-persivia-white">
            {renderDocument()}
            {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-center">
                    {caption}
                </div>
            )}
        </div>
    );
};

export default DocumentSlide; 