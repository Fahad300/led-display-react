import React from "react";

/**
 * SlideLogoOverlay
 * Renders the Persivia logo at the bottom right with a blurred background.
 */
interface SlideLogoOverlayProps {
    isFullscreen?: boolean;
}

const SlideLogoOverlay: React.FC<SlideLogoOverlayProps> = ({ isFullscreen = false }) => {
    return (
        <div className={`absolute bottom-5 right-5 z-50 ${isFullscreen ? "scale-[1]" : ""}`}>
            <img
                src="/images/logo-persivia.svg"
                alt="Logo"
                className="h-8"
            />
        </div>
    );
};

export default SlideLogoOverlay; 