"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Display_1 = require("../models/Display");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const displayRepository = database_1.AppDataSource.getRepository(Display_1.Display);
// Get all displays
router.get("/", auth_1.isAuthenticated, async (req, res) => {
    try {
        const displays = await displayRepository.find({
            where: { createdBy: { id: req.user.id } }
        });
        res.json(displays);
    }
    catch (error) {
        logger_1.logger.error(`Get displays error: ${error}`);
        res.status(500).json({ message: "Error fetching displays" });
    }
});
// Get single display
router.get("/:id", auth_1.isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });
        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }
        // Check if user owns the display
        if (display.createdBy.id !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.json(display);
    }
    catch (error) {
        logger_1.logger.error(`Get display error: ${error}`);
        res.status(500).json({ message: "Error fetching display" });
    }
});
// Create display
router.post("/", auth_1.isAuthenticated, async (req, res) => {
    try {
        const { name, description, type, content, settings } = req.body;
        const display = displayRepository.create({
            name,
            description,
            type,
            content,
            settings,
            createdBy: req.user
        });
        await displayRepository.save(display);
        res.status(201).json(display);
    }
    catch (error) {
        logger_1.logger.error(`Create display error: ${error}`);
        res.status(500).json({ message: "Error creating display" });
    }
});
// Update display
router.put("/:id", auth_1.isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });
        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }
        // Check if user owns the display
        if (display.createdBy.id !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }
        const { name, description, type, content, settings } = req.body;
        Object.assign(display, {
            name,
            description,
            type,
            content,
            settings,
            updatedBy: req.user
        });
        await displayRepository.save(display);
        res.json(display);
    }
    catch (error) {
        logger_1.logger.error(`Update display error: ${error}`);
        res.status(500).json({ message: "Error updating display" });
    }
});
// Delete display
router.delete("/:id", auth_1.isAuthenticated, async (req, res) => {
    try {
        const display = await displayRepository.findOne({
            where: { id: req.params.id },
            relations: ["createdBy"]
        });
        if (!display) {
            return res.status(404).json({ message: "Display not found" });
        }
        // Check if user owns the display
        if (display.createdBy.id !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }
        await displayRepository.remove(display);
        res.json({ message: "Display deleted successfully" });
    }
    catch (error) {
        logger_1.logger.error(`Delete display error: ${error}`);
        res.status(500).json({ message: "Error deleting display" });
    }
});
exports.default = router;
