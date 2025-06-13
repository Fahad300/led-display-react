/**
 * Slide types used in the application
 */
export const SLIDE_TYPES = {
    IMAGE: 'image-slide',
    VIDEO: 'video-slide',
    NEWS: 'news-slide',
    EVENT: 'event-slide',
    CURRENT_ESCALATIONS: 'current-escalations-slide',
    TEAM_COMPARISON: 'team-comparison-slide',
    GRAPH: 'graph-slide'
} as const;

/**
 * Slide data sources
 */
export type DataSource = 'manual' | 'api' | 'file';

/**
 * Base slide interface that all slides extend
 */
export interface BaseSlide {
    id: string;
    name: string;
    type: typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES];
    dataSource: DataSource;
    duration: number;
    active: boolean;
}

/**
 * Image slide data
 */
export interface ImageSlideData {
    imageUrl: string;
    caption?: string;
}

/**
 * Image slide type
 */
export interface ImageSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.IMAGE;
    data: ImageSlideData;
}

/**
 * Video slide data
 */
export interface VideoSlideData {
    videoUrl: string;
    caption?: string;
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
}

/**
 * Video slide type
 */
export interface VideoSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.VIDEO;
    data: VideoSlideData;
}

/**
 * News slide data
 */
export interface NewsSlideData {
    title: string;
    details: string;
    backgroundImage: string;
    overlayOpacity?: number; // 0 to 1, for text readability over background
    textColor?: string;
    textSize?: "small" | "medium" | "large" | "xl" | "2xl" | "3xl";
    textAlignment?: "left" | "center" | "right";
    newsImage?: string;
}

/**
 * News slide type
 */
export interface NewsSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.NEWS;
    data: NewsSlideData;
}

/**
 * Event slide data
 */
export interface EventSlideData {
    title: string;
    description: string;
    date: string;
    time?: string;
    location?: string;
    imageUrl?: string;
    registrationLink?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    isEmployeeSlide?: boolean;
    employeeId?: string;
}

/**
 * Event slide type
 */
export interface EventSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.EVENT;
    data: EventSlideData;
}

/**
 * Current escalations slide data
 */
export interface CurrentEscalationsSlideData {
    escalations: Array<{
        ticketCategory: string;
        teamName: string;
        clientName: string;
        ticketSummary: string;
        averageResponseTime: string;
        ticketStatus: string;
        currentStatus: string;
    }>;
}

/**
 * Current escalations slide type
 */
export interface CurrentEscalationsSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.CURRENT_ESCALATIONS;
    data: CurrentEscalationsSlideData;
}

/**
 * Team comparison data interface
 */
export interface TeamComparisonData {
    teamName: string;
    totalTickets: number;
    cLevelEscalations: number;
    omegaEscalations: number;
    codeBlueEscalations: number;
    averageResponseTime: string;
    averageLeadTime: string;
}

/**
 * Team comparison slide data
 */
export interface TeamComparisonSlideData {
    teams: TeamComparisonData[];
    lastUpdated: string;
}

/**
 * Team comparison slide type
 */
export interface TeamComparisonSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.TEAM_COMPARISON;
    data: TeamComparisonSlideData;
}

/**
 * Graph data point interface
 */
export interface GraphDataPoint {
    date: string;
    value: number;
    category: string;
}

/**
 * Graph slide data
 */
export interface GraphSlideData {
    title: string;
    description: string;
    graphType: 'line' | 'bar';
    data: {
        teamName: string;
        dataPoints: GraphDataPoint[];
    }[];
    timeRange: 'daily' | 'weekly' | 'monthly';
    lastUpdated: string;
    categories: string[];
}

/**
 * Graph slide type
 */
export interface GraphSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.GRAPH;
    data: GraphSlideData;
}

/**
 * Union type of all slide types
 */
export type Slide =
    | ImageSlide
    | VideoSlide
    | NewsSlide
    | EventSlide
    | CurrentEscalationsSlide
    | TeamComparisonSlide
    | GraphSlide
    ;

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

/**
 * Theme settings interface
 */
export interface ThemeSettings {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
}

/**
 * Application settings interface
 */
export interface AppSettings {
    theme: ThemeSettings;
    slideTransitionSpeed: number;
    slideShowAutoPlay: boolean;
    defaultSlideDuration: number;
}