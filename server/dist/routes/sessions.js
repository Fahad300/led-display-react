"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const Session_1 = require("../models/Session");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
/**
 * Generate a secure session token
 */
const generateSessionToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
/**
 * @route POST /api/sessions/create
 * @desc Create a new session for the authenticated user
 * @access Private
 */
router.post("/create", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceInfo, ipAddress } = req.body;
        // Check if user already has an active session
        const existingSession = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (existingSession) {
            // Update existing session
            existingSession.lastActivity = new Date();
            existingSession.deviceInfo = deviceInfo || existingSession.deviceInfo;
            existingSession.ipAddress = ipAddress || existingSession.ipAddress;
            await database_1.AppDataSource.getRepository(Session_1.Session).save(existingSession);
            return res.json({
                sessionToken: existingSession.sessionToken,
                message: "Session updated"
            });
        }
        // Create new session
        const session = database_1.AppDataSource.getRepository(Session_1.Session).create({
            sessionToken: generateSessionToken(),
            userId,
            deviceInfo,
            ipAddress,
            lastActivity: new Date(),
            isActive: true
        });
        await database_1.AppDataSource.getRepository(Session_1.Session).save(session);
        res.json({
            sessionToken: session.sessionToken,
            message: "Session created"
        });
    }
    catch (error) {
        logger_1.logger.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});
/**
 * @route GET /api/sessions/current
 * @desc Get current session data for the authenticated user
 * @access Private
 */
router.get("/current", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }
        res.json({
            sessionId: session.id,
            displaySettings: session.getDisplaySettings(),
            slideData: session.getSlideData(),
            appSettings: session.getAppSettings(),
            lastActivity: session.lastActivity,
            deviceInfo: session.deviceInfo
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting session:", error);
        res.status(500).json({ error: "Failed to get session" });
    }
});
/**
 * @route PUT /api/sessions/display-settings
 * @desc Update display settings for the current session
 * @access Private
 */
router.put("/display-settings", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { settings } = req.body;
        const session = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }
        session.setDisplaySettings(settings);
        session.lastActivity = new Date();
        await database_1.AppDataSource.getRepository(Session_1.Session).save(session);
        res.json({ message: "Display settings updated" });
    }
    catch (error) {
        logger_1.logger.error("Error updating display settings:", error);
        res.status(500).json({ error: "Failed to update display settings" });
    }
});
/**
 * @route PUT /api/sessions/slide-data
 * @desc Update slide data for the current session
 * @access Private
 */
router.put("/slide-data", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { slides } = req.body;
        const session = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }
        session.setSlideData(slides);
        session.lastActivity = new Date();
        await database_1.AppDataSource.getRepository(Session_1.Session).save(session);
        res.json({ message: "Slide data updated" });
    }
    catch (error) {
        logger_1.logger.error("Error updating slide data:", error);
        res.status(500).json({ error: "Failed to update slide data" });
    }
});
/**
 * @route PUT /api/sessions/app-settings
 * @desc Update app settings for the current session
 * @access Private
 */
router.put("/app-settings", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { settings } = req.body;
        const session = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }
        session.setAppSettings(settings);
        session.lastActivity = new Date();
        await database_1.AppDataSource.getRepository(Session_1.Session).save(session);
        res.json({ message: "App settings updated" });
    }
    catch (error) {
        logger_1.logger.error("Error updating app settings:", error);
        res.status(500).json({ error: "Failed to update app settings" });
    }
});
/**
 * @route DELETE /api/sessions/logout
 * @desc Logout and deactivate current session
 * @access Private
 */
router.delete("/logout", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { userId, isActive: true }
        });
        if (session) {
            session.isActive = false;
            await database_1.AppDataSource.getRepository(Session_1.Session).save(session);
        }
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        logger_1.logger.error("Error logging out:", error);
        res.status(500).json({ error: "Failed to logout" });
    }
});
/**
 * @route GET /api/sessions/latest
 * @desc Get the most recent active session data (public access for LED displays)
 * @access Public
 */
router.get("/latest", async (req, res) => {
    try {
        // Get the most recent active session from any user
        const latestSession = await database_1.AppDataSource.getRepository(Session_1.Session).findOne({
            where: { isActive: true },
            order: { lastActivity: "DESC" }
        });
        if (!latestSession) {
            return res.status(404).json({ error: "No active sessions found" });
        }
        res.json({
            displaySettings: latestSession.getDisplaySettings(),
            slideData: latestSession.getSlideData(),
            appSettings: latestSession.getAppSettings(),
            lastActivity: latestSession.lastActivity,
            deviceInfo: latestSession.deviceInfo
        });
    }
    catch (error) {
        logger_1.logger.error("Error getting latest session:", error);
        res.status(500).json({ error: "Failed to get latest session" });
    }
});
/**
 * @route GET /api/sessions/all
 * @desc Get all sessions for the authenticated user
 * @access Private
 */
router.get("/all", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await database_1.AppDataSource.getRepository(Session_1.Session).find({
            where: { userId },
            order: { lastActivity: "DESC" }
        });
        res.json(sessions.map(session => ({
            id: session.id,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            isActive: session.isActive,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt
        })));
    }
    catch (error) {
        logger_1.logger.error("Error getting sessions:", error);
        res.status(500).json({ error: "Failed to get sessions" });
    }
});
exports.default = router;
