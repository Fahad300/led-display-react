import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing video playback with proper error handling
 * Prevents "play() request was interrupted by a call to pause()" errors
 */
export const useVideoPlayback = () => {
    const playPromiseRef = useRef<Promise<void> | null>(null);

    const safePlay = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
        try {
            // If there's already a play promise, wait for it to complete or reject
            if (playPromiseRef.current) {
                try {
                    await playPromiseRef.current;
                } catch (error) {
                    // Ignore previous play promise errors
                }
            }

            // Start new play promise
            playPromiseRef.current = videoElement.play();
            await playPromiseRef.current;
            playPromiseRef.current = null;
        } catch (error) {
            playPromiseRef.current = null;

            // Only log non-interruption errors
            if (error instanceof Error && !error.message.includes('interrupted')) {
                console.error("Video play error:", error);
            }

            throw error;
        }
    }, []);

    const safePause = useCallback((videoElement: HTMLVideoElement): void => {
        try {
            // Cancel any pending play promise
            if (playPromiseRef.current) {
                playPromiseRef.current = null;
            }

            videoElement.pause();
        } catch (error) {
            console.error("Video pause error:", error);
        }
    }, []);

    const safeTogglePlayPause = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
        if (videoElement.paused) {
            await safePlay(videoElement);
        } else {
            safePause(videoElement);
        }
    }, [safePlay, safePause]);

    return {
        safePlay,
        safePause,
        safeTogglePlayPause
    };
};
