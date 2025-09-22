import React, { useRef, useEffect, useState, useCallback } from "react";
import { VideoSlide as VideoSlideType } from "../../types";
import { MediaSelector } from "../MediaSelector";

interface VideoSlideProps {
    slide: VideoSlideType;
    onUpdate?: (slide: VideoSlideType) => void;
    onVideoEnd?: () => void;
}

export const VideoSlide: React.FC<VideoSlideProps> = ({ slide, onUpdate, onVideoEnd }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Get video URL - now all URLs use file system serving
    const getVideoUrl = useCallback(() => {
        if (!slide.data.videoUrl) return '';

        // Ensure URL uses port 5000 (file system serving)
        if (slide.data.videoUrl.includes('/api/files/')) {
            const fileId = slide.data.videoUrl.split('/api/files/')[1];
            if (fileId) {
                return `http://localhost:5000/api/files/${fileId}`;
            }
        }

        return slide.data.videoUrl;
    }, [slide.data.videoUrl]);

    // Enhanced play attempt with better error handling
    const attemptPlay = useCallback(async () => {
        if (!videoRef.current || hasError) return;

        try {
            // Ensure video is ready to play
            if (videoRef.current.readyState < 3) {
                console.log("Video not ready yet, waiting...");
                return;
            }

            console.log("Attempting to play video for slide:", slide.name);
            await videoRef.current.play();
            console.log("Video started playing successfully");
        } catch (error) {
            console.warn("Video play failed:", error);
            // Try to play muted as fallback
            if (videoRef.current && !videoRef.current.muted) {
                console.log("Trying to play muted video as fallback");
                videoRef.current.muted = true;
                try {
                    await videoRef.current.play();
                    console.log("Muted video started playing successfully");
                } catch (mutedError) {
                    console.error("Even muted video failed to play:", mutedError);
                    setHasError(true);
                }
            }
        }
    }, [hasError, slide.name]);

    // Video event handlers
    const handleLoadStart = useCallback(() => {
        console.log("Video load started for slide:", slide.name);
        setIsLoading(true);
        setHasError(false);
    }, [slide.name]);

    const handleLoadedMetadata = useCallback(() => {
        console.log("Video metadata loaded for slide:", slide.name);
        if (videoRef.current) {
            console.log("Video metadata:", {
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight,
                duration: videoRef.current.duration,
                readyState: videoRef.current.readyState,
                currentSrc: videoRef.current.currentSrc
            });
        }
    }, [slide.name]);

    const handleLoadedData = useCallback(() => {
        console.log("Video data loaded for slide:", slide.name);
        setIsLoading(false);
    }, [slide.name]);

    const handleCanPlay = useCallback(() => {
        console.log("Video can play for slide:", slide.name);
        setIsLoading(false);

        // Attempt to play when video is ready (for slideshow mode)
        if (onVideoEnd) {
            // Small delay to ensure video is fully ready
            setTimeout(() => attemptPlay(), 200);
        }
    }, [onVideoEnd, attemptPlay, slide.name]);

    const handleCanPlayThrough = useCallback(() => {
        console.log("Video can play through for slide:", slide.name);
        setIsLoading(false);

        // Set fallback timeout only when video can play through smoothly
        if (onVideoEnd && !fallbackTimeoutRef.current) {
            const fallbackDuration = (slide.duration || 30) * 1000 + 5000; // Add 5 seconds buffer
            fallbackTimeoutRef.current = setTimeout(() => {
                console.warn('Video fallback timeout triggered for slide:', slide.name);
                if (onVideoEnd) {
                    onVideoEnd();
                }
            }, fallbackDuration);
        }

        // Try to play if not already playing
        if (onVideoEnd && videoRef.current && videoRef.current.paused) {
            attemptPlay();
        }

        // Resume autoplay timer if this is in a slideshow - video is ready to play smoothly
        if (onVideoEnd) {
            const event = new CustomEvent('videoBuffering', {
                detail: { slideId: slide.id, isBuffering: false, reason: 'canPlayThrough' }
            });
            window.dispatchEvent(event);
        }
    }, [onVideoEnd, attemptPlay, slide.duration, slide.name, slide.id]);

    const handlePlaying = useCallback(() => {
        console.log("Video started playing for slide:", slide.name);
        if (videoRef.current) {
            console.log("Video playing state:", {
                currentTime: videoRef.current.currentTime,
                paused: videoRef.current.paused,
                muted: videoRef.current.muted,
                volume: videoRef.current.volume,
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight
            });
        }
        setIsLoading(false);
        setHasError(false);
    }, [slide.name]);

    const handleWaiting = useCallback(() => {
        console.log("Video waiting/buffering for slide:", slide.name);
        setIsLoading(true);

        // Only dispatch buffering event for slideshow videos, not standalone videos
        if (onVideoEnd) {
            const event = new CustomEvent('videoBuffering', {
                detail: { slideId: slide.id, isBuffering: true, reason: 'waiting' }
            });
            window.dispatchEvent(event);
        }
    }, [slide.name, slide.id, onVideoEnd]);

    const handleSeeking = useCallback(() => {
        console.log("Video seeking for slide:", slide.name);
        setIsLoading(true);
    }, [slide.name]);

    const handleSeeked = useCallback(() => {
        console.log("Video seeked for slide:", slide.name);
        setIsLoading(false);

        // Resume autoplay timer if this is in a slideshow and we were actually buffering
        if (onVideoEnd) {
            const event = new CustomEvent('videoBuffering', {
                detail: { slideId: slide.id, isBuffering: false, reason: 'seeked' }
            });
            window.dispatchEvent(event);
        }
    }, [slide.name, slide.id, onVideoEnd]);

    const handleEnded = useCallback(() => {
        // Clear the fallback timeout since video ended naturally
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }

        if (onVideoEnd) {
            // Small delay to ensure video has fully ended
            setTimeout(() => {
                onVideoEnd();
            }, 50);
        }
    }, [onVideoEnd]);

    const handleError = useCallback(() => {
        // Clear fallback timeout on error
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }

        setHasError(true);
        setIsLoading(false);

        // If in slideshow mode, advance to next slide after a delay on error
        if (onVideoEnd) {
            setTimeout(() => {
                onVideoEnd();
            }, 3000); // Wait 3 seconds before advancing
        }
    }, [onVideoEnd]);

    // Handle video selection from media selector
    const handleVideoSelect = (url: string) => {
        if (onUpdate) {
            onUpdate({
                ...slide,
                data: { ...slide.data, videoUrl: url }
            });
        }
        setIsMediaSelectorOpen(false);
    };

    // Initialize video when URL changes
    useEffect(() => {
        const videoUrl = getVideoUrl();
        if (videoRef.current && videoUrl) {
            console.log("Initializing video for slide:", slide.name, "using URL:", videoUrl);
            setIsLoading(true);
            setHasError(false);

            // Clear any existing fallback timeout
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
            }

            // Reset video element
            videoRef.current.load();
        }
    }, [getVideoUrl, slide.name]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
        };
    }, []);


    if (!slide.data.videoUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Missing Video</h3>
                <p className="text-slate-500 mb-4">This slide has no video URL.</p>
                {onUpdate && (
                    <button
                        type="button"
                        onClick={() => setIsMediaSelectorOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Select Video
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="relative w-full h-full overflow-hidden bg-gray-900">
                <video
                    ref={videoRef}
                    data-slide-id={slide.id}
                    src={getVideoUrl()}
                    className="w-full h-full object-cover relative z-10"
                    autoPlay={onVideoEnd ? true : (slide.data.autoplay ?? true)}
                    loop={onVideoEnd ? false : (slide.data.loop ?? false)}
                    muted={onVideoEnd ? true : (slide.data.muted ?? true)}
                    playsInline
                    preload="auto"
                    controls={false}
                    webkit-playsinline="true"
                    onError={handleError}
                    onLoadStart={handleLoadStart}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={handleLoadedData}
                    onCanPlay={handleCanPlay}
                    onCanPlayThrough={handleCanPlayThrough}
                    onPlaying={handlePlaying}
                    onWaiting={handleWaiting}
                    onSeeking={handleSeeking}
                    onSeeked={handleSeeked}
                    onEnded={handleEnded}
                />

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-lg">Loading video...</p>
                        </div>
                    </div>
                )}

                {/* Error indicator */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
                        <div className="text-white text-center">
                            <svg className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h3 className="text-xl font-bold mb-2">Video Error</h3>
                            <p className="text-sm mb-4">Failed to load video</p>
                            <button
                                onClick={() => {
                                    setHasError(false);
                                    if (videoRef.current) {
                                        videoRef.current.load();
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}


                {/* Caption */}
                {slide.data.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        {onUpdate ? (
                            <input
                                type="text"
                                value={slide.data.caption}
                                onChange={(e) => onUpdate({
                                    ...slide,
                                    data: {
                                        ...slide.data,
                                        caption: e.target.value
                                    }
                                })}
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-300"
                                placeholder="Enter caption..."
                            />
                        ) : (
                            <span>{slide.data.caption}</span>
                        )}
                    </div>
                )}

                {/* Edit button */}
                {onUpdate && (
                    <button
                        type="button"
                        onClick={() => setIsMediaSelectorOpen(true)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Media Selector */}
            {onUpdate && (
                <MediaSelector
                    isOpen={isMediaSelectorOpen}
                    onClose={() => setIsMediaSelectorOpen(false)}
                    onSelect={handleVideoSelect}
                    acceptedTypes={["video"]}
                    title="Select Video"
                />
            )}
        </>
    );
}; 