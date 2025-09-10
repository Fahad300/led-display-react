/**
 * Utility to create demo images programmatically
 * This can be used to generate sample images if none are available
 */

/**
 * Create a simple demo image with text
 * @param text Text to display on the image
 * @param width Image width
 * @param height Image height
 * @param bgColor Background color (hex without #)
 * @param textColor Text color (hex without #)
 * @returns Data URL for the image
 */
export const createDemoImage = (
    text: string,
    width = 800,
    height = 400,
    bgColor = '134D67',
    textColor = 'FFFFFF'
): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Canvas 2D context not available');
        return '';
    }

    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = `#${bgColor}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw text
    ctx.fillStyle = `#${textColor}`;
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handle multiline text
    const lines = text.split('\n');
    const lineHeight = 40;
    const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    return canvas.toDataURL('image/png');
};

/**
 * Create a set of demo images for the application
 * @param count Number of images to create
 * @returns Array of {url, blob} objects
 */
export const createDemoImageSet = (count: number = 4): Array<{ name: string, url: string, blob: Blob }> => {
    const colors = [
        { bg: '134D67', text: 'FFFFFF' }, // Blue
        { bg: '15CC93', text: '134D67' }, // Teal
        { bg: '434D59', text: 'FFFFFF' }, // Slate
        { bg: '8CE6C9', text: '134D67' }, // Light Teal
        { bg: '2D343C', text: 'FFFFFF' }  // Dark Slate
    ];

    const images = [];

    for (let i = 0; i < count; i++) {
        const colorIndex = i % colors.length;
        const { bg, text } = colors[colorIndex];
        const name = `Sample ${i + 1}`;

        const dataUrl = createDemoImage(
            `Sample Image ${i + 1}\nLED Display Demo`,
            800,
            400,
            bg,
            text
        );

        // Convert data URL to blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let j = 0; j < byteString.length; j++) {
            uint8Array[j] = byteString.charCodeAt(j);
        }

        const blob = new Blob([arrayBuffer], { type: mimeType });

        images.push({
            name,
            url: dataUrl,
            blob
        });
    }

    return images;
};

/**
 * Save a demo image set to the file system
 * Note: This can only be used in a Node.js environment, not in the browser
 * @param images Array of image objects
 * @param directory Directory to save images to
 */
export const saveDemoImageSet = async (
    images: Array<{ name: string, blob: Blob }>,
    directory: string
): Promise<void> => {
    // This function would require Node.js File System API
    // It's included for completeness but won't work in a browser environment
    // Note: saveDemoImageSet can only be used in a Node.js environment

    /* Example implementation for Node.js:
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    for (let i = 0; i < images.length; i++) {
      const { name, blob } = images[i];
      const filePath = path.join(directory, `sample${i + 1}.png`);
      
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      
      // Saved image to file
    }
    */
}; 