/**
 * Central configuration for all default slides
 * This file controls the initial state of all default slides including their active status
 */

export interface DefaultSlideConfig {
    id: string;
    name: string;
    type: string;
    active: boolean;
    duration: number;
    dataSource: string;
}

/**
 * Default slide configurations
 * All slides start as inactive (active: false) - user can activate them as needed
 */
export const DEFAULT_SLIDE_CONFIGS: DefaultSlideConfig[] = [
    {
        id: "current-escalations-1",
        name: "Current Escalations",
        type: "current-escalations",
        active: false, // User can activate this slide if needed
        duration: 10,
        dataSource: "api"
    },
    {
        id: "team-comparison-1",
        name: "Team Performance Comparison",
        type: "comparison-slide",
        active: false, // User can activate this slide if needed
        duration: 15,
        dataSource: "api"
    },
    {
        id: "graph-1",
        name: "Team Wise Data",
        type: "graph-slide",
        active: false, // User can activate this slide if needed
        duration: 12,
        dataSource: "api"
    },
    {
        id: "event-birthday-1",
        name: "Birthday Celebrations",
        type: "event",
        active: false, // User can activate this slide if needed
        duration: 8,
        dataSource: "api"
    },
    {
        id: "event-anniversary-1",
        name: "Work Anniversaries",
        type: "event",
        active: false, // User can activate this slide if needed
        duration: 8,
        dataSource: "api"
    }
];

/**
 * Get the active status for a default slide by type
 */
export const getDefaultSlideActiveStatus = (slideType: string): boolean => {
    const config = DEFAULT_SLIDE_CONFIGS.find(config => config.type === slideType);
    return config ? config.active : false;
};

/**
 * Get the duration for a default slide by type
 */
export const getDefaultSlideDuration = (slideType: string): number => {
    const config = DEFAULT_SLIDE_CONFIGS.find(config => config.type === slideType);
    return config ? config.duration : 10;
};

/**
 * Get all active default slide types
 */
export const getActiveDefaultSlideTypes = (): string[] => {
    return DEFAULT_SLIDE_CONFIGS
        .filter(config => config.active)
        .map(config => config.type);
};

/**
 * Get the count of active default slides
 */
export const getActiveDefaultSlideCount = (): number => {
    return DEFAULT_SLIDE_CONFIGS.filter(config => config.active).length;
};
