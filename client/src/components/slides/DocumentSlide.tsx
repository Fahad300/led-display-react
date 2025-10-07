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
    const [pdfError, setPdfError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfLoadTimeout, setPdfLoadTimeout] = useState<NodeJS.Timeout | null>(null);

    // Reset error state when file URL changes
    useEffect(() => {
        setPdfError(false);
        setIsLoading(true);

        // Set a timeout to detect if PDF fails to load
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.log("DocumentSlide - PDF load timeout, trying fallback");
                setPdfError(true);
                setIsLoading(false);
            }
        }, 5000); // 5 second timeout

        setPdfLoadTimeout(timeout);

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [slide?.data?.fileUrl, isLoading]);

    // Validate slide data structure
    if (!slide || !slide.data) {
        console.error("DocumentSlide - Invalid slide data:", slide);
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">Invalid Slide Data</h2>
                    <p className="text-gray-600">The slide data is missing or corrupted.</p>
                </div>
            </div>
        );
    }

    const { fileUrl, fileType, caption } = slide.data;

    // Debug logging
    console.log("DocumentSlide - Rendering slide:", {
        slideId: slide.id,
        slideName: slide.name,
        fileUrl,
        fileType,
        caption,
        slideData: slide.data,
        slideType: slide.type,
        slideActive: slide.active,
        slideDuration: slide.duration
    });

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
            const baseUrl = url.replace(/\/[^/]+$/, '');
            return `${baseUrl}/${fileId}/view`;
        }
        return url;
    };

    // Handle PDF load errors
    const handlePdfError = () => {
        console.log("PDF failed to load, trying fallback");
        setPdfError(true);
        setIsLoading(false);

        // Clear the timeout since we're handling the error
        if (pdfLoadTimeout) {
            clearTimeout(pdfLoadTimeout);
            setPdfLoadTimeout(null);
        }
    };

    // Handle PDF load success
    const handlePdfLoad = () => {
        console.log("PDF loaded successfully");
        setPdfError(false);
        setIsLoading(false);

        // Clear the timeout since PDF loaded successfully
        if (pdfLoadTimeout) {
            clearTimeout(pdfLoadTimeout);
            setPdfLoadTimeout(null);
        }
    };

    // Early return if no file URL
    if (!fileUrl || fileUrl.trim() === "") {
        console.error("DocumentSlide - No file URL provided:", {
            slideId: slide.id,
            slideName: slide.name,
            fileUrl,
            fileType,
            slideData: slide.data
        });
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">No Document Selected</h2>
                    <p className="text-gray-600">Please select a document in the admin panel.</p>
                    <p className="text-sm text-gray-500 mt-2">Slide ID: {slide.id}</p>
                    <p className="text-sm text-gray-500">File URL: {fileUrl || "Empty"}</p>
                </div>
            </div>
        );
    }

    // Determine the appropriate viewer based on file type
    const renderDocument = () => {
        console.log("DocumentSlide - Rendering document with fileType:", fileType);

        // For images, use a full-screen img tag
        if (fileType === "image") {
            console.log("DocumentSlide - Rendering as image");
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
            console.log("DocumentSlide - Rendering as PDF");
            // If PDF failed to load, show fallback message
            if (pdfError) {
                return (
                    <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                        <div className="text-center p-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">PDF Display Error</h2>
                            <p className="text-gray-600 mb-4">Unable to display PDF in browser.</p>
                            <p className="text-sm text-gray-500">File: {fileUrl.split('/').pop()}</p>
                            <div className="mt-4 space-x-2">
                                <button
                                    onClick={() => {
                                        setPdfError(false);
                                        setIsLoading(true);
                                    }}
                                    className="px-4 py-2 bg-persivia-blue text-white rounded hover:bg-blue-600"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Open in New Tab
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            // Try the special PDF view endpoint first
            const pdfViewUrl = getPdfViewUrl(fileUrl);
            console.log("DocumentSlide - PDF View URL:", pdfViewUrl);

            // Simplified PDF URL without complex parameters
            const pdfUrl = `${pdfViewUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit&zoom=page-fit`;
            console.log("DocumentSlide - Final PDF URL:", pdfUrl);

            return (
                <div className="w-full h-full relative document-slide-container">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-persivia-white z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-persivia-blue mx-auto mb-4"></div>
                                <p className="text-persivia-blue">Loading PDF...</p>
                                <p className="text-sm text-gray-500 mt-2">If this takes too long, try opening in a new tab</p>
                                <button
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="mt-2 px-3 py-1 bg-persivia-blue text-white text-sm rounded hover:bg-blue-600"
                                >
                                    Open in New Tab
                                </button>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full document-slide-iframe bg-persivia-white"
                        title={caption || "PDF Document"}
                        frameBorder="0"
                        scrolling="no"
                        onLoad={() => {
                            console.log("DocumentSlide - PDF iframe loaded successfully");
                            handlePdfLoad();
                        }}
                        onError={(e) => {
                            console.error("DocumentSlide - PDF iframe error:", e);
                            console.log("DocumentSlide - PDF view endpoint failed, trying direct URL");
                            setPdfError(true);
                            setIsLoading(false);
                        }}
                        sandbox="allow-same-origin allow-scripts allow-downloads"
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                        }}
                    />

                    {/* Fallback iframe with direct PDF URL */}
                    {pdfError && (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full document-slide-iframe bg-persivia-white"
                            title={caption || "PDF Document (Direct)"}
                            frameBorder="0"
                            scrolling="no"
                            onLoad={() => {
                                console.log("DocumentSlide - Direct PDF iframe loaded successfully");
                                setPdfError(false);
                                setIsLoading(false);
                            }}
                            onError={(e) => {
                                console.error("DocumentSlide - Direct PDF iframe also failed:", e);
                                setPdfError(true);
                                setIsLoading(false);
                            }}
                            sandbox="allow-same-origin allow-scripts allow-downloads"
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 1
                            }}
                        />
                    )}
                </div>
            );
        }

        // For Office files (Excel, PowerPoint, Word), use Office Online viewer without controls and fit to page
        if (["excel", "powerpoint", "word"].includes(fileType)) {
            console.log("DocumentSlide - Rendering as Office document:", fileType);
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
        console.log("DocumentSlide - Unsupported file type:", fileType);
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white">
                <div className="text-center p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-persivia-blue mb-4">Unsupported File Type</h2>
                    <p className="text-gray-600">This file type cannot be displayed.</p>
                    <p className="text-sm text-gray-500 mt-2">File Type: {fileType}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-persivia-white relative">
            {/* Debug overlay - remove this in production */}
            <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-50">
                <div>Slide ID: {slide.id}</div>
                <div>File URL: {fileUrl ? 'Present' : 'Missing'}</div>
                <div>File Type: {fileType}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>PDF Error: {pdfError ? 'Yes' : 'No'}</div>
            </div>

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