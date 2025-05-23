import React, { useState } from "react";
import { NewsSlide as NewsSlideType } from "../../types";
import { MediaSelector } from "../MediaSelector";

interface NewsSlideProps {
    slide: NewsSlideType;
    onUpdate: (slide: NewsSlideType) => void;
}

/**
 * NewsSlide Component
 * Displays a news slide with title, details, and background image
 */
export const NewsSlide: React.FC<NewsSlideProps> = ({ slide, onUpdate }) => {
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

    const handleBackgroundSelect = (url: string) => {
        onUpdate({
            ...slide,
            data: {
                ...slide.data,
                backgroundImage: url
            }
        });
    };

    if (!slide.data.backgroundImage) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-base-200 p-6 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Missing Background</h3>
                <p className="text-slate-500 mb-4">This slide has no background image.</p>
                <button
                    type="button"
                    onClick={() => setIsMediaSelectorOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Select Background
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="relative w-full h-full overflow-hidden">
                <img
                    src={slide.data.backgroundImage}
                    alt="Background"
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
                                <p class="text-slate-500">Failed to load background image: ${slide.data.backgroundImage}</p>
                            </div>
                        `;
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: "black",
                        opacity: slide.data.overlayOpacity || 0.5
                    }}
                />
                <div
                    className="absolute inset-0 p-8 flex flex-col justify-center"
                    style={{
                        color: slide.data.textColor || "#FFFFFF",
                        textAlign: slide.data.textAlignment || "center"
                    }}
                >
                    <input
                        type="text"
                        value={slide.data.title}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: {
                                ...slide.data,
                                title: e.target.value
                            }
                        })}
                        className={`w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-300 ${slide.data.textSize === "small" ? "text-5xl md:text-6xl" :
                                slide.data.textSize === "medium" ? "text-6xl md:text-7xl" :
                                    slide.data.textSize === "large" ? "text-7xl md:text-8xl" :
                                        slide.data.textSize === "xl" ? "text-8xl md:text-9xl" :
                                            slide.data.textSize === "2xl" ? "text-9xl md:text-[10rem]" :
                                                "text-7xl md:text-8xl"
                            }`}
                        placeholder="Enter title..."
                    />
                    <textarea
                        value={slide.data.details}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: {
                                ...slide.data,
                                details: e.target.value
                            }
                        })}
                        className={`w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-300 mt-4 ${slide.data.textSize === "small" ? "text-xl md:text-2xl" :
                                slide.data.textSize === "medium" ? "text-2xl md:text-3xl" :
                                    slide.data.textSize === "large" ? "text-3xl md:text-4xl" :
                                        slide.data.textSize === "xl" ? "text-4xl md:text-5xl" :
                                            slide.data.textSize === "2xl" ? "text-5xl md:text-6xl" :
                                                "text-3xl md:text-4xl"
                            }`}
                        placeholder="Enter details..."
                        rows={4}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setIsMediaSelectorOpen(true)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>

            <MediaSelector
                isOpen={isMediaSelectorOpen}
                onClose={() => setIsMediaSelectorOpen(false)}
                onSelect={handleBackgroundSelect}
                acceptedTypes={["image"]}
                title="Select Background Image"
            />
        </>
    );
}; 