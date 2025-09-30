/**
 * Optimized File Loading System
 * Uses static file serving and advanced caching for faster file loading
 * when server and client are on the same machine
 * Supports videos, images, and other file types
 */

export interface FileCache {
    url: string;
    blob?: Blob;
    objectUrl?: string;
    preloaded: boolean;
    lastAccessed: number;
    fileType: 'video' | 'image' | 'document' | 'other';
}

class OptimizedFileLoader {
    private fileCache: Map<string, FileCache> = new Map();
    private preloadQueue: Set<string> = new Set();
    private isLocalEnvironment: boolean;
    private maxCacheSize: number = 100 * 1024 * 1024; // 100MB cache limit
    private currentCacheSize: number = 0;

    constructor() {
        this.isLocalEnvironment = this.detectLocalEnvironment();
        this.setupCleanupInterval();
    }

    /**
     * Detect if we're running in a local development environment
     */
    private detectLocalEnvironment(): boolean {
        return (
            typeof window !== 'undefined' &&
            (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('192.168.') ||
                window.location.hostname.includes('10.0.') ||
                process.env.NODE_ENV === 'development'
            )
        );
    }

    /**
     * Setup periodic cleanup of old cache entries
     */
    private setupCleanupInterval(): void {
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.cleanupCache();
            }, 5 * 60 * 1000); // Cleanup every 5 minutes
        }
    }

    /**
     * Create optimized static file URL for local development
     */
    private async createStaticFileUrl(fileId: string): Promise<string> {
        try {
            // Get the actual filename from the database
            const response = await fetch(`http://localhost:5000/api/files/${fileId}/info`);
            if (response.ok) {
                const fileInfo = await response.json();
                const staticUrl = `http://localhost:5000/static/uploads/${fileInfo.filename}`;
                console.log(`✅ Static file URL created: ${staticUrl} for file: ${fileId}`);
                return staticUrl;
            } else {
                const errorText = await response.text();
                console.warn(`❌ File info request failed for ${fileId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
            }
        } catch (error) {
            console.warn(`❌ Failed to get file info for ${fileId}:`, error);
        }

        // Fallback to original API endpoint if static serving fails
        const fallbackUrl = `http://localhost:5000/api/files/${fileId}`;
        console.log(`⚠️ Falling back to API endpoint: ${fallbackUrl} for file: ${fileId}`);
        return fallbackUrl;
    }

    /**
     * Preload video into memory for instant playback
     */
    public async preloadVideo(fileId: string, originalUrl: string): Promise<string> {
        // Check if already cached
        const cached = this.fileCache.get(fileId);
        if (cached && cached.objectUrl) {
            cached.lastAccessed = Date.now();
            return cached.objectUrl;
        }

        // Add to preload queue
        this.preloadQueue.add(fileId);

        try {
            // Try static file serving first for local development
            let videoUrl = originalUrl;
            if (this.isLocalEnvironment) {
                videoUrl = await this.createStaticFileUrl(fileId);
            }

            // Fetch video data
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Cache the result
            const cacheEntry: FileCache = {
                url: originalUrl,
                blob,
                objectUrl,
                preloaded: true,
                lastAccessed: Date.now(),
                fileType: 'video' // Default to video for this method
            };

            this.fileCache.set(fileId, cacheEntry);
            this.currentCacheSize += blob.size;

            // Remove from preload queue
            this.preloadQueue.delete(fileId);

            console.log(`✅ Video preloaded successfully: ${fileId} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
            return objectUrl;

        } catch (error) {
            console.warn(`⚠️ Video preload failed for ${fileId}, using original URL:`, error);
            this.preloadQueue.delete(fileId);
            return originalUrl;
        }
    }

    /**
     * Get optimized video URL with caching
     */
    public async getOptimizedVideoUrl(fileId: string, originalUrl: string): Promise<string> {
        // Always try static file serving first for better performance
        const staticUrl = await this.createStaticFileUrl(fileId);
        console.log(`🎬 Using optimized static URL: ${staticUrl} for file: ${fileId}`);

        // For additional optimization, we could still preload in background
        if (!this.preloadQueue.has(fileId)) {
            // Start background preload for even faster future access
            this.preloadVideo(fileId, originalUrl).catch(error => {
                console.warn(`Background preload failed for ${fileId}:`, error);
            });
        }

        return staticUrl;
    }

    /**
     * Preload multiple videos in parallel
     */
    public async preloadVideos(videoInfos: Array<{ fileId: string; url: string }>): Promise<void> {
        const preloadPromises = videoInfos.map(({ fileId, url }) =>
            this.preloadVideo(fileId, url).catch(error => {
                console.warn(`Failed to preload ${fileId}:`, error);
            })
        );

        await Promise.allSettled(preloadPromises);
        console.log(`🚀 Completed preloading ${videoInfos.length} videos`);
    }

    /**
     * Clean up old cache entries to free memory
     */
    private cleanupCache(): void {
        if (this.currentCacheSize <= this.maxCacheSize) {
            return;
        }

        // Sort by last accessed time (oldest first)
        const entries = Array.from(this.fileCache.entries())
            .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

        // Remove oldest entries until under cache limit
        let cleanedSize = 0;
        for (const [fileId, cache] of entries) {
            if (this.currentCacheSize - cleanedSize <= this.maxCacheSize * 0.8) {
                break;
            }

            if (cache.objectUrl) {
                URL.revokeObjectURL(cache.objectUrl);
            }

            cleanedSize += cache.blob?.size || 0;
            this.fileCache.delete(fileId);
        }

        this.currentCacheSize -= cleanedSize;
        console.log(`🧹 Cleaned up ${(cleanedSize / 1024 / 1024).toFixed(2)}MB from video cache`);
    }

    /**
     * Clear all cached videos
     */
    public clearCache(): void {
        this.fileCache.forEach((cache) => {
            if (cache.objectUrl) {
                URL.revokeObjectURL(cache.objectUrl);
            }
        });
        this.fileCache.clear();
        this.preloadQueue.clear();
        this.currentCacheSize = 0;
        console.log('🗑️ Video cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: string; entries: number; preloading: number } {
        return {
            size: `${(this.currentCacheSize / 1024 / 1024).toFixed(2)}MB`,
            entries: this.fileCache.size,
            preloading: this.preloadQueue.size
        };
    }

    /**
     * Check if video is already cached
     */
    public isCached(fileId: string): boolean {
        const cached = this.fileCache.get(fileId);
        return !!(cached && cached.objectUrl);
    }
}

// Export singleton instance
export const optimizedVideoLoader = new OptimizedFileLoader();

/**
 * Enhanced video URL resolver that tries optimized loading first
 */
export const getOptimizedVideoUrl = async (originalUrl: string): Promise<string> => {
    if (!originalUrl) return '';

    // Extract file ID from URL
    const fileIdMatch = originalUrl.match(/\/api\/files\/([^\/\?]+)/);
    if (!fileIdMatch) {
        return originalUrl;
    }

    const fileId = fileIdMatch[1];

    try {
        const optimizedUrl = await optimizedVideoLoader.getOptimizedVideoUrl(fileId, originalUrl);
        return optimizedUrl;
    } catch (error) {
        console.warn('Optimized video loading failed, using original URL:', error);
        return originalUrl;
    }
};

/**
 * Enhanced file URL resolver for any file type (images, videos, documents)
 * Uses static file serving when available, with fallback to API
 */
export const getOptimizedFileUrl = async (originalUrl: string): Promise<string> => {
    if (!originalUrl) return '';

    // Extract file ID from URL
    const fileIdMatch = originalUrl.match(/\/api\/files\/([^\/\?]+)/);
    if (!fileIdMatch) {
        return originalUrl;
    }

    const fileId = fileIdMatch[1];

    try {
        const optimizedUrl = await optimizedVideoLoader.getOptimizedVideoUrl(fileId, originalUrl);
        return optimizedUrl;
    } catch (error) {
        console.warn('Optimized file loading failed, using original URL:', error);
        return originalUrl;
    }
};

/**
 * Preload multiple videos for smoother slideshow transitions
 */
export const preloadVideos = async (videoUrls: string[]): Promise<void> => {
    const videoInfos = videoUrls
        .map(url => {
            const fileIdMatch = url.match(/\/api\/files\/([^\/\?]+)/);
            return fileIdMatch ? { fileId: fileIdMatch[1], url } : null;
        })
        .filter((info): info is { fileId: string; url: string } => info !== null);

    if (videoInfos.length > 0) {
        await optimizedVideoLoader.preloadVideos(videoInfos);
    }
};

/**
 * Extract file ID from video URL
 */
export const extractFileId = (url: string): string | null => {
    const match = url.match(/\/api\/files\/([^\/\?]+)/);
    return match ? match[1] : null;
};

/**
 * Check if video is cached and ready for instant playback
 */
export const isVideoCached = (url: string): boolean => {
    const fileId = extractFileId(url);
    return fileId ? optimizedVideoLoader.isCached(fileId) : false;
};

/**
 * Get video cache statistics for debugging
 */
export const getVideoCacheStats = () => optimizedVideoLoader.getCacheStats();

/**
 * Clear video cache to free memory
 */
export const clearVideoCache = () => optimizedVideoLoader.clearCache();
