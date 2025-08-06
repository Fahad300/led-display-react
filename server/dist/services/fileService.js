"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const database_1 = require("../config/database");
const File_1 = require("../models/File");
const logger_1 = require("../utils/logger");
/**
 * Service for handling file operations in the database
 */
class FileService {
    /**
     * Upload a file to the database
     */
    static async uploadFile(buffer, originalName, mimeType, uploadedBy, description) {
        try {
            // Convert buffer to base64
            const base64Data = buffer.toString('base64');
            // Generate unique filename
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + "." + originalName.split('.').pop();
            // Create file record
            const file = new File_1.File();
            file.filename = filename;
            file.originalName = originalName;
            file.mimeType = mimeType;
            file.data = base64Data;
            file.size = buffer.length;
            file.description = description;
            file.uploadedBy = uploadedBy;
            // Save to database
            const savedFile = await this.fileRepository.save(file);
            logger_1.logger.info(`File uploaded to database: ${savedFile.filename} (${savedFile.size} bytes)`);
            return savedFile;
        }
        catch (error) {
            logger_1.logger.error("Error uploading file to database:", error);
            throw new Error("Failed to upload file to database");
        }
    }
    /**
     * Get file by ID
     */
    static async getFileById(id) {
        try {
            return await this.fileRepository.findOne({
                where: { id },
                relations: ["uploadedBy"]
            });
        }
        catch (error) {
            logger_1.logger.error("Error getting file by ID:", error);
            return null;
        }
    }
    /**
     * Get file buffer from database
     */
    static async getFileBuffer(id) {
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
        }
        catch (error) {
            logger_1.logger.error("Error getting file buffer:", error);
            return null;
        }
    }
    /**
     * Delete file from database
     */
    static async deleteFile(id) {
        try {
            const result = await this.fileRepository.delete(id);
            if (result.affected && result.affected > 0) {
                logger_1.logger.info(`File deleted from database: ${id}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error("Error deleting file from database:", error);
            return false;
        }
    }
    /**
     * Get all files uploaded by a user
     */
    static async getFilesByUser(userId) {
        try {
            return await this.fileRepository.find({
                where: { uploadedBy: { id: userId } },
                relations: ["uploadedBy"],
                order: { createdAt: "DESC" }
            });
        }
        catch (error) {
            logger_1.logger.error("Error getting files by user:", error);
            return [];
        }
    }
    /**
     * Get all files with pagination
     */
    static async getAllFiles(page = 1, limit = 20) {
        try {
            const [files, total] = await this.fileRepository.findAndCount({
                relations: ["uploadedBy"],
                order: { createdAt: "DESC" },
                skip: (page - 1) * limit,
                take: limit
            });
            return { files, total };
        }
        catch (error) {
            logger_1.logger.error("Error getting all files:", error);
            return { files: [], total: 0 };
        }
    }
    /**
     * Clean up unused files (files not referenced in any display)
     */
    static async cleanupUnusedFiles() {
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
            logger_1.logger.info(`Cleaned up ${deletedCount} unused files`);
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error("Error cleaning up unused files:", error);
            return 0;
        }
    }
    /**
     * Check if a file is used in any display
     */
    static async isFileUsedInDisplays(fileId) {
        try {
            const file = await this.getFileById(fileId);
            if (!file)
                return false;
            const displayRepository = database_1.AppDataSource.getRepository(require("../models/Display").Display);
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
        }
        catch (error) {
            logger_1.logger.error("Error checking if file is used:", error);
            return false;
        }
    }
}
exports.FileService = FileService;
FileService.fileRepository = database_1.AppDataSource.getRepository(File_1.File);
