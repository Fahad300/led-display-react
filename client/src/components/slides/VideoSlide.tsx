import React, { useState } from "react";
import { VideoSlide as VideoSlideType } from "../../types";
import { MediaSelector } from "../MediaSelector";

interface VideoSlideProps {
    slide: VideoSlideType;
    onUpdate?: (slide: VideoSlideType) => void;
    onVideoEnd?: () => void;
}

/**
 * VideoSlide Component
 * Displays a video with optional caption and controls
 */
export const VideoSlide: React.FC<VideoSlideProps> = ({ slide, onUpdate, onVideoEnd }) => {
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

    const handleVideoSelect = (url: string) => {
        if (onUpdate) {
            onUpdate({
                ...slide,
                data: {
                    ...slide.data,
                    videoUrl: url
                }
            });
        }
    };

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

    const captionElement = slide.data.caption ? (
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
    ) : null;

    return (
        <>
            <div className="relative w-full h-full overflow-hidden">
                <video
                    src={slide.data.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay={slide.data.autoplay}
                    loop={slide.data.loop}
                    muted={slide.data.muted}
                    playsInline
                    onError={(e) => {
                        console.error("Video playback error:", e);
                    }}
                    onPlay={() => {
                        console.log("🔍 VideoSlide - Video started playing");
                        // Dispatch event to pause autoplay timer
                        const event = new CustomEvent('videoSlideStart', {
                            detail: { slideId: slide.id, slideName: slide.name }
                        });
                        window.dispatchEvent(event);
                    }}
                    onPause={() => {
                        console.log("🔍 VideoSlide - Video paused");
                        // Dispatch event to resume autoplay timer
                        const event = new CustomEvent('videoSlidePause', {
                            detail: { slideId: slide.id, slideName: slide.name }
                        });
                        window.dispatchEvent(event);
                    }}
                    onAbort={() => {
                        console.log("🔍 VideoSlide - Video loading was aborted");
                    }}
                    onEnded={() => {
                        console.log("🔍 VideoSlide - Video ended, triggering next slide");
                        // Dispatch event for video end
                        const event = new CustomEvent('videoSlideEnd', {
                            detail: { slideId: slide.id, slideName: slide.name }
                        });
                        window.dispatchEvent(event);

                        if (onVideoEnd && !slide.data.loop) {
                            onVideoEnd();
                        }
                    }}
                />
                {captionElement}
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