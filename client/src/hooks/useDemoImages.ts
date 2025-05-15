import { useState, useEffect } from 'react';
import { createDemoImageSet } from '../utils/createDemoImages';

interface DemoImage {
    name: string;
    url: string;
}

/**
 * Hook to generate and manage demo images
 * @param count Number of demo images to generate
 * @returns Array of demo images with name and URL
 */
const useDemoImages = (count: number = 4): DemoImage[] => {
    const [images, setImages] = useState<DemoImage[]>([]);

    useEffect(() => {
        // Generate demo images on mount
        const demoImageSet = createDemoImageSet(count);

        // Extract name and URL
        const imageData = demoImageSet.map(img => ({
            name: img.name,
            url: img.url
        }));

        setImages(imageData);
    }, [count]);

    return images;
};

export default useDemoImages; 