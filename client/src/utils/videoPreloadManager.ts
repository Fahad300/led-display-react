/**
 * Global Video Preload Manager
 * 
 * Ensures videos are fully cached and ready before being displayed in the slideshow.
 * Prevents buffering, black frames, and playback interruptions on LED displays.
 * 
 * Key Features:
 * - Preloads videos completely before marking them as ready
 * - Maintains a cache of ready video elements
 * - Provides synchronous readiness checks
 * - Handles timeouts and errors gracefully
 * - Automatic cleanup of unused videos
 * 
 * Usage:
 * ```typescript
 * // Preload a video
 * await videoPreloadManager.preloadVideo(videoUrl);
 * 
 * // Check if ready
 * if (videoPreloadManager.isVideoReady(videoUrl)) {
 *   // Safe to display this video slide
 * }
 * 
 * // Get ready video element
 * const video = videoPreloadManager.getVideoElement(videoUrl);
 * ```
 */

import { logger } from "./logger";

/**
 * Video cache entry structure
 */
interface VideoCacheEntry {
    /** Original video URL */
    url: string;
    /** Preloaded video element (ready to clone for playback) */
    videoElement: HTMLVideoElement;
    /** Whether video is fully loaded and ready */
    isReady: boolean;
    /** Whether video is currently preloading */
    isPreloading: boolean;
    /** Last time this video was accessed */
    lastAccessed: number;
    /** Video duration in seconds */
    duration: number;
    /** File size in bytes (if available) */
    size?: number;
    /** Error message if preload failed */
    error?: string;
}

/**
 * Preload status for tracking progress
 */
export interface PreloadStatus {
    url: string;
    isReady: boolean;
    isPreloading: boolean;
    progress: number; // 0-100
    error?: string;
}

/**
 * Global Video Preload Manager Class
 * Singleton pattern for centralized video management
 */
class VideoPreloadManager {
    /** Cache of preloaded videos */
    private videoCache: Map<string, VideoCacheEntry> = new Map();

    /** Set of URLs currently being preloaded */
    private preloadingQueue: Set<string> = new Set();

    /** Ready state change listeners */
    private readyStateListeners: Map<string, Set<(isReady: boolean) => void>> = new Map();

    /** Maximum cache size (100MB) */
    private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024;

    /** Preload timeout (30 seconds) */
    private readonly PRELOAD_TIMEOUT = 30000;

    /** Cache cleanup interval (5 minutes) */
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

    /** Maximum age for cached videos (30 minutes) */
    private readonly MAX_CACHE_AGE = 30 * 60 * 1000;

    constructor() {
        this.setupCleanupInterval();
        logger.info("🎬 VideoPreloadManager initialized");
    }

    /**
     * Setup periodic cleanup of old cached videos
     */
    private setupCleanupInterval(): void {
        if (typeof window !== "undefined") {
            setInterval(() => {
                this.cleanupOldVideos();
            }, this.CLEANUP_INTERVAL);
        }
    }

    /**
     * Preload a video completely before allowing it to be displayed
     * Returns a promise that resolves when video is ready
     * 
     * @param url - Video URL to preload
     * @returns Promise that resolves to true when video is ready
     */
    public async preloadVideo(url: string): Promise<boolean> {
        // Check if already cached and ready
        const cached = this.videoCache.get(url);
        if (cached && cached.isReady) {
            logger.debug(`✅ Video already cached and ready: ${url}`);
            cached.lastAccessed = Date.now();
            return true;
        }

        // Check if already preloading
        if (this.preloadingQueue.has(url)) {
            logger.debug(`⏳ Video already preloading: ${url}`);
            // Wait for existing preload to complete
            return this.waitForPreload(url);
        }

        // Start preloading
        logger.info(`🚀 Starting video preload: ${url}`);
        this.preloadingQueue.add(url);

        try {
            // Create video element for preloading
            const video = document.createElement("video");
            video.preload = "auto";
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = "anonymous";
            video.style.display = "none";

            // Add to DOM to ensure loading starts (some browsers require this)
            document.body.appendChild(video);

            // Create cache entry
            const cacheEntry: VideoCacheEntry = {
                url,
                videoElement: video,
                isReady: false,
                isPreloading: true,
                lastAccessed: Date.now(),
                duration: 0
            };
            this.videoCache.set(url, cacheEntry);

            // Wait for video to be ready
            const isReady = await this.waitForVideoReady(video, url);

            if (isReady) {
                // Update cache entry
                cacheEntry.isReady = true;
                cacheEntry.isPreloading = false;
                cacheEntry.duration = video.duration;
                logger.success(`✅ Video preload complete: ${url} (duration: ${video.duration.toFixed(2)}s)`);

                // Notify listeners
                this.notifyReadyStateChange(url, true);

                return true;
            } else {
                // Preload failed or timed out
                logger.error(`❌ Video preload failed: ${url}`);
                cacheEntry.isReady = false;
                cacheEntry.isPreloading = false;
                cacheEntry.error = "Preload failed or timed out";

                // Remove from DOM
                if (video.parentElement) {
                    document.body.removeChild(video);
                }

                return false;
            }
        } catch (error) {
            logger.error(`❌ Video preload error: ${url}`, error);

            // Update cache with error
            const cacheEntry = this.videoCache.get(url);
            if (cacheEntry) {
                cacheEntry.isReady = false;
                cacheEntry.isPreloading = false;
                cacheEntry.error = error instanceof Error ? error.message : String(error);
            }

            return false;
        } finally {
            this.preloadingQueue.delete(url);
        }
    }

    /**
     * Wait for video element to be fully ready
     */
    private waitForVideoReady(video: HTMLVideoElement, url: string): Promise<boolean> {
        return new Promise((resolve) => {
            let isResolved = false;

            const resolveOnce = (success: boolean) => {
                if (isResolved) return;
                isResolved = true;
                resolve(success);
            };

            // Timeout after 30 seconds
            const timeout = setTimeout(() => {
                logger.warn(`⏰ Video preload timeout: ${url}`);
                resolveOnce(false);
            }, this.PRELOAD_TIMEOUT);

            // Success handlers
            const handleCanPlayThrough = () => {
                logger.debug(`✅ Video canplaythrough: ${url}`);
                clearTimeout(timeout);
                cleanup();
                resolveOnce(true);
            };

            const handleLoadedData = () => {
                logger.debug(`📊 Video loadeddata: ${url}`);
                // Don't resolve yet - wait for canplaythrough for full readiness
            };

            // Error handler
            const handleError = (e: Event) => {
                logger.error(`❌ Video load error: ${url}`, e);
                clearTimeout(timeout);
                cleanup();
                resolveOnce(false);
            };

            // Cleanup function
            const cleanup = () => {
                video.removeEventListener("canplaythrough", handleCanPlayThrough);
                video.removeEventListener("loadeddata", handleLoadedData);
                video.removeEventListener("error", handleError);
            };

            // Attach event listeners
            video.addEventListener("canplaythrough", handleCanPlayThrough);
            video.addEventListener("loadeddata", handleLoadedData);
            video.addEventListener("error", handleError);

            // Start loading
            video.src = url;
            video.load();
        });
    }

    /**
     * Wait for an existing preload operation to complete
     */
    private waitForPreload(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const cached = this.videoCache.get(url);

                // If no longer preloading, resolve
                if (!this.preloadingQueue.has(url)) {
                    clearInterval(checkInterval);
                    resolve(cached?.isReady || false);
                }
            }, 100); // Check every 100ms

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
            }, this.PRELOAD_TIMEOUT);
        });
    }

    /**
     * Check if a video is ready for playback (synchronous)
     * 
     * @param url - Video URL to check
     * @returns true if video is fully preloaded and ready
     */
    public isVideoReady(url: string): boolean {
        const cached = this.videoCache.get(url);
        return !!(cached && cached.isReady && !cached.error);
    }

    /**
     * Check if a video is currently preloading
     * 
     * @param url - Video URL to check
     * @returns true if video is being preloaded
     */
    public isVideoPreloading(url: string): boolean {
        return this.preloadingQueue.has(url);
    }

    /**
     * Get video element for playback
     * Returns a cloned video element to avoid conflicts
     * 
     * @param url - Video URL
     * @returns Cloned video element or null if not ready
     */
    public getVideoElement(url: string): HTMLVideoElement | null {
        const cached = this.videoCache.get(url);

        if (!cached || !cached.isReady) {
            logger.warn(`⚠️ Video not ready: ${url}`);
            return null;
        }

        // Update last accessed time
        cached.lastAccessed = Date.now();

        // Clone the video element for playback
        const clone = cached.videoElement.cloneNode(true) as HTMLVideoElement;
        clone.style.display = "";

        return clone;
    }

    /**
     * Get preload status for a video
     * 
     * @param url - Video URL
     * @returns Preload status object
     */
    public getPreloadStatus(url: string): PreloadStatus {
        const cached = this.videoCache.get(url);

        if (!cached) {
            return {
                url,
                isReady: false,
                isPreloading: false,
                progress: 0
            };
        }

        // Calculate progress based on buffered data
        let progress = 0;
        if (cached.videoElement && cached.videoElement.buffered.length > 0) {
            const buffered = cached.videoElement.buffered.end(cached.videoElement.buffered.length - 1);
            const duration = cached.videoElement.duration;
            if (duration > 0) {
                progress = Math.round((buffered / duration) * 100);
            }
        }

        return {
            url,
            isReady: cached.isReady,
            isPreloading: cached.isPreloading,
            progress,
            error: cached.error
        };
    }

    /**
     * Preload multiple videos in parallel
     * 
     * @param urls - Array of video URLs to preload
     * @returns Promise that resolves when all videos are processed
     */
    public async preloadMultipleVideos(urls: string[]): Promise<Map<string, boolean>> {
        logger.info(`🚀 Preloading ${urls.length} videos in parallel`);

        const results = new Map<string, boolean>();

        const preloadPromises = urls.map(async (url) => {
            const success = await this.preloadVideo(url);
            results.set(url, success);
            return { url, success };
        });

        await Promise.allSettled(preloadPromises);

        const successCount = Array.from(results.values()).filter(Boolean).length;
        logger.info(`✅ Preload complete: ${successCount}/${urls.length} videos ready`);

        return results;
    }

    /**
     * Add listener for video ready state changes
     * 
     * @param url - Video URL to watch
     * @param callback - Function to call when ready state changes
     * @returns Unsubscribe function
     */
    public onReadyStateChange(url: string, callback: (isReady: boolean) => void): () => void {
        if (!this.readyStateListeners.has(url)) {
            this.readyStateListeners.set(url, new Set());
        }

        this.readyStateListeners.get(url)?.add(callback);

        // Return unsubscribe function
        return () => {
            this.readyStateListeners.get(url)?.delete(callback);
        };
    }

    /**
     * Notify listeners of ready state change
     */
    private notifyReadyStateChange(url: string, isReady: boolean): void {
        const listeners = this.readyStateListeners.get(url);
        if (listeners) {
            listeners.forEach(callback => callback(isReady));
        }
    }

    /**
     * Cleanup old cached videos
     */
    private cleanupOldVideos(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        this.videoCache.forEach((entry, url) => {
            const age = now - entry.lastAccessed;

            // Remove if too old or has error
            if (age > this.MAX_CACHE_AGE || entry.error) {
                toDelete.push(url);
            }
        });

        toDelete.forEach(url => {
            const entry = this.videoCache.get(url);
            if (entry && entry.videoElement.parentElement) {
                document.body.removeChild(entry.videoElement);
            }
            this.videoCache.delete(url);
            logger.debug(`🗑️ Cleaned up cached video: ${url}`);
        });

        if (toDelete.length > 0) {
            logger.info(`🗑️ Cleaned up ${toDelete.length} old videos from cache`);
        }
    }

    /**
     * Get all ready video URLs
     * 
     * @returns Array of URLs that are ready for playback
     */
    public getReadyVideoUrls(): string[] {
        const readyUrls: string[] = [];

        this.videoCache.forEach((entry, url) => {
            if (entry.isReady && !entry.error) {
                readyUrls.push(url);
            }
        });

        return readyUrls;
    }

    /**
     * Get cache statistics
     * 
     * @returns Object with cache stats
     */
    public getCacheStats(): {
        totalVideos: number;
        readyVideos: number;
        preloadingVideos: number;
        failedVideos: number;
        cacheSize: string;
    } {
        let readyCount = 0;
        let failedCount = 0;
        let totalSize = 0;

        this.videoCache.forEach((entry) => {
            if (entry.isReady && !entry.error) {
                readyCount++;
            }
            if (entry.error) {
                failedCount++;
            }
            if (entry.size) {
                totalSize += entry.size;
            }
        });

        return {
            totalVideos: this.videoCache.size,
            readyVideos: readyCount,
            preloadingVideos: this.preloadingQueue.size,
            failedVideos: failedCount,
            cacheSize: this.formatBytes(totalSize)
        };
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    /**
     * Clear specific video from cache
     * 
     * @param url - Video URL to remove
     */
    public clearVideo(url: string): void {
        const entry = this.videoCache.get(url);

        if (entry) {
            // Remove video element from DOM
            if (entry.videoElement.parentElement) {
                document.body.removeChild(entry.videoElement);
            }

            // Remove from cache
            this.videoCache.delete(url);
            logger.debug(`🗑️ Cleared video from cache: ${url}`);
        }
    }

    /**
     * Clear all videos from cache
     */
    public clearAllVideos(): void {
        logger.info("🗑️ Clearing all videos from cache");

        this.videoCache.forEach((entry, url) => {
            if (entry.videoElement.parentElement) {
                document.body.removeChild(entry.videoElement);
            }
        });

        this.videoCache.clear();
        this.preloadingQueue.clear();

        logger.success("✅ All videos cleared from cache");
    }

    /**
     * Retry preloading a failed video
     * 
     * @param url - Video URL to retry
     * @returns Promise that resolves when retry is complete
     */
    public async retryPreload(url: string): Promise<boolean> {
        logger.info(`🔄 Retrying video preload: ${url}`);

        // Clear existing cache entry
        this.clearVideo(url);

        // Try preloading again
        return this.preloadVideo(url);
    }

    /**
     * Get video duration if available
     * 
     * @param url - Video URL
     * @returns Duration in seconds or 0 if not ready
     */
    public getVideoDuration(url: string): number {
        const cached = this.videoCache.get(url);
        return cached?.duration || 0;
    }

    /**
     * Log cache statistics (for debugging)
     */
    public logCacheStats(): void {
        const stats = this.getCacheStats();

        logger.info("📊 Video Cache Statistics:", {
            totalVideos: stats.totalVideos,
            readyVideos: stats.readyVideos,
            preloadingVideos: stats.preloadingVideos,
            failedVideos: stats.failedVideos,
            cacheSize: stats.cacheSize
        });
    }
}

/**
 * Singleton instance of VideoPreloadManager
 */
export const videoPreloadManager = new VideoPreloadManager();

/**
 * Convenience function to preload a single video
 * 
 * @param url - Video URL to preload
 * @returns Promise that resolves when video is ready
 */
export const preloadVideo = (url: string): Promise<boolean> => {
    return videoPreloadManager.preloadVideo(url);
};

/**
 * Convenience function to check if video is ready
 * 
 * @param url - Video URL to check
 * @returns true if video is ready for playback
 */
export const isVideoReady = (url: string): boolean => {
    return videoPreloadManager.isVideoReady(url);
};

/**
 * Convenience function to preload multiple videos
 * 
 * @param urls - Array of video URLs
 * @returns Promise with preload results
 */
export const preloadMultipleVideos = (urls: string[]): Promise<Map<string, boolean>> => {
    return videoPreloadManager.preloadMultipleVideos(urls);
};

/**
 * Convenience function to get video duration
 * 
 * @param url - Video URL
 * @returns Duration in seconds
 */
export const getVideoDuration = (url: string): number => {
    return videoPreloadManager.getVideoDuration(url);
};

/**
 * Convenience function to get cache stats
 * 
 * @returns Cache statistics object
 */
export const getVideoCacheStats = () => {
    return videoPreloadManager.getCacheStats();
};

/**
 * Make videoPreloadManager available globally for debugging
 */
if (typeof window !== "undefined") {
    (window as any).videoPreloadManager = videoPreloadManager;
}

