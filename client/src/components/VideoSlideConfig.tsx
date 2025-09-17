import React, { useState, useEffect } from 'react';
import { VideoSlide as VideoSlideType } from '../types';

interface VideoSlideConfigProps {
    slide: VideoSlideType;
    onUpdate: (slide: VideoSlideType) => void;
}

/**
 * VideoSlideConfig Component
 * Provides configuration options for video slides to prevent common issues
 */
export const VideoSlideConfig: React.FC<VideoSlideConfigProps> = ({ slide, onUpdate }) => {
    const [testResults, setTestResults] = useState<{
        loading: boolean;
        error: string | null;
        duration: number | null;
        canPlay: boolean;
    }>({
        loading: false,
        error: null,
        duration: null,
        canPlay: false
    });

    const testVideo = async () => {
        if (!slide.data.videoUrl) {
            setTestResults({
                loading: false,
                error: 'No video URL provided',
                duration: null,
                canPlay: false
            });
            return;
        }

        setTestResults(prev => ({ ...prev, loading: true, error: null }));

        try {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';

            const testPromise = new Promise<{ duration: number; canPlay: boolean }>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Video test timeout'));
                }, 10000);

                video.addEventListener('loadedmetadata', () => {
                    clearTimeout(timeout);
                    resolve({
                        duration: video.duration,
                        canPlay: true
                    });
                });

                video.addEventListener('error', () => {
                    clearTimeout(timeout);
                    reject(new Error('Video failed to load'));
                });

                video.src = slide.data.videoUrl;
                video.load();
            });

            const result = await testPromise;
            setTestResults({
                loading: false,
                error: null,
                duration: result.duration,
                canPlay: result.canPlay
            });
        } catch (error) {
            setTestResults({
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: null,
                canPlay: false
            });
        }
    };

    useEffect(() => {
        if (slide.data.videoUrl) {
            testVideo();
        }
    }, [slide.data.videoUrl]);

    const formatDuration = (seconds: number | null): string => {
        if (!seconds || !isFinite(seconds)) return 'Unknown';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRecommendedDuration = (): number => {
        if (testResults.duration) {
            // Add 2 seconds buffer to video duration
            return Math.ceil(testResults.duration) + 2;
        }
        return 30; // Default fallback
    };

    const handleDurationUpdate = () => {
        const recommendedDuration = getRecommendedDuration();
        onUpdate({
            ...slide,
            duration: recommendedDuration
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Video Configuration</h4>
                <p className="text-sm text-blue-700 mb-3">
                    Proper video configuration helps prevent slideshow issues and ensures smooth playback.
                </p>

                {/* Video Test Results */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Video Status:</span>
                        <button
                            onClick={testVideo}
                            disabled={testResults.loading || !slide.data.videoUrl}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testResults.loading ? 'Testing...' : 'Test Video'}
                        </button>
                    </div>

                    {testResults.loading && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Testing video...</span>
                        </div>
                    )}

                    {testResults.error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                            <strong>Error:</strong> {testResults.error}
                        </div>
                    )}

                    {testResults.canPlay && testResults.duration && (
                        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                            <div><strong>Status:</strong> Video loaded successfully</div>
                            <div><strong>Duration:</strong> {formatDuration(testResults.duration)}</div>
                        </div>
                    )}
                </div>

                {/* Duration Configuration */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Slide Duration (seconds)
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            min="5"
                            max="300"
                            value={slide.duration || 30}
                            onChange={(e) => onUpdate({
                                ...slide,
                                duration: Math.max(5, parseInt(e.target.value) || 30)
                            })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        {testResults.duration && (
                            <button
                                onClick={handleDurationUpdate}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Auto ({getRecommendedDuration()}s)
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Recommended: {getRecommendedDuration()} seconds (video duration + 2s buffer)
                    </p>
                </div>
            </div>

            {/* Video Settings */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Autoplay</label>
                    <input
                        type="checkbox"
                        checked={slide.data.autoplay}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: { ...slide.data, autoplay: e.target.checked }
                        })}
                        className="rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Loop</label>
                    <input
                        type="checkbox"
                        checked={slide.data.loop}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: { ...slide.data, loop: e.target.checked }
                        })}
                        className="rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Muted</label>
                    <input
                        type="checkbox"
                        checked={slide.data.muted}
                        onChange={(e) => onUpdate({
                            ...slide,
                            data: { ...slide.data, muted: e.target.checked }
                        })}
                        className="rounded"
                    />
                </div>
            </div>

            {/* Best Practices */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h5 className="font-semibold text-yellow-900 mb-2">Best Practices</h5>
                <ul className="text-xs text-yellow-800 space-y-1">
                    <li>• Use MP4 format for best compatibility</li>
                    <li>• Keep video files under 50MB for faster loading</li>
                    <li>• Set duration to video length + 2-5 seconds buffer</li>
                    <li>• Always enable muted for autoplay to work</li>
                    <li>• Test videos before adding to slideshow</li>
                </ul>
            </div>
        </div>
    );
};
