import React from "react";
import { TextSlide as TextSlideType } from "../../types";

interface TextSlideProps {
    slide: TextSlideType;
}

/**
 * TextSlide component for displaying rich text content
 * Optimized for full-screen LED display with consistent glossy background styling
 */
const TextSlide: React.FC<TextSlideProps> = ({ slide }) => {
    const { content } = slide.data;

    // Early return if no content
    if (!content) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-persivia-white p-6 pb-16 rounded-lg shadow animated-gradient-bg overflow-hidden">
                <div className="text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">No Content</h2>
                    <p className="text-xl opacity-80">Please add content to this text slide.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-6 pb-16 rounded-lg shadow animated-gradient-bg overflow-hidden">
            {/* Content container matching other slides */}
            <div className="w-[90%] max-w-6xl rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-6 overflow-hidden">
                {/* Rich text content - display exactly as from TinyMCE */}
                <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </div>
    );
};

export default TextSlide;
