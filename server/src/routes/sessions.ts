import express from "express";
import { AppDataSource } from "../config/database";
import { Session } from "../models/Session";
import { User } from "../models/User";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";
import crypto from "crypto";

const router = express.Router();

/**
 * Generate a secure session token
 */
const generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * @route POST /api/sessions/create
 * @desc Create a new session for the authenticated user
 * @access Private
 */
router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { deviceInfo, ipAddress } = req.body;

        // Check if user already has an active session
        const existingSession = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (existingSession) {
            // Update existing session
            existingSession.lastActivity = new Date();
            existingSession.deviceInfo = deviceInfo || existingSession.deviceInfo;
            existingSession.ipAddress = ipAddress || existingSession.ipAddress;
            await AppDataSource.getRepository(Session).save(existingSession);

            return res.json({
                sessionToken: existingSession.sessionToken,
                message: "Session updated"
            });
        }

        // Create new session
        const session = AppDataSource.getRepository(Session).create({
            sessionToken: generateSessionToken(),
            userId,
            deviceInfo,
            ipAddress,
            lastActivity: new Date(),
            isActive: true
        });

        await AppDataSource.getRepository(Session).save(session);

        res.json({
            sessionToken: session.sessionToken,
            message: "Session created"
        });
    } catch (error) {
        logger.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

/**
 * @route GET /api/sessions/current
 * @desc Get current session data for the authenticated user
 * @access Private
 */
router.get("/current", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        const session = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }

        const slideshowData = session.getSlideshowData();

        res.json({
            sessionId: session.id,
            slideshowData: slideshowData,
            lastActivity: session.lastActivity,
            deviceInfo: session.deviceInfo
        });
    } catch (error) {
        logger.error("Error getting session:", error);
        res.status(500).json({ error: "Failed to get session" });
    }
});

// OLD ENDPOINT REMOVED - Using unified slideshow-data endpoint instead

// OLD ENDPOINT REMOVED - Using unified slideshow-data endpoint instead

// OLD ENDPOINT REMOVED - Using unified slideshow-data endpoint instead

/**
 * @route DELETE /api/sessions/logout
 * @desc Logout and deactivate current session
 * @access Private
 */
router.delete("/logout", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        const session = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (session) {
            session.isActive = false;
            await AppDataSource.getRepository(Session).save(session);
        }

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        logger.error("Error logging out:", error);
        res.status(500).json({ error: "Failed to logout" });
    }
});

/**
 * @route POST /api/sessions/slideshow-data
 * @desc Save unified slideshow data to the current session
 * @access Private
 */
router.post("/slideshow-data", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { slideshowData } = req.body;

        logger.info(`Received slideshow data request from user ${userId}:`, {
            hasSlideshowData: !!slideshowData,
            bodyKeys: Object.keys(req.body),
            slideshowDataType: typeof slideshowData
        });

        if (!slideshowData) {
            logger.error("Slideshow data is missing from request body");
            return res.status(400).json({ error: "Slideshow data is required" });
        }

        // Find the current active session
        const session = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }

        // Update slideshow data
        session.setSlideshowData(slideshowData);
        session.lastActivity = new Date();

        await AppDataSource.getRepository(Session).save(session);

        logger.info(`Slideshow data updated for user ${userId}:`, {
            slidesCount: slideshowData.slides?.length || 0,
            activeSlidesCount: slideshowData.slides?.filter((slide: any) => slide.active).length || 0,
            displaySettings: slideshowData.displaySettings,
            lastUpdated: slideshowData.lastUpdated,
            version: slideshowData.version
        });
        res.json({ message: "Slideshow data saved successfully" });
    } catch (error) {
        logger.error("Error saving slideshow data:", error);
        res.status(500).json({ error: "Failed to save slideshow data" });
    }
});

/**
 * @route GET /api/sessions/slideshow-data
 * @desc Get unified slideshow data from the current session
 * @access Private
 */
router.get("/slideshow-data", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        // Find the current active session
        const session = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }

        const slideshowData = session.getSlideshowData();

        if (!slideshowData) {
            return res.status(404).json({ error: "No slideshow data found" });
        }

        res.json({ slideshowData });
    } catch (error) {
        logger.error("Error getting slideshow data:", error);
        res.status(500).json({ error: "Failed to get slideshow data" });
    }
});

/**
 * @route GET /api/sessions/slideshow-data/latest
 * @desc Get the latest slideshow data from any active session (public access for LED displays)
 * @access Public
 */
router.get("/slideshow-data/latest", async (req, res) => {
    try {
        // Get the most recent active session from any user
        const latestSession = await AppDataSource.getRepository(Session).findOne({
            where: { isActive: true },
            order: { lastActivity: "DESC" }
        });

        if (!latestSession) {
            return res.status(404).json({ error: "No active sessions found" });
        }

        const slideshowData = latestSession.getSlideshowData();

        if (!slideshowData) {
            return res.status(404).json({ error: "No slideshow data found" });
        }

        res.json({ slideshowData });
    } catch (error) {
        logger.error("Error getting latest slideshow data:", error);
        res.status(500).json({ error: "Failed to get latest slideshow data" });
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
        const latestSession = await AppDataSource.getRepository(Session).findOne({
            where: { isActive: true },
            order: { lastActivity: "DESC" }
        });

        if (!latestSession) {
            return res.status(404).json({ error: "No active sessions found" });
        }

        const slideshowData = latestSession.getSlideshowData();

        res.json({
            slideshowData: slideshowData,
            lastActivity: latestSession.lastActivity,
            deviceInfo: latestSession.deviceInfo
        });
    } catch (error) {
        logger.error("Error getting latest session:", error);
        res.status(500).json({ error: "Failed to get latest session" });
    }
});

/**
 * @route POST /api/sessions/trigger-refresh
 * @desc Trigger immediate refresh on all remote displays
 * @access Private
 */
router.post("/trigger-refresh", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { refreshType = "all" } = req.body; // "all", "data", "settings", "slides"

        logger.info(`Triggering ${refreshType} refresh for user ${userId}`);

        // Update the current session's lastActivity to trigger refresh
        const session = await AppDataSource.getRepository(Session).findOne({
            where: { userId, isActive: true }
        });

        if (session) {
            // Update lastActivity with a more recent timestamp to ensure immediate detection
            session.lastActivity = new Date();
            await AppDataSource.getRepository(Session).save(session);
            logger.info(`Session ${session.id} lastActivity updated to trigger refresh`);

            // Also update all other active sessions to trigger refresh on all displays
            const allActiveSessions = await AppDataSource.getRepository(Session).find({
                where: { isActive: true }
            });

            // Update all active sessions to trigger refresh
            for (const activeSession of allActiveSessions) {
                if (activeSession.id !== session.id) {
                    activeSession.lastActivity = new Date();
                    await AppDataSource.getRepository(Session).save(activeSession);
                }
            }

            logger.info(`Updated ${allActiveSessions.length} active sessions to trigger refresh`);
        }

        // Return success response
        res.json({
            message: `${refreshType} refresh triggered successfully`,
            timestamp: new Date().toISOString(),
            refreshType,
            sessionsUpdated: session ? 1 : 0
        });

    } catch (error) {
        logger.error("Error triggering refresh:", error);
        res.status(500).json({ error: "Failed to trigger refresh" });
    }
});

/**
 * @route GET /api/sessions/all
 * @desc Get all sessions for the authenticated user
 * @access Private
 */
router.get("/all", isAuthenticated, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        const sessions = await AppDataSource.getRepository(Session).find({
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
    } catch (error) {
        logger.error("Error getting sessions:", error);
        res.status(500).json({ error: "Failed to get sessions" });
    }
});

export default router; 