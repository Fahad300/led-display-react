import { AppDataSource } from "../config/database";
import { File } from "../models/File";
import { User } from "../models/User";
import { logger } from "../utils/logger";

/**
 * Service for handling file operations in the database
 */
export class FileService {
    private static fileRepository = AppDataSource.getRepository(File);

    /**
     * Upload a file to the database
     */
    static async uploadFile(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        uploadedBy: User,
        description?: string
    ): Promise<File> {
        try {
            // Convert buffer to base64
            const base64Data = buffer.toString('base64');

            // Generate unique filename
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + "." + originalName.split('.').pop();

            // Create file record
            const file = new File();
            file.filename = filename;
            file.originalName = originalName;
            file.mimeType = mimeType;
            file.data = base64Data;
            file.size = buffer.length;
            file.description = description;
            file.uploadedBy = uploadedBy;

            // Save to database
            const savedFile = await this.fileRepository.save(file);

            logger.info(`File uploaded to database: ${savedFile.filename} (${savedFile.size} bytes)`);
            return savedFile;

        } catch (error) {
            logger.error("Error uploading file to database:", error);
            throw new Error("Failed to upload file to database");
        }
    }

    /**
     * Get file by ID
     */
    static async getFileById(id: string): Promise<File | null> {
        try {
            return await this.fileRepository.findOne({
                where: { id },
                relations: ["uploadedBy"]
            });
        } catch (error) {
            logger.error("Error getting file by ID:", error);
            return null;
        }
    }

    /**
     * Get file buffer from database
     */
    static async getFileBuffer(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
        try {
            const file = await this.getFileById(id);
            if (!file) {
                return null;
            }

            // Convert base64 back to buffer
            const buffer = Buffer.from(file.data, 'base64');

            return {
                buffer,
                mimeType: file.mimeType,
                filename: file.originalName
            };
        } catch (error) {
            logger.error("Error getting file buffer:", error);
            return null;
        }
    }

    /**
     * Delete file from database
     */
    static async deleteFile(id: string): Promise<boolean> {
        try {
            const result = await this.fileRepository.delete(id);
            if (result.affected && result.affected > 0) {
                logger.info(`File deleted from database: ${id}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error("Error deleting file from database:", error);
            return false;
        }
    }

    /**
     * Get all files uploaded by a user
     */
    static async getFilesByUser(userId: string): Promise<File[]> {
        try {
            return await this.fileRepository.find({
                where: { uploadedBy: { id: userId } },
                relations: ["uploadedBy"],
                order: { createdAt: "DESC" }
            });
        } catch (error) {
            logger.error("Error getting files by user:", error);
            return [];
        }
    }

    /**
     * Get all files with pagination
     */
    static async getAllFiles(page: number = 1, limit: number = 20): Promise<{ files: File[]; total: number }> {
        try {
            const [files, total] = await this.fileRepository.findAndCount({
                relations: ["uploadedBy"],
                order: { createdAt: "DESC" },
                skip: (page - 1) * limit,
                take: limit
            });

            return { files, total };
        } catch (error) {
            logger.error("Error getting all files:", error);
            return { files: [], total: 0 };
        }
    }

    /**
     * Clean up unused files (files not referenced in any display)
     */
    static async cleanupUnusedFiles(): Promise<number> {
        try {
            // Get all files
            const allFiles = await this.fileRepository.find();
            let deletedCount = 0;

            for (const file of allFiles) {
                // Check if file is used in any display
                const isUsed = await this.isFileUsedInDisplays(file.id);

                if (!isUsed) {
                    await this.deleteFile(file.id);
                    deletedCount++;
                }
            }

            logger.info(`Cleaned up ${deletedCount} unused files`);
            return deletedCount;
        } catch (error) {
            logger.error("Error cleaning up unused files:", error);
            return 0;
        }
    }

    /**
     * Check if a file is used in any display
     */
    private static async isFileUsedInDisplays(fileId: string): Promise<boolean> {
        try {
            const file = await this.getFileById(fileId);
            if (!file) return false;

            const displayRepository = AppDataSource.getRepository(require("../models/Display").Display);
            const displays = await displayRepository.find();

            // Check if file URL is referenced in any display content
            const fileUrl = file.getUrl();

            for (const display of displays) {
                if (display.content.images?.includes(fileUrl) ||
                    display.content.videos?.includes(fileUrl)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error("Error checking if file is used:", error);
            return false;
        }
    }
} 