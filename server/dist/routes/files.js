"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fileService_1 = require("../services/fileService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Multer setup for memory storage (no disk storage needed)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "image/",
            "video/",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "application/vnd.ms-powerpoint", // .ppt
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        ];
        const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime);
        if (isAllowed) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image, video, PDF, and Office files (Excel, PowerPoint, Word) are allowed"));
        }
    }
});
// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size should be less than 100MB" });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};
// Upload file to database
router.post("/upload", auth_1.isAuthenticated, upload.single("file"), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { buffer, originalname, mimetype } = req.file;
        const description = req.body.description;
        // Upload file to database
        const file = await fileService_1.FileService.uploadFile(buffer, originalname, mimetype, req.user, description);
        logger_1.logger.info(`File uploaded to database: ${file.filename} by user ${req.user.username}`);
        res.json({
            url: file.getUrl(),
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType
        });
    }
    catch (error) {
        logger_1.logger.error("Error in file upload endpoint:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
// Serve file from database
router.get("/:id", async (req, res) => {
    try {
        const fileId = req.params.id;
        const fileData = await fileService_1.FileService.getFileBuffer(fileId);
        if (!fileData) {
            return res.status(404).json({ error: "File not found" });
        }
        // Set appropriate headers
        res.setHeader("Content-Type", fileData.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${fileData.filename}"`);
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
        // Send file buffer
        res.send(fileData.buffer);
    }
    catch (error) {
        logger_1.logger.error("Error serving file:", error);
        res.status(500).json({ error: "Failed to serve file" });
    }
});
// Get file info
router.get("/:id/info", auth_1.isAuthenticated, async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await fileService_1.FileService.getFileById(fileId);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        res.json({
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            description: file.description,
            url: file.getUrl(),
            uploadedBy: {
                id: file.uploadedBy.id,
                username: file.uploadedBy.username
            },
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting file info:", error);
        res.status(500).json({ error: "Failed to get file info" });
    }
});
// Delete file from database
router.delete("/:id", auth_1.isAuthenticated, async (req, res) => {
    try {
        const fileId = req.params.id;
        const success = await fileService_1.FileService.deleteFile(fileId);
        if (success) {
            logger_1.logger.info(`File deleted from database: ${fileId} by user ${req.user?.username}`);
            res.json({ message: "File deleted successfully" });
        }
        else {
            res.status(404).json({ error: "File not found" });
        }
    }
    catch (error) {
        logger_1.logger.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});
// Get all files (with pagination)
router.get("/", auth_1.isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await fileService_1.FileService.getAllFiles(page, limit);
        res.json({
            files: result.files.map(file => ({
                id: file.id,
                filename: file.filename,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
                description: file.description,
                url: file.getUrl(),
                uploadedBy: {
                    id: file.uploadedBy.id,
                    username: file.uploadedBy.username
                },
                createdAt: file.createdAt
            })),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting all files:", error);
        res.status(500).json({ error: "Failed to get files" });
    }
});
// Get files by user
router.get("/user/:userId", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const files = await fileService_1.FileService.getFilesByUser(userId);
        res.json({
            files: files.map(file => ({
                id: file.id,
                filename: file.filename,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
                description: file.description,
                url: file.getUrl(),
                createdAt: file.createdAt
            }))
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting files by user:", error);
        res.status(500).json({ error: "Failed to get user files" });
    }
});
// Cleanup unused files (admin only)
router.post("/cleanup", auth_1.isAuthenticated, async (req, res) => {
    try {
        // Check if user is admin (using username instead of role)
        if (req.user?.username !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        const deletedCount = await fileService_1.FileService.cleanupUnusedFiles();
        res.json({
            message: `Cleaned up ${deletedCount} unused files`,
            deletedCount
        });
    }
    catch (error) {
        logger_1.logger.error("Error cleaning up files:", error);
        res.status(500).json({ error: "Failed to cleanup files" });
    }
});
exports.default = router;
