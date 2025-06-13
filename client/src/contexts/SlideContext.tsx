import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Slide, SLIDE_TYPES, CurrentEscalationsSlide, DataSource } from '../types';
import { currentEscalations } from '../data/currentEscalations';
import { getTeamComparisonSlide } from '../data/teamComparison';
import { getDefaultGraphSlide } from '../data/graphData';

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
    const saveSlides = useCallback((slidesToSave: Slide[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slidesToSave));
        } catch (error) {
            console.error("Error saving slides:", error);
        }
    }, []);

    const loadSlides = useCallback(() => {
        try {
            const allTemplates = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

            // Type-check and filter to ensure we only get valid slides
            const validSlides = allTemplates.filter((slide: any) =>
                slide && slide.id && slide.type &&
                Object.values(SLIDE_TYPES).includes(slide.type)
            ) as Slide[];

            // Get default slides
            const escalationsSlide = getCurrentEscalationsSlide();
            const comparisonSlide = getTeamComparisonSlide();
            const graphSlide = getDefaultGraphSlide();

            // Check which default slides already exist
            const hasEscalationsSlide = validSlides.some(s => s.type === SLIDE_TYPES.CURRENT_ESCALATIONS);
            const hasComparisonSlide = validSlides.some(s => s.type === SLIDE_TYPES.TEAM_COMPARISON);
            const hasGraphSlide = validSlides.some(s => s.type === SLIDE_TYPES.GRAPH);

            let updatedSlides = [...validSlides];

            // Add default slides if they don't exist
            if (escalationsSlide && !hasEscalationsSlide) {
                updatedSlides = [...updatedSlides, escalationsSlide];
            }

            if (!hasComparisonSlide) {
                updatedSlides = [...updatedSlides, comparisonSlide];
            }

            if (!hasGraphSlide) {
                updatedSlides = [...updatedSlides, graphSlide];
            }

            // Only update if we added new slides
            if (updatedSlides.length > validSlides.length) {
                setSlides(updatedSlides);
                saveSlides(updatedSlides);
            } else {
                setSlides(validSlides);
                saveSlides(validSlides);
            }
        } catch (error) {
            console.error("Error loading slides:", error);
            setSlides([]);
            saveSlides([]);
        }
    }, [saveSlides]);

    // Load slides on mount
    useEffect(() => {
        loadSlides();
    }, [loadSlides]);

    /**
     * Add a new slide
     */
    const addSlide = useCallback((slide: Slide) => {
        const newSlide = {
            ...slide,
            id: slide.id || generateUniqueId()
        };

        const updatedSlides = [...slides, newSlide];
        setSlides(updatedSlides);
        saveSlides(updatedSlides);
    }, [slides, saveSlides]);

    /**
     * Update an existing slide
     */
    const updateSlide = useCallback((updatedSlide: Slide) => {
        const updatedSlides = slides.map(slide =>
            slide.id === updatedSlide.id ? updatedSlide : slide
        );

        setSlides(updatedSlides);
        saveSlides(updatedSlides);
    }, [slides, saveSlides]);

    /**
     * Delete a slide by ID
     */
    const deleteSlide = useCallback((id: string) => {
        const updatedSlides = slides.filter(slide => slide.id !== id);
        setSlides(updatedSlides);
        saveSlides(updatedSlides);

        if (activeSlide?.id === id) {
            setActiveSlide(null);
        }
    }, [slides, activeSlide, saveSlides]);

    /**
     * Get a slide by ID
     */
    const getSlideById = useCallback((id: string): Slide | undefined => {
        return slides.find(slide => slide.id === id);
    }, [slides]);

    /**
     * Reorder slides and save the new order
     */
    const reorderSlides = useCallback((newOrder: Slide[]) => {
        setSlides(newOrder);
        saveSlides(newOrder);
    }, [saveSlides]);

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
        reorderSlides,
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
export const useSlides = (): SlideContextType => {
    return useContext(SlideContext);
};

export default SlideContext;