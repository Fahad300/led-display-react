import React from "react";
import { TextSlide as TextSlideType } from "../../types";

interface TextSlideProps {
    slide: TextSlideType;
}

type FontSize = "small" | "medium" | "large" | "xlarge";
type TextAlignment = "left" | "center" | "right";

/**
 * TextSlide Component
 * Displays text content with optional title and styling
 */
export const TextSlide: React.FC<TextSlideProps> = ({ slide }) => {
    const { title, content, textAlign = "center", fontSize = "medium" } = slide.data;

    const fontSizeClasses: Record<FontSize, string> = {
        small: "text-lg",
        medium: "text-2xl",
        large: "text-4xl",
        xlarge: "text-6xl"
    };

    const textAlignClasses: Record<TextAlignment, string> = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className={`max-w-4xl w-full ${textAlignClasses[textAlign as TextAlignment]}`}>
                {title && (
                    <h2 className={`font-bold mb-6 ${fontSizeClasses[fontSize as FontSize]}`}>
                        {title}
                    </h2>
                )}
                <div className={`${fontSizeClasses[fontSize as FontSize]} leading-relaxed`}>
                    {content}
                </div>
            </div>
        </div>
    );
}; 