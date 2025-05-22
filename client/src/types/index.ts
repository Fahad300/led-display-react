/**
 * Slide types used in the application
 */
export const SLIDE_TYPES = {
    IMAGE: 'image-slide',
    TEXT: 'text-slide',
    COUNTDOWN: 'countdown-slide',
    VIDEO: 'video-slide',
    NEWS: 'news-slide',
    EVENT: 'event-slide'
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
 * Text slide data
 */
export interface TextSlideData {
    title?: string;
    content: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
}

/**
 * Text slide type
 */
export interface TextSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.TEXT;
    data: TextSlideData;
}

/**
 * Countdown slide data
 */
export interface CountdownSlideData {
    targetDate: string;
    title?: string;
    message?: string;
}

/**
 * Countdown slide type
 */
export interface CountdownSlide extends BaseSlide {
    type: typeof SLIDE_TYPES.COUNTDOWN;
    data: CountdownSlideData;
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
 * Union type of all slide types
 */
export type Slide = ImageSlide | TextSlide | CountdownSlide | VideoSlide | NewsSlide | EventSlide;

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