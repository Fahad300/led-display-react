"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileManager_1 = require("../utils/fileManager");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
/**
 * @route GET /api/admin/uploads/stats
 * @desc Get uploads directory statistics
 * @access Private
 */
router.get("/uploads/stats", auth_1.isAuthenticated, async (req, res) => {
    try {
        const size = fileManager_1.FileManager.getUploadsSize();
        const count = fileManager_1.FileManager.getFileCount();
        const files = fileManager_1.FileManager.getFiles();
        res.json({
            totalSize: size,
            fileCount: count,
            sizeInMB: (size / (1024 * 1024)).toFixed(2),
            files
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting upload stats:", error);
        res.status(500).json({ error: "Failed to get upload statistics" });
    }
});
/**
 * @route POST /api/admin/uploads/purge
 * @desc Purge unused files from uploads directory
 * @access Private
 */
router.post("/uploads/purge", auth_1.isAuthenticated, async (req, res) => {
    try {
        const { usedFileUrls } = req.body;
        if (!Array.isArray(usedFileUrls)) {
            return res.status(400).json({ error: "usedFileUrls must be an array" });
        }
        await fileManager_1.FileManager.purgeUnusedFiles(usedFileUrls);
        // Get updated stats after purge
        const size = fileManager_1.FileManager.getUploadsSize();
        const count = fileManager_1.FileManager.getFileCount();
        res.json({
            message: "Unused files purged successfully",
            stats: {
                totalSize: size,
                fileCount: count,
                sizeInMB: (size / (1024 * 1024)).toFixed(2)
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Error purging files:", error);
        res.status(500).json({ error: "Failed to purge unused files" });
    }
});
/**
 * @route POST /api/admin/uploads/purge-all
 * @desc Purge all files from uploads directory
 * @access Private
 */
router.post("/uploads/purge-all", auth_1.isAuthenticated, async (req, res) => {
    try {
        await fileManager_1.FileManager.purgeAllFiles();
        res.json({
            message: "All files purged successfully",
            stats: {
                totalSize: 0,
                fileCount: 0,
                sizeInMB: "0.00"
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Error purging all files:", error);
        res.status(500).json({ error: "Failed to purge all files" });
    }
});
/**
 * @route POST /api/admin/uploads/delete
 * @desc Delete specific files from uploads directory
 * @access Private
 */
router.post("/uploads/delete", auth_1.isAuthenticated, async (req, res) => {
    try {
        const { files } = req.body;
        if (!Array.isArray(files)) {
            return res.status(400).json({ error: "files must be an array" });
        }
        await fileManager_1.FileManager.deleteFiles(files);
        // Get updated stats after deletion
        const size = fileManager_1.FileManager.getUploadsSize();
        const count = fileManager_1.FileManager.getFileCount();
        res.json({
            message: "Files deleted successfully",
            stats: {
                totalSize: size,
                fileCount: count,
                sizeInMB: (size / (1024 * 1024)).toFixed(2)
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Error deleting files:", error);
        res.status(500).json({ error: "Failed to delete files" });
    }
});
exports.default = router;
