import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Slide, ImageSlide, SLIDE_TYPES, CurrentEscalationsSlide, DataSource } from '../types';
import { createDemoImage } from '../utils/createDemoImages';
import { currentEscalations } from '../data/currentEscalations';

// Local storage key for slides
const STORAGE_KEY = 'led-display-templates-config';

// Interface for the slide context
interface SlideContextType {
    slides: Slide[];
    activeSlide: Slide | null;
    setActiveSlide: (slide: Slide | null) => void;
    addSlide: (slide: Slide) => void;
    updateSlide: (slide: Slide) => void;
    deleteSlide: (id: string) => void;
    loadSlides: () => void;
    getSlideById: (id: string) => Slide | undefined;
    reorderSlides: (slides: Slide[]) => void;
}

// Create the context with default values
const SlideContext = createContext<SlideContextType>({
    slides: [],
    activeSlide: null,
    setActiveSlide: () => { },
    addSlide: () => { },
    updateSlide: () => { },
    deleteSlide: () => { },
    loadSlides: () => { },
    getSlideById: () => undefined,
    reorderSlides: () => { },
});

// Props for the provider component
interface SlideProviderProps {
    children: ReactNode;
}

/**
 * Generate a unique ID for a new slide
 */
const generateUniqueId = (): string => {
    return `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Get a demo image slide for new users
 */
const getDemoImageSlide = (): ImageSlide => {
    // Create a demo image data URL
    const demoImageUrl = createDemoImage(
        "Welcome to LED Display\nClick Edit to customize",
        800,
        400,
        '134D67',
        'FFFFFF'
    );

    return {
        id: "demo-image-slide",
        name: "Welcome Image",
        type: SLIDE_TYPES.IMAGE,
        dataSource: "manual",
        data: {
            imageUrl: demoImageUrl,
            caption: "Welcome to the LED Display System"
        },
        duration: 5,
        active: true
    };
};

/**
 * Get a current escalations slide
 */
const getCurrentEscalationsSlide = (): CurrentEscalationsSlide | null => {
    if (!currentEscalations || currentEscalations.length === 0) return null;
    return {
        id: "current-escalations-1",
        name: "Current Escalations",
        type: SLIDE_TYPES.CURRENT_ESCALATIONS,
        dataSource: "manual" as DataSource,
        duration: 10,
        active: true,
        data: {
            escalations: currentEscalations.map(escalation => ({
                ...escalation,
                currentStatus: escalation.curtentStatus
            }))
        }
    };
};

/**
 * Provider component that wraps the app and provides the slide context
 */
export const SlideProvider: React.FC<SlideProviderProps> = ({ children }) => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlide, setActiveSlide] = useState<Slide | null>(null);

    /**
     * Load slides from localStorage
     */
    const loadSlides = useCallback(() => {
        try {
            // Load all templates
            const allTemplates = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

            // Type-check and filter to ensure we only get valid slides
            const validSlides = allTemplates.filter((slide: any) =>
                slide && slide.id && slide.type &&
                Object.values(SLIDE_TYPES).includes(slide.type)
            ) as Slide[];

            // Inject currentEscalations slide if data exists and not already present
            const escalationsSlide = getCurrentEscalationsSlide();
            const hasEscalationsSlide = validSlides.some(s => s.type === SLIDE_TYPES.CURRENT_ESCALATIONS);
            let slidesWithEscalations = validSlides;
            if (escalationsSlide && !hasEscalationsSlide) {
                slidesWithEscalations = [...validSlides, escalationsSlide];
            }
            if (slidesWithEscalations.length === 0) {
                // Add a demo slide if no slides exist
                const demoSlide = getDemoImageSlide();
                setSlides([demoSlide]);
                saveSlides([demoSlide]);
            } else {
                setSlides(slidesWithEscalations);
            }
        } catch (error) {
            console.error("Error loading slides:", error);
            // Add a demo slide if there was an error
            const demoSlide = getDemoImageSlide();
            setSlides([demoSlide]);
            saveSlides([demoSlide]);
        }
    }, []);

    /**
     * Save slides to localStorage
     */
    const saveSlides = (slidesToSave: Slide[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slidesToSave));
        } catch (error) {
            console.error("Error saving slides:", error);
        }
    };

    /**
     * Add a new slide
     */
    const addSlide = (slide: Slide) => {
        // Ensure the slide has a valid ID
        const newSlide = {
            ...slide,
            id: slide.id || generateUniqueId()
        };

        const updatedSlides = [...slides, newSlide];
        setSlides(updatedSlides);
        saveSlides(updatedSlides);
    };

    /**
     * Update an existing slide
     */
    const updateSlide = (updatedSlide: Slide) => {
        const updatedSlides = slides.map(slide =>
            slide.id === updatedSlide.id ? updatedSlide : slide
        );

        setSlides(updatedSlides);
        saveSlides(updatedSlides);
    };

    /**
     * Delete a slide by ID
     */
    const deleteSlide = (id: string) => {
        const updatedSlides = slides.filter(slide => slide.id !== id);
        setSlides(updatedSlides);
        saveSlides(updatedSlides);

        // Clear active slide if it was deleted
        if (activeSlide && activeSlide.id === id) {
            setActiveSlide(null);
        }
    };

    /**
     * Get a slide by ID
     */
    const getSlideById = (id: string): Slide | undefined => {
        return slides.find(slide => slide.id === id);
    };

    /**
     * Reorder slides and save the new order
     */
    const reorderSlides = (newSlides: Slide[]) => {
        setSlides(newSlides);
        saveSlides(newSlides);
    };

    // Load slides on mount
    useEffect(() => {
        loadSlides();
    }, [loadSlides]);

    // Value object for the context provider
    const contextValue: SlideContextType = {
        slides,
        activeSlide,
        setActiveSlide,
        addSlide,
        updateSlide,
        deleteSlide,
        loadSlides,
        getSlideById,
        reorderSlides
    };

    return (
        <SlideContext.Provider value={contextValue}>
            {children}
        </SlideContext.Provider>
    );
};

/**
 * Custom hook to use the slide context
 */
export const useSlides = () => useContext(SlideContext);

export default SlideContext; 