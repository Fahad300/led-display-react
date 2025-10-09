# Video Preload System

## Overview

The **Video Preload Manager** is a comprehensive system that ensures videos are **fully cached and ready** before being displayed in the LED slideshow. This completely eliminates buffering, black frames, and playback interruptions.

## Key Features

### ✅ **Zero Buffering Guarantee**
- Videos only appear in the slideshow when **100% ready**
- No loading indicators or black frames ever shown
- Smooth, instant playback on LED displays

### ✅ **Intelligent Caching**
- Global singleton manager for centralized video caching
- Automatic cleanup of old videos (30-minute max age)
- Size-aware cache management (100MB limit)
- LRU (Least Recently Used) eviction strategy

### ✅ **Async Preloading**
- Videos preload in the background
- Doesn't block the UI or slideshow
- Parallel preloading of multiple videos
- Automatic retry on failure

### ✅ **Ready State Tracking**
- Synchronous `isVideoReady(url)` checks
- Real-time readiness updates
- Event listeners for state changes
- Periodic polling for newly ready videos

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            VideoPreloadManager (Singleton)          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Video Cache │  │ Preload Queue│  │ Listeners │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
│  Methods:                                           │
│  - preloadVideo(url): Promise<boolean>              │
│  - isVideoReady(url): boolean                       │
│  - getVideoElement(url): HTMLVideoElement          │
│  - preloadMultipleVideos(urls[]): Promise<Map>      │
│  - onReadyStateChange(url, callback): () => void    │
│  - getCacheStats(): CacheStats                      │
└─────────────────────────────────────────────────────┘
           ▲              ▲              ▲
           │              │              │
  ┌────────┴──────┐ ┌────┴────┐ ┌──────┴───────┐
  │ SwiperSlideshow│ │HomePage │ │ DisplayPage  │
  └────────────────┘ └─────────┘ └──────────────┘
```

## Usage

### Basic Video Preloading

```typescript
import { videoPreloadManager } from '@/utils/videoPreloadManager';

// Preload a single video
const success = await videoPreloadManager.preloadVideo(videoUrl);

if (success) {
  console.log('Video ready for playback!');
}
```

### Check Video Readiness

```typescript
// Synchronous check
if (videoPreloadManager.isVideoReady(videoUrl)) {
  // Safe to display this video
}

// Get video element for playback
const videoElement = videoPreloadManager.getVideoElement(videoUrl);
```

### Preload Multiple Videos

```typescript
const videoUrls = ['video1.mp4', 'video2.mp4', 'video3.mp4'];

const results = await videoPreloadManager.preloadMultipleVideos(videoUrls);

results.forEach((success, url) => {
  console.log(`${url}: ${success ? 'Ready' : 'Failed'}`);
});
```

### Listen for Ready State Changes

```typescript
// Add listener
const unsubscribe = videoPreloadManager.onReadyStateChange(videoUrl, (isReady) => {
  console.log(`Video ready state changed: ${isReady}`);
  
  if (isReady) {
    // Video became ready - update UI
  }
});

// Cleanup
unsubscribe();
```

### Get Cache Statistics

```typescript
const stats = videoPreloadManager.getCacheStats();

console.log(`Total videos: ${stats.totalVideos}`);
console.log(`Ready videos: ${stats.readyVideos}`);
console.log(`Preloading: ${stats.preloadingVideos}`);
console.log(`Failed: ${stats.failedVideos}`);
console.log(`Cache size: ${stats.cacheSize}`);
```

## Integration Points

### 1. SwiperSlideshow Component

**File:** `client/src/components/SwiperSlideshow.tsx`

```typescript
// Filter slides - only include ready videos
const activeSlides = useMemo(() => {
    return slides.filter(slide => {
        if (!slide.active) return false;

        // For video slides, verify they're ready
        if (slide.type === SLIDE_TYPES.VIDEO) {
            const videoSlide = slide as VideoSlideType;
            return videoPreloadManager.isVideoReady(videoSlide.data.videoUrl);
        }

        return true;
    });
}, [slides]);
```

### 2. HomePage Component

**File:** `client/src/pages/HomePage.tsx`

```typescript
// Preload all videos in background
useEffect(() => {
    const preloadAllVideos = async () => {
        const videoUrls = extractVideoUrls(processedSlides);
        await videoPreloadManager.preloadMultipleVideos(videoUrls);
        
        // Force re-render when videos become ready
        setVideoReadinessCheck(prev => prev + 1);
    };

    preloadAllVideos();

    // Periodic check for newly ready videos
    const interval = setInterval(() => {
        setVideoReadinessCheck(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
}, [processedSlides]);
```

### 3. DisplayPage Component

**File:** `client/src/pages/DisplayPage.tsx`

```typescript
// Filter active slides - only include ready videos
const activeSlides = useMemo(() => {
    return slides.filter(slide => {
        if (!slide.active) return false;

        if (slide.type === SLIDE_TYPES.VIDEO) {
            const videoSlide = slide as VideoSlideType;
            return videoPreloadManager.isVideoReady(videoSlide.data.videoUrl);
        }

        return true;
    });
}, [slides]);
```

## Preload Flow

### Step 1: Video Upload
```
User uploads video → Server stores file → Returns video URL
```

### Step 2: Slide Creation
```
User creates video slide → Slide saved to database with video URL
```

### Step 3: Automatic Preloading
```
HomePage/DisplayPage loads slides
    ↓
Extract all video URLs
    ↓
videoPreloadManager.preloadMultipleVideos(urls)
    ↓
For each video:
    - Create hidden video element
    - Set src and call load()
    - Wait for "canplaythrough" event
    - Cache video element when ready
    ↓
Videos ready for instant playback
```

### Step 4: Slideshow Display
```
SwiperSlideshow filters slides
    ↓
For each video slide:
    - Check videoPreloadManager.isVideoReady(url)
    - Include in activeSlides only if ready
    ↓
Only ready videos shown in slideshow
    ↓
Zero buffering, instant playback
```

## Preload States

A video can be in one of these states:

1. **Not Cached** - Video hasn't been preloaded yet
2. **Preloading** - Video is currently loading
3. **Ready** - Video is fully loaded and ready for playback
4. **Failed** - Video failed to load (network error, timeout, etc.)

```typescript
interface VideoCacheEntry {
    url: string;
    videoElement: HTMLVideoElement;
    isReady: boolean;
    isPreloading: boolean;
    lastAccessed: number;
    duration: number;
    error?: string;
}
```

## Timeout & Error Handling

### Preload Timeout
- **Duration:** 30 seconds
- **Behavior:** If video doesn't become ready within 30s, it's marked as failed
- **UI Impact:** Video slide is skipped, slideshow continues with other slides
- **Recovery:** Automatic retry on next slide change

### Network Errors
- **Behavior:** Video marked as failed, error logged
- **UI Impact:** Video slide is skipped
- **Recovery:** Can manually retry via `retryPreload(url)`

### Low Bandwidth
- **Behavior:** Preload may timeout if connection is too slow
- **Recommendation:** Use smaller video files (<50MB) or reduce quality
- **Fallback:** Non-video slides continue to display normally

## Cache Management

### Automatic Cleanup
- **Interval:** Every 5 minutes
- **Criteria:** Videos older than 30 minutes are removed
- **Size Limit:** 100MB total cache size (LRU eviction)

### Manual Cleanup
```typescript
// Clear specific video
videoPreloadManager.clearVideo(videoUrl);

// Clear all videos
videoPreloadManager.clearAllVideos();
```

## Performance Optimizations

### 1. Parallel Preloading
Videos are preloaded in parallel for faster startup:
```typescript
await Promise.allSettled(videoUrls.map(url => preloadVideo(url)));
```

### 2. Smart Preloading
Only preload videos for active slides:
```typescript
slides.forEach(slide => {
    if (slide.type === SLIDE_TYPES.VIDEO && slide.active) {
        preloadVideo(slide.data.videoUrl);
    }
});
```

### 3. Periodic Readiness Checks
Check every 5 seconds for newly ready videos to update slideshow

### 4. Hidden Video Elements
Videos are preloaded in hidden DOM elements to avoid visual glitches

## Debugging

### Console Commands

The video preload manager is globally available for debugging:

```javascript
// Check cache stats
videoPreloadManager.getCacheStats()

// Check if specific video is ready
videoPreloadManager.isVideoReady('http://localhost:5000/api/files/abc123')

// Get all ready video URLs
videoPreloadManager.getReadyVideoUrls()

// Force retry preload
await videoPreloadManager.retryPreload('http://localhost:5000/api/files/abc123')

// Clear cache
videoPreloadManager.clearAllVideos()

// Log detailed stats
videoPreloadManager.logCacheStats()
```

### Common Log Messages

#### ✅ Success Messages
```
🎬 VideoPreloadManager initialized
🚀 Starting video preload: http://...
✅ Video preload complete: http://... (duration: 45.23s)
✅ All 3 videos preloaded successfully
```

#### ⚠️ Warning Messages
```
⏰ Video preload timeout: http://...
⏳ Skipping video slide (not ready): My Video Slide
⚠️ Video not ready: http://...
```

#### ❌ Error Messages
```
❌ Video preload failed: http://...
❌ Video load error: http://...
```

## Testing

### Manual Testing Checklist

1. **Upload a video slide** ✓
   - Video should preload automatically
   - Check console for preload messages

2. **Activate video slide** ✓
   - Should appear immediately if preload complete
   - Should be skipped if still preloading

3. **Navigate to Display page** ✓
   - Videos should preload on page load
   - Only ready videos shown in slideshow

4. **Check console** ✓
   - Look for "✅ Video preload complete" messages
   - Verify no buffering or playback errors

5. **Test with slow connection** ✓
   - Video should timeout after 30s
   - Slideshow should continue with other slides
   - Video should retry on next check

### Automated Testing

```typescript
// Test video preload
const testVideoPreload = async () => {
    const testUrl = 'http://localhost:5000/api/files/test-video';
    
    console.log('Testing video preload...');
    const success = await videoPreloadManager.preloadVideo(testUrl);
    
    console.log(`Preload ${success ? 'succeeded' : 'failed'}`);
    console.log('Is ready:', videoPreloadManager.isVideoReady(testUrl));
    console.log('Duration:', videoPreloadManager.getVideoDuration(testUrl));
    
    videoPreloadManager.logCacheStats();
};

// Run test
testVideoPreload();
```

## Best Practices

### 1. Video File Optimization
- **Format:** MP4 (H.264)
- **Max Size:** 50MB
- **Resolution:** 1920x1080 or lower
- **Bitrate:** 5-10 Mbps

### 2. Network Considerations
- Videos preload automatically on page load
- Use local network for faster preloading
- Consider video optimization for slower connections

### 3. Cache Management
- Cache auto-cleans every 5 minutes
- Videos expire after 30 minutes of no access
- Max 100MB total cache size

### 4. Error Handling
- Failed videos are automatically skipped
- Slideshow continues with other slides
- Manual retry available via console

## Troubleshooting

### Problem: Video slide not appearing

**Check:**
1. Is video preloaded? `videoPreloadManager.isVideoReady(url)`
2. Check cache stats: `videoPreloadManager.getCacheStats()`
3. Look for error messages in console
4. Try manual retry: `await videoPreloadManager.retryPreload(url)`

### Problem: Video preload timeout

**Possible Causes:**
- Video file too large (>50MB)
- Slow network connection
- Server not responding

**Solutions:**
- Reduce video file size
- Compress video
- Check server is running
- Check network connectivity

### Problem: Cache full

**Solution:**
```typescript
// Clear old videos
videoPreloadManager.clearAllVideos();

// Then reload page
window.location.reload();
```

## Migration from Old System

### Before (Old System)
```typescript
// Videos were preloaded inline
const [videoReadyState, setVideoReadyState] = useState<Map<string, boolean>>();

// Manual preload logic in component
useEffect(() => {
    const video = document.createElement('video');
    video.src = videoUrl;
    // ... manual event handling
}, [videoUrl]);
```

### After (New System)
```typescript
// Global preload manager handles everything
import { videoPreloadManager } from '@/utils/videoPreloadManager';

// Videos preload automatically
useEffect(() => {
    videoPreloadManager.preloadMultipleVideos(videoUrls);
}, [videoUrls]);

// Simple readiness check
if (videoPreloadManager.isVideoReady(videoUrl)) {
    // Display video
}
```

## Future Enhancements

### Planned Features (v2.0)
- [ ] WebSocket integration for real-time video ready notifications
- [ ] Redis-based distributed caching for multi-server setups
- [ ] Video quality variants (adaptive bitrate)
- [ ] Progressive download with partial playback
- [ ] Service Worker integration for offline support

### Potential Optimizations
- [ ] Predictive preloading based on slide order
- [ ] Bandwidth-aware preloading
- [ ] CDN integration
- [ ] Video sprite generation for thumbnails

## API Reference

### videoPreloadManager

#### Methods

##### `preloadVideo(url: string): Promise<boolean>`
Preload a single video.

**Parameters:**
- `url` - Video URL to preload

**Returns:**
- Promise resolving to `true` if successful, `false` otherwise

**Example:**
```typescript
const success = await videoPreloadManager.preloadVideo(videoUrl);
```

##### `isVideoReady(url: string): boolean`
Check if video is ready (synchronous).

**Parameters:**
- `url` - Video URL to check

**Returns:**
- `true` if video is fully preloaded and ready

**Example:**
```typescript
if (videoPreloadManager.isVideoReady(videoUrl)) {
  // Display video
}
```

##### `getVideoElement(url: string): HTMLVideoElement | null`
Get a cloned video element for playback.

**Parameters:**
- `url` - Video URL

**Returns:**
- Cloned video element or null if not ready

**Example:**
```typescript
const video = videoPreloadManager.getVideoElement(videoUrl);
if (video) {
  video.play();
}
```

##### `preloadMultipleVideos(urls: string[]): Promise<Map<string, boolean>>`
Preload multiple videos in parallel.

**Parameters:**
- `urls` - Array of video URLs

**Returns:**
- Map of URL → success status

**Example:**
```typescript
const results = await videoPreloadManager.preloadMultipleVideos(videoUrls);
```

##### `onReadyStateChange(url: string, callback: (isReady: boolean) => void): () => void`
Listen for ready state changes.

**Parameters:**
- `url` - Video URL to watch
- `callback` - Function called when state changes

**Returns:**
- Unsubscribe function

**Example:**
```typescript
const unsubscribe = videoPreloadManager.onReadyStateChange(videoUrl, (isReady) => {
  if (isReady) {
    console.log('Video is now ready!');
  }
});

// Later...
unsubscribe();
```

##### `getCacheStats(): CacheStats`
Get cache statistics.

**Returns:**
- Object with cache stats

**Example:**
```typescript
const stats = videoPreloadManager.getCacheStats();
console.log(stats);
// {
//   totalVideos: 5,
//   readyVideos: 4,
//   preloadingVideos: 1,
//   failedVideos: 0,
//   cacheSize: "45.2 MB"
// }
```

##### `clearVideo(url: string): void`
Remove specific video from cache.

##### `clearAllVideos(): void`
Clear entire video cache.

##### `retryPreload(url: string): Promise<boolean>`
Retry preloading a failed video.

##### `getVideoDuration(url: string): number`
Get video duration in seconds (returns 0 if not ready).

##### `logCacheStats(): void`
Log detailed cache statistics to console.

## Configuration

### Constants (in videoPreloadManager.ts)

```typescript
/** Maximum cache size (100MB) */
private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024;

/** Preload timeout (30 seconds) */
private readonly PRELOAD_TIMEOUT = 30000;

/** Cache cleanup interval (5 minutes) */
private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

/** Maximum age for cached videos (30 minutes) */
private readonly MAX_CACHE_AGE = 30 * 60 * 1000;
```

You can modify these values in the `VideoPreloadManager` class constructor if needed.

## Logging

### Log Levels

- **Info** (`logger.info`): Major operations (preload start, complete)
- **Debug** (`logger.debug`): Detailed state changes
- **Success** (`logger.success`): Successful operations
- **Warn** (`logger.warn`): Timeouts, skipped videos
- **Error** (`logger.error`): Failed preloads, errors

### Example Log Output

```
🎬 VideoPreloadManager initialized
🎬 HomePage: Preloading 3 videos in background
🚀 Starting video preload: http://localhost:5000/api/files/abc123
📊 Video loadeddata: http://localhost:5000/api/files/abc123
✅ Video canplaythrough: http://localhost:5000/api/files/abc123
✅ Video preload complete: http://localhost:5000/api/files/abc123 (duration: 45.23s)
✅ HomePage: Video preload complete
📊 Video Cache Statistics: { totalVideos: 3, readyVideos: 3, preloadingVideos: 0, failedVideos: 0, cacheSize: "45.2 MB" }
```

## Summary

The **Video Preload Manager** provides a robust, production-ready solution for handling video playback in LED display environments. It ensures:

✅ **No buffering** - Videos only shown when fully ready  
✅ **No black frames** - Smooth, instant playback  
✅ **Automatic management** - Preloading, caching, cleanup all handled  
✅ **Error resilience** - Graceful handling of failures  
✅ **Easy debugging** - Comprehensive logging and stats  

This system is essential for professional LED displays where any playback interruption is unacceptable.

