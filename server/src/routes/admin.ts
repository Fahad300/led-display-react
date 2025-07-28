import express from "express";
import { FileManager } from "../utils/fileManager";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";
import { Employee } from "../models/Employee";
import { AppDataSource } from "../config/database";

const router = express.Router();

/**
 * @route GET /api/admin/uploads/stats
 * @desc Get uploads directory statistics
 * @access Private
 */
router.get("/uploads/stats", isAuthenticated, async (req, res) => {
    try {
        const size = FileManager.getUploadsSize();
        const count = FileManager.getFileCount();
        const files = FileManager.getFiles();

        res.json({
            totalSize: size,
            fileCount: count,
            sizeInMB: (size / (1024 * 1024)).toFixed(2),
            files
        });
    } catch (error) {
        logger.error("Error getting upload stats:", error);
        res.status(500).json({ error: "Failed to get upload statistics" });
    }
});

/**
 * @route POST /api/admin/uploads/purge
 * @desc Purge unused files from uploads directory
 * @access Private
 */
router.post("/uploads/purge", isAuthenticated, async (req, res) => {
    try {
        const { usedFileUrls } = req.body;

        if (!Array.isArray(usedFileUrls)) {
            return res.status(400).json({ error: "usedFileUrls must be an array" });
        }

        await FileManager.purgeUnusedFiles(usedFileUrls);

        // Get updated stats after purge
        const size = FileManager.getUploadsSize();
        const count = FileManager.getFileCount();

        res.json({
            message: "Unused files purged successfully",
            stats: {
                totalSize: size,
                fileCount: count,
                sizeInMB: (size / (1024 * 1024)).toFixed(2)
            }
        });
    } catch (error) {
        logger.error("Error purging files:", error);
        res.status(500).json({ error: "Failed to purge unused files" });
    }
});

/**
 * @route POST /api/admin/uploads/purge-all
 * @desc Purge all files from uploads directory
 * @access Private
 */
router.post("/uploads/purge-all", isAuthenticated, async (req, res) => {
    try {
        await FileManager.purgeAllFiles();

        res.json({
            message: "All files purged successfully",
            stats: {
                totalSize: 0,
                fileCount: 0,
                sizeInMB: "0.00"
            }
        });
    } catch (error) {
        logger.error("Error purging all files:", error);
        res.status(500).json({ error: "Failed to purge all files" });
    }
});

/**
 * @route POST /api/admin/uploads/delete
 * @desc Delete specific files from uploads directory
 * @access Private
 */
router.post("/uploads/delete", isAuthenticated, async (req, res) => {
    try {
        const { files } = req.body;

        if (!Array.isArray(files)) {
            return res.status(400).json({ error: "files must be an array" });
        }

        await FileManager.deleteFiles(files);

        // Get updated stats after deletion
        const size = FileManager.getUploadsSize();
        const count = FileManager.getFileCount();

        res.json({
            message: "Files deleted successfully",
            stats: {
                totalSize: size,
                fileCount: count,
                sizeInMB: (size / (1024 * 1024)).toFixed(2)
            }
        });
    } catch (error) {
        logger.error("Error deleting files:", error);
        res.status(500).json({ error: "Failed to delete files" });
    }
});

// GET /api/employees/today - Employees with birthday or anniversary today
router.get("/api/employees/today", async (req, res) => {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employees = await employeeRepo.find({
            where: [
                { isBirthday: true },
                { isAnniversary: true }
            ]
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: (error instanceof Error) ? error.message : "Unknown error" });
    }
});

export default router; 