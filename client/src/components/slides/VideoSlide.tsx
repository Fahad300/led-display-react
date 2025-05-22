import React from "react";
import { VideoSlide as VideoSlideType } from "../../types";

interface VideoSlideProps {
    slide: VideoSlideType;
}

/**
 * VideoSlide Component
 * Displays a video with optional caption and controls
 */
export const VideoSlide: React.FC<VideoSlideProps> = ({ slide }) => {
    const { videoUrl, caption, autoplay = true, loop = true, muted = true } = slide.data;

    if (!videoUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Missing Video</h3>
                <p className="text-slate-500">This slide has no video URL.</p>
            </div>
        );
    }

    const captionElement = caption ? (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">{caption}</div>
    ) : null;

    return (
        <div className="relative w-full h-full overflow-hidden">
            <video
                src={videoUrl}
                className="w-full h-full object-cover"
                autoPlay={autoplay}
                loop={loop}
                muted={muted}
                playsInline
                controls={!autoplay}
                onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    target.onerror = null;
                    target.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 class="text-xl font-bold mb-2">Video Error</h3>
                            <p class="text-slate-500">Failed to load video: ${videoUrl}</p>
                        </div>
                    `;
                }}
            />
            {captionElement}
        </div>
    );
}; 