"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
/**
 * Utility class for managing files in the uploads directory
 */
class FileManager {
    /**
     * Purges unused files from the uploads directory
     * @param usedFileUrls Array of file URLs that are currently in use
     */
    static async purgeUnusedFiles(usedFileUrls) {
        try {
            // Ensure upload directory exists
            if (!fs_1.default.existsSync(this.uploadDir)) {
                logger_1.logger.info("Upload directory does not exist, nothing to purge");
                return;
            }
            // Get all files in the upload directory
            const files = fs_1.default.readdirSync(this.uploadDir);
            // Convert used URLs to filenames
            const usedFilenames = usedFileUrls.map(url => {
                const urlPath = new URL(url).pathname;
                return path_1.default.basename(urlPath);
            });
            // Delete unused files
            for (const file of files) {
                if (!usedFilenames.includes(file)) {
                    const filePath = path_1.default.join(this.uploadDir, file);
                    try {
                        fs_1.default.unlinkSync(filePath);
                        logger_1.logger.info(`Deleted unused file: ${file}`);
                    }
                    catch (error) {
                        logger_1.logger.error(`Error deleting file ${file}:`, error);
                    }
                }
            }
            logger_1.logger.info("File purge completed successfully");
        }
        catch (error) {
            logger_1.logger.error("Error during file purge:", error);
            throw error;
        }
    }
    /**
     * Purges all files from the uploads directory
     */
    static async purgeAllFiles() {
        try {
            // Ensure upload directory exists
            if (!fs_1.default.existsSync(this.uploadDir)) {
                logger_1.logger.info("Upload directory does not exist, nothing to purge");
                return;
            }
            // Get all files in the upload directory
            const files = fs_1.default.readdirSync(this.uploadDir);
            // Delete all files
            for (const file of files) {
                const filePath = path_1.default.join(this.uploadDir, file);
                try {
                    fs_1.default.unlinkSync(filePath);
                    logger_1.logger.info(`Deleted file: ${file}`);
                }
                catch (error) {
                    logger_1.logger.error(`Error deleting file ${file}:`, error);
                }
            }
            logger_1.logger.info("All files purged successfully");
        }
        catch (error) {
            logger_1.logger.error("Error during file purge:", error);
            throw error;
        }
    }
    /**
     * Gets the total size of the uploads directory
     * @returns Total size in bytes
     */
    static getUploadsSize() {
        try {
            if (!fs_1.default.existsSync(this.uploadDir)) {
                return 0;
            }
            const files = fs_1.default.readdirSync(this.uploadDir);
            return files.reduce((total, file) => {
                const filePath = path_1.default.join(this.uploadDir, file);
                const stats = fs_1.default.statSync(filePath);
                return total + stats.size;
            }, 0);
        }
        catch (error) {
            logger_1.logger.error("Error getting uploads size:", error);
            return 0;
        }
    }
    /**
     * Gets the number of files in the uploads directory
     * @returns Number of files
     */
    static getFileCount() {
        try {
            if (!fs_1.default.existsSync(this.uploadDir)) {
                return 0;
            }
            return fs_1.default.readdirSync(this.uploadDir).length;
        }
        catch (error) {
            logger_1.logger.error("Error getting file count:", error);
            return 0;
        }
    }
    /**
     * Gets all files in the uploads directory with their metadata
     * @returns Array of file objects with metadata
     */
    static getFiles() {
        try {
            if (!fs_1.default.existsSync(this.uploadDir)) {
                return [];
            }
            const files = fs_1.default.readdirSync(this.uploadDir);
            return files.map(file => {
                const filePath = path_1.default.join(this.uploadDir, file);
                const stats = fs_1.default.statSync(filePath);
                const mimeType = this.getMimeType(file);
                const url = `${this.backendUrl}/uploads/${file}`;
                return {
                    name: file,
                    url,
                    size: stats.size,
                    type: mimeType,
                    lastModified: stats.mtime.toISOString()
                };
            });
        }
        catch (error) {
            logger_1.logger.error("Error getting files:", error);
            return [];
        }
    }
    /**
     * Deletes specific files from the uploads directory
     * @param filenames Array of filenames to delete
     */
    static async deleteFiles(filenames) {
        try {
            if (!fs_1.default.existsSync(this.uploadDir)) {
                logger_1.logger.info("Upload directory does not exist, nothing to delete");
                return;
            }
            for (const filename of filenames) {
                const filePath = path_1.default.join(this.uploadDir, filename);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    logger_1.logger.info(`Deleted file: ${filename}`);
                }
                else {
                    logger_1.logger.warn(`File not found: ${filename}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.error("Error deleting files:", error);
            throw error;
        }
    }
    /**
     * Gets the MIME type of a file based on its extension
     * @param filename The filename to get the MIME type for
     * @returns The MIME type string
     */
    static getMimeType(filename) {
        const ext = path_1.default.extname(filename).toLowerCase();
        const mimeTypes = {
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
exports.FileManager = FileManager;
FileManager.uploadDir = path_1.default.join(__dirname, "../../uploads");
FileManager.backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
