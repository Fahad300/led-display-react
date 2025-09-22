import express from "express";
import multer from "multer";
import { FileService } from "../services/fileService";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";
import { User } from "../models/User";

const router = express.Router();

// Multer setup for memory storage (no disk storage needed)
const upload = multer({
    storage: multer.memoryStorage(),
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
        } else {
            cb(new Error("Only image, video, PDF, and Office files (Excel, PowerPoint, Word) are allowed"));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size should be less than 100MB" });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

// Test endpoint to verify URL construction
router.get("/test/url", (req, res) => {
    try {
        const backendUrl = process.env.SERVER_URL || "http://localhost:5000";
        const testFileId = "test-123";
        const testUrl = `${backendUrl}/api/files/${testFileId}`;

        logger.info("URL test endpoint called");
        logger.info(`Environment variables: SERVER_URL=${process.env.SERVER_URL}`);
        logger.info(`Constructed URL: ${testUrl}`);

        res.json({
            message: "URL construction test",
            environment: {
                SERVER_URL: process.env.SERVER_URL,
                NODE_ENV: process.env.NODE_ENV
            },
            constructed: {
                backendUrl,
                testFileId,
                testUrl
            }
        });
    } catch (error) {
        logger.error("Error in URL test endpoint:", error);
        res.status(500).json({ error: "Failed to test URL construction" });
    }
});

// Upload file to database
router.post("/upload", isAuthenticated, upload.single("file"), handleMulterError, async (req: express.Request, res: express.Response) => {
    try {
        if (!req.file) {
            logger.warn("File upload attempt without file");
            return res.status(400).json({ error: "No file uploaded" });
        }

        if (!req.user) {
            logger.warn("File upload attempt without authentication");
            return res.status(401).json({ error: "User not authenticated" });
        }

        const { buffer, originalname, mimetype, size } = req.file;
        const description = req.body.description;

        logger.info(`File upload attempt: ${originalname} (${mimetype}, ${size} bytes) by user ${(req.user as User).username}`);

        // Upload file to database
        const file = await FileService.uploadFile(
            buffer,
            originalname,
            mimetype,
            req.user as User,
            description
        );

        logger.info(`File uploaded successfully: ${file.filename} (${file.size} bytes) by user ${(req.user as User).username}`);

        res.json({
            url: file.getUrl(),
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType
        });

    } catch (error) {
        logger.error("Error in file upload endpoint:", error);
        if (error instanceof Error) {
            logger.error(`Error details: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Serve file from file system
router.get("/:id", async (req, res) => {
    try {
        const fileId = req.params.id;
        logger.info(`File serving request from file system: ${fileId}`);

        const fileData = await FileService.getFileBuffer(fileId);

        if (!fileData) {
            logger.warn(`File not found: ${fileId}`);
            return res.status(404).json({ error: "File not found" });
        }

        logger.info(`File served successfully from file system: ${fileData.filename} (${fileData.buffer.length} bytes), MIME: ${fileData.mimeType}`);

        // Set appropriate headers
        res.setHeader("Content-Type", fileData.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${fileData.filename}"`);
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS for file serving

        // Send file buffer
        res.send(fileData.buffer);

    } catch (error) {
        logger.error("Error serving file from file system:", error);
        if (error instanceof Error) {
            logger.error(`Error details: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        res.status(500).json({ error: "Failed to serve file from file system" });
    }
});


// Special endpoint for PDF viewing (prevents download popups)
router.get("/:id/view", async (req, res) => {
    try {
        const fileId = req.params.id;
        logger.info(`PDF view request: ${fileId}`);

        const fileData = await FileService.getFileBuffer(fileId);

        if (!fileData) {
            logger.warn(`File not found: ${fileId}`);
            return res.status(404).json({ error: "File not found" });
        }

        // Only allow PDF files for this endpoint
        if (fileData.mimeType !== "application/pdf") {
            return res.status(400).json({ error: "This endpoint only serves PDF files" });
        }

        logger.info(`PDF view served successfully: ${fileData.filename} (${fileData.buffer.length} bytes)`);

        // Set headers specifically for PDF viewing to prevent downloads
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");

        // Send file buffer
        res.send(fileData.buffer);

    } catch (error) {
        logger.error("Error serving PDF view:", error);
        if (error instanceof Error) {
            logger.error(`Error details: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        res.status(500).json({ error: "Failed to serve PDF view" });
    }
});

// Get file info
router.get("/:id/info", isAuthenticated, async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await FileService.getFileById(fileId);

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

    } catch (error) {
        logger.error("Error getting file info:", error);
        res.status(500).json({ error: "Failed to get file info" });
    }
});

// Delete file from database
router.delete("/:id", isAuthenticated, async (req: express.Request, res: express.Response) => {
    try {
        const fileId = req.params.id;
        const success = await FileService.deleteFile(fileId);

        if (success) {
            logger.info(`File deleted from database: ${fileId} by user ${(req.user as User)?.username}`);
            res.json({ message: "File deleted successfully" });
        } else {
            res.status(404).json({ error: "File not found" });
        }

    } catch (error) {
        logger.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

// Get all files (with pagination)
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await FileService.getAllFiles(page, limit);

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

    } catch (error) {
        logger.error("Error getting all files:", error);
        res.status(500).json({ error: "Failed to get files" });
    }
});

// Get files by user
router.get("/user/:userId", isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const files = await FileService.getFilesByUser(userId);

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

    } catch (error) {
        logger.error("Error getting files by user:", error);
        res.status(500).json({ error: "Failed to get user files" });
    }
});

// Cleanup unused files (admin only)
router.post("/cleanup", isAuthenticated, async (req: express.Request, res: express.Response) => {
    try {
        // Check if user is admin (using username instead of role)
        if ((req.user as User)?.username !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const deletedCount = await FileService.cleanupUnusedFiles();

        res.json({
            message: `Cleaned up ${deletedCount} unused files`,
            deletedCount
        });

    } catch (error) {
        logger.error("Error cleaning up files:", error);
        res.status(500).json({ error: "Failed to cleanup files" });
    }
});

export default router; 