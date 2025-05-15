/**
 * Slide types used in the application
 */
export const SLIDE_TYPES = {
    IMAGE: 'image-slide',
    TEXT: 'text-slide',
    COUNTDOWN: 'countdown-slide',
    VIDEO: 'video-slide'
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
 * Union type of all slide types
 */
export type Slide = ImageSlide | TextSlide | CountdownSlide | VideoSlide;

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