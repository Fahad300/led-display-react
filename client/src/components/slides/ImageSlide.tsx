import React from "react";
import { ImageSlide as ImageSlideType } from "../../types";

interface ImageSlideProps {
    slide: ImageSlideType;
}

/**
 * ImageSlide Component
 * Displays an image with optional caption
 */
export const ImageSlide: React.FC<ImageSlideProps> = ({ slide }) => {
    const { imageUrl, caption } = slide.data;

    if (!imageUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Missing Image</h3>
                <p className="text-slate-500">This slide has no image URL.</p>
            </div>
        );
    }

    const captionElement = caption ? (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">{caption}</div>
    ) : null;

    return (
        <div className="relative w-full h-full overflow-hidden">
            <img
                src={imageUrl}
                alt={caption || "Slide image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 class="text-xl font-bold mb-2">Image Error</h3>
                            <p class="text-slate-500">Failed to load image: ${imageUrl}</p>
                        </div>
                    `;
                }}
            />
            {captionElement}
        </div>
    );
}; 