import React, { useState, useEffect } from "react";
import { DocumentSlide as DocumentSlideType } from "../../types";

interface DocumentSlideProps {
    slide: DocumentSlideType;
}

/**
 * DocumentSlide component for displaying various document types (PDF, Office files, images)
 * Optimized for full-screen LED display without interactive elements
 */
const DocumentSlide: React.FC<DocumentSlideProps> = ({ slide }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [useDirectUrl, setUseDirectUrl] = useState(false);
    const [pdfDisplayMethod, setPdfDisplayMethod] = useState<'iframe' | 'object' | 'embed'>('iframe');

    // Reset loading state when file URL changes
    useEffect(() => {
        setIsLoading(true);
        setUseDirectUrl(false);
        setPdfDisplayMethod('iframe');
    }, [slide?.data?.fileUrl]);

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

    // Handle PDF load success
    const handlePdfLoad = () => {
        setIsLoading(false);
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

        // For PDFs, use multiple display approaches
        if (fileType === "pdf") {
            console.log("DocumentSlide - Rendering as PDF with method:", pdfDisplayMethod);

            // Try different URL approaches
            const pdfViewUrl = getPdfViewUrl(fileUrl);
            const directUrl = fileUrl;

            // Simple URL without complex parameters that might cause issues
            const simplePdfUrl = useDirectUrl ? directUrl : pdfViewUrl;

            // Enhanced PDF URL with all controls hidden for display screens
            const displayPdfUrl = `${simplePdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit&zoom=page-fit&disableWorker=true&textLayer=0&annotationLayer=0&sidebar=0&secondaryToolbar=0&findbar=0&print=0&download=0&openfile=0&attachments=0&bookmarks=0&presentationMode=0&editorFreeText=0&editorInk=0&editorStamp=0&editorHighlight=0&editorUnderline=0&editorSquiggly=0&editorStrikeOut=0&editorRedact=0&editorCaret=0&editorStamp=0&editorFreeText=0&editorInk=0&editorHighlight=0&editorUnderline=0&editorSquiggly=0&editorStrikeOut=0&editorRedact=0&editorCaret=0`;

            const handlePdfError = () => {
                console.error("DocumentSlide - PDF display error, trying next method");
                if (pdfDisplayMethod === 'iframe') {
                    setPdfDisplayMethod('object');
                    setIsLoading(true);
                } else if (pdfDisplayMethod === 'object') {
                    setPdfDisplayMethod('embed');
                    setIsLoading(true);
                } else if (!useDirectUrl) {
                    setUseDirectUrl(true);
                    setPdfDisplayMethod('iframe');
                    setIsLoading(true);
                } else {
                    setIsLoading(false);
                }
            };

            const handlePdfSuccess = () => {
                console.log("DocumentSlide - PDF loaded successfully with method:", pdfDisplayMethod);
                setIsLoading(false);
            };

            return (
                <div className="w-full h-full relative document-slide-container">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-persivia-white z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-persivia-blue mx-auto mb-4"></div>
                                <p className="text-persivia-blue">Loading PDF...</p>
                                <p className="text-sm text-gray-500 mt-2">Method: {pdfDisplayMethod}</p>
                            </div>
                        </div>
                    )}

                    {/* Method 1: iframe */}
                    {pdfDisplayMethod === 'iframe' && (
                        <iframe
                            src={displayPdfUrl}
                            className="w-full h-full document-slide-iframe bg-persivia-white"
                            title={caption || "PDF Document"}
                            frameBorder="0"
                            scrolling="no"
                            onLoad={handlePdfSuccess}
                            onError={handlePdfError}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none"
                            }}
                            allow="fullscreen"
                        />
                    )}

                    {/* Method 2: object element */}
                    {pdfDisplayMethod === 'object' && (
                        <object
                            data={displayPdfUrl}
                            type="application/pdf"
                            className="w-full h-full bg-persivia-white"
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none"
                            }}
                            onLoad={handlePdfSuccess}
                            onError={handlePdfError}
                        >
                            <p>Your browser does not support PDFs.</p>
                        </object>
                    )}

                    {/* Method 3: embed element */}
                    {pdfDisplayMethod === 'embed' && (
                        <embed
                            src={displayPdfUrl}
                            type="application/pdf"
                            className="w-full h-full bg-persivia-white"
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none"
                            }}
                            onLoad={handlePdfSuccess}
                            onError={handlePdfError}
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