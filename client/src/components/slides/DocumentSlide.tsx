import React, { useState, useEffect } from "react";
import { DocumentSlide as DocumentSlideType } from "../../types";

interface DocumentSlideProps {
    slide: DocumentSlideType;
}

/**
 * DocumentSlide component for displaying various document types (PDF, Office files, images)
 * Optimized for full-screen LED display with download prevention
 */
const DocumentSlide: React.FC<DocumentSlideProps> = ({ slide }) => {
    const { fileUrl, fileType, caption } = slide.data;
    const [pdfError, setPdfError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Extract file ID from URL for PDF viewing endpoint
    const getFileIdFromUrl = (url: string): string | null => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            return pathParts[pathParts.length - 1] || null;
        } catch {
            return null;
        }
    };

    // Get PDF view URL (prevents download popups)
    const getPdfViewUrl = (url: string): string => {
        const fileId = getFileIdFromUrl(url);
        if (fileId) {
            // Use the special /view endpoint for PDFs
            const baseUrl = url.replace(/\/[^\/]+$/, '');
            return `${baseUrl}/${fileId}/view`;
        }
        return url;
    };

    // Handle PDF load errors
    const handlePdfError = () => {
        console.log("PDF failed to load, trying fallback");
        setPdfError(true);
        setIsLoading(false);
    };

    // Handle PDF load success
    const handlePdfLoad = () => {
        console.log("PDF loaded successfully");
        setPdfError(false);
        setIsLoading(false);
    };

    // Reset error state when file URL changes
    useEffect(() => {
        setPdfError(false);
        setIsLoading(true);
    }, [fileUrl]);

    // Early return if no file URL
    if (!fileUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">No Document Selected</h2>
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
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
            );
        }

        // For PDFs, use multiple fallback approaches
        if (fileType === "pdf") {
            // If PDF failed to load, show fallback message
            if (pdfError) {
                return (
                    <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                        <div className="text-center p-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">PDF Display Error</h2>
                            <p className="text-gray-600 mb-4">Unable to display PDF in browser.</p>
                            <p className="text-sm text-gray-500">File: {fileUrl.split('/').pop()}</p>
                        </div>
                    </div>
                );
            }

            // Try the special PDF view endpoint first
            const pdfViewUrl = getPdfViewUrl(fileUrl);
            const pdfUrl = `${pdfViewUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit&zoom=page-fit&disableprint=1&disablesave=1`;

            return (
                <div className="w-full h-full relative document-slide-container">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-persivia-white z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-persivia-blue mx-auto mb-4"></div>
                                <p className="text-persivia-blue">Loading PDF...</p>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full document-slide-iframe bg-persivia-white"
                        title={caption || "PDF Document"}
                        frameBorder="0"
                        scrolling="no"
                        onLoad={handlePdfLoad}
                        onError={handlePdfError}
                        sandbox="allow-same-origin allow-scripts"
                    />
                </div>
            );
        }

        // For Office files (Excel, PowerPoint, Word), use Office Online viewer without controls and fit to page
        if (["excel", "powerpoint", "word"].includes(fileType)) {
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdStartOn=1&wdHideGridlines=1&wdHideHeaders=1&wdDownloadButton=0&wdInConfigurator=0&wdHideWorksheetTabs=1&wdHideFormulaBar=1&wdHideStatusBar=1&wdHideRibbon=1&wdFitToPage=1&wdFitToWidth=1&wdFitToHeight=1`;
            return (
                <div className="w-full h-full document-slide-container">
                    <iframe
                        src={officeViewerUrl}
                        className="w-full h-full document-slide-iframe bg-persivia-white"
                        title={caption || "Office Document"}
                        frameBorder="0"
                        scrolling="no"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                        sandbox="allow-same-origin allow-scripts"
                    />
                </div>
            );
        }

        // Fallback for unsupported file types
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">Unsupported File Type</h2>
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