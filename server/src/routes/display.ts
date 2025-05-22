import { Router } from "express";
import { AppDataSource } from "../config/database";
import { Display } from "../models/Display";
import { User } from "../models/User";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();
const displayRepository = AppDataSource.getRepository(Display);

// Get all displays
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const displays = await displayRepository.find({
            where: { createdBy: { id: (req.user as User).id } }
        });

        res.json(displays);
    } catch (error) {
        logger.error(`Get displays error: ${error}`);
        res.status(500).json({ message: "Error fetching displays" });
    }
});

// Get single display
router.get("/:id", isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });

        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }

        // Check if user owns the display
        if (display.createdBy.id !== (req.user as User).id) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(display);
    } catch (error) {
        logger.error(`Get display error: ${error}`);
        res.status(500).json({ message: "Error fetching display" });
    }
});

// Create display
router.post("/", isAuthenticated, async (req, res) => {
    try {
        const { name, description, type, content, settings } = req.body;

        const display = displayRepository.create({
            name,
            description,
            type,
            content,
            settings,
            createdBy: req.user as User
        });

        await displayRepository.save(display);
        res.status(201).json(display);
    } catch (error) {
        logger.error(`Create display error: ${error}`);
        res.status(500).json({ message: "Error creating display" });
    }
});

// Update display
router.put("/:id", isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });

        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }

        // Check if user owns the display
        if (display.createdBy.id !== (req.user as User).id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, description, type, content, settings } = req.body;
        Object.assign(display, {
            name,
            description,
            type,
            content,
            settings,
            updatedBy: req.user as User
        });

        await displayRepository.save(display);
        res.json(display);
    } catch (error) {
        logger.error(`Update display error: ${error}`);
        res.status(500).json({ message: "Error updating display" });
    }
});

// Delete display
router.delete("/:id", isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });

        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }

        // Check if user owns the display
        if (display.createdBy.id !== (req.user as User).id) {
            return res.status(403).json({ message: "Access denied" });
        }

        await displayRepository.remove(display);
        res.json({ message: "Display deleted successfully" });
    } catch (error) {
        logger.error(`Delete display error: ${error}`);
        res.status(500).json({ message: "Error deleting display" });
    }
});

export default router; 