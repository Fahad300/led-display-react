import React from "react";
import SlidesDisplay from "../components/SlidesDisplay";

/**
 * DisplayPage: Full-screen display page for LED screens
 * 
 * This page simply renders the SlidesDisplay component, which handles:
 * - Loading slides from the unified context
 * - Creating event slides dynamically
 * - Rendering the slideshow with proper settings
 * - Syncing with HomePage for real-time updates
 * 
 * By using the same SlidesDisplay component as other parts of the app,
 * we ensure complete consistency and avoid duplication.
 */
const DisplayPage: React.FC = () => {
    return <SlidesDisplay />;
};

export default DisplayPage;
