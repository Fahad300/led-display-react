import { AppDataSource } from "../config/database";
import { File } from "../models/File";
import { User } from "../models/User";
import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

/**
 * Service for handling file operations in the database
 */
export class FileService {
    private static fileRepository = AppDataSource.getRepository(File);
    private static uploadsDir = path.join(__dirname, "../../uploads");

    /**
     * Ensure uploads directory exists
     */
    private static ensureUploadsDir(): void {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            logger.info(`Created uploads directory: ${this.uploadsDir}`);
        }
    }

    /**
     * Upload a file to both database and file system
     */
    static async uploadFile(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        uploadedBy: User,
        description?: string
    ): Promise<File> {
        try {
            // Ensure uploads directory exists
            this.ensureUploadsDir();

            // No longer storing in database as Base64

            // Generate unique filename
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const extension = originalName.split('.').pop() || '';
            const filename = `${uniqueSuffix}.${extension}`;

            // Save to file system
            const filePath = path.join(this.uploadsDir, filename);
            fs.writeFileSync(filePath, buffer);

            // Create file record
            const file = new File();
            file.filename = filename;
            file.originalName = originalName;
            file.mimeType = mimeType;
            file.filePath = filePath; // File system path
            file.size = buffer.length;
            file.description = description;
            file.uploadedBy = uploadedBy;

            // Save to database
            const savedFile = await this.fileRepository.save(file);

            logger.info(`File uploaded successfully: ${savedFile.filename} (${savedFile.size} bytes) - FileSystem: ✓`);
            return savedFile;

        } catch (error) {
            logger.error("Error uploading file:", error);
            throw new Error("Failed to upload file");
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
     * Get file buffer from file system
     */
    static async getFileBuffer(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
        try {
            const file = await this.getFileById(id);
            if (!file) {
                return null;
            }

            // Read file from file system
            if (!file.filePath) {
                return null;
            }
            const buffer = fs.readFileSync(file.filePath);

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
     * Delete file from file system and database
     */
    static async deleteFile(id: string): Promise<boolean> {
        try {
            // Get file info before deleting
            const file = await this.getFileById(id);

            // Delete from database
            const result = await this.fileRepository.delete(id);
            if (result.affected && result.affected > 0) {
                // Delete from file system if path exists
                if (file?.filePath && fs.existsSync(file.filePath)) {
                    try {
                        fs.unlinkSync(file.filePath);
                        logger.info(`File deleted from file system: ${file.filePath}`);
                    } catch (fsError) {
                        logger.warn(`Failed to delete file from file system: ${file.filePath}`, fsError);
                    }
                }

                logger.info(`File deleted from database: ${id}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error("Error deleting file:", error);
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
     * Check if a file is used in any display (legacy method - no longer needed)
     */
    private static async isFileUsedInDisplays(fileId: string): Promise<boolean> {
        // Since we removed the Display model, files are not used in displays anymore
        // This method is kept for compatibility but always returns false
        return false;
    }
} 