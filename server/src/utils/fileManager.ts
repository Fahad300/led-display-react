import fs from "fs";
import path from "path";
import { logger } from "./logger";

/**
 * Utility class for managing files in the uploads directory
 */
export class FileManager {
    private static uploadDir = path.join(__dirname, "../../uploads");

    /**
     * Purges unused files from the uploads directory
     * @param usedFileUrls Array of file URLs that are currently in use
     */
    public static async purgeUnusedFiles(usedFileUrls: string[]): Promise<void> {
        try {
            // Ensure upload directory exists
            if (!fs.existsSync(this.uploadDir)) {
                logger.info("Upload directory does not exist, nothing to purge");
                return;
            }

            // Get all files in the upload directory
            const files = fs.readdirSync(this.uploadDir);

            // Convert used URLs to filenames
            const usedFilenames = usedFileUrls.map(url => {
                const urlPath = new URL(url).pathname;
                return path.basename(urlPath);
            });

            // Delete unused files
            for (const file of files) {
                if (!usedFilenames.includes(file)) {
                    const filePath = path.join(this.uploadDir, file);
                    try {
                        fs.unlinkSync(filePath);
                        logger.info(`Deleted unused file: ${file}`);
                    } catch (error) {
                        logger.error(`Error deleting file ${file}:`, error);
                    }
                }
            }

            logger.info("File purge completed successfully");
        } catch (error) {
            logger.error("Error during file purge:", error);
            throw error;
        }
    }

    /**
     * Purges all files from the uploads directory
     */
    public static async purgeAllFiles(): Promise<void> {
        try {
            // Ensure upload directory exists
            if (!fs.existsSync(this.uploadDir)) {
                logger.info("Upload directory does not exist, nothing to purge");
                return;
            }

            // Get all files in the upload directory
            const files = fs.readdirSync(this.uploadDir);

            // Delete all files
            for (const file of files) {
                const filePath = path.join(this.uploadDir, file);
                try {
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted file: ${file}`);
                } catch (error) {
                    logger.error(`Error deleting file ${file}:`, error);
                }
            }

            logger.info("All files purged successfully");
        } catch (error) {
            logger.error("Error during file purge:", error);
            throw error;
        }
    }

    /**
     * Gets the total size of the uploads directory
     * @returns Total size in bytes
     */
    public static getUploadsSize(): number {
        try {
            if (!fs.existsSync(this.uploadDir)) {
                return 0;
            }

            const files = fs.readdirSync(this.uploadDir);
            return files.reduce((total, file) => {
                const filePath = path.join(this.uploadDir, file);
                const stats = fs.statSync(filePath);
                return total + stats.size;
            }, 0);
        } catch (error) {
            logger.error("Error getting uploads size:", error);
            return 0;
        }
    }

    /**
     * Gets the number of files in the uploads directory
     * @returns Number of files
     */
    public static getFileCount(): number {
        try {
            if (!fs.existsSync(this.uploadDir)) {
                return 0;
            }
            return fs.readdirSync(this.uploadDir).length;
        } catch (error) {
            logger.error("Error getting file count:", error);
            return 0;
        }
    }

    /**
     * Gets all files in the uploads directory with their metadata
     * @returns Array of file objects with metadata
     */
    public static getFiles(): Array<{
        name: string;
        url: string;
        size: number;
        type: string;
        lastModified: string;
    }> {
        try {
            if (!fs.existsSync(this.uploadDir)) {
                return [];
            }

            const files = fs.readdirSync(this.uploadDir);
            return files.map(file => {
                const filePath = path.join(this.uploadDir, file);
                const stats = fs.statSync(filePath);
                const mimeType = this.getMimeType(file);
                const url = `/uploads/${file}`;

                return {
                    name: file,
                    url,
                    size: stats.size,
                    type: mimeType,
                    lastModified: stats.mtime.toISOString()
                };
            });
        } catch (error) {
            logger.error("Error getting files:", error);
            return [];
        }
    }

    /**
     * Deletes specific files from the uploads directory
     * @param filenames Array of filenames to delete
     */
    public static async deleteFiles(filenames: string[]): Promise<void> {
        try {
            if (!fs.existsSync(this.uploadDir)) {
                logger.info("Upload directory does not exist, nothing to delete");
                return;
            }

            for (const filename of filenames) {
                const filePath = path.join(this.uploadDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted file: ${filename}`);
                } else {
                    logger.warn(`File not found: ${filename}`);
                }
            }
        } catch (error) {
            logger.error("Error deleting files:", error);
            throw error;
        }
    }

    /**
     * Gets the MIME type of a file based on its extension
     * @param filename The filename to get the MIME type for
     * @returns The MIME type string
     */
    private static getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/quicktime"
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
} 