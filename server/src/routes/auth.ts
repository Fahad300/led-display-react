import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";
import { socketManager } from "../utils/socketManager";

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const sessionRepository = AppDataSource.getRepository(Session);

// Register
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const existingUser = await userRepository.findOne({ where: { username } });

        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const user = userRepository.create({
            username,
            password
        });

        await userRepository.save(user);

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token
        });
    } catch (error) {
        logger.error(`Registration error: ${error}`);
        res.status(500).json({ message: "Error registering user" });
    }
});

// Login
router.post("/login", (req, res, next) => {
    logger.info(`Login attempt for username: ${req.body.username}`);

    passport.authenticate("local", { session: false }, async (
        err: Error | null,
        user: User | false,
        info: { message: string } | undefined
    ) => {
        if (err) {
            logger.error(`Login error: ${err}`);
            logger.error(`Stack trace: ${err.stack}`);
            return res.status(500).json({ message: "Error during login", error: err.message });
        }

        if (!user) {
            logger.error(`Login failed: ${info?.message || "Invalid credentials"}`);
            logger.error(`Login attempt details - Username: ${req.body.username}`);
            return res.status(401).json({
                message: "Invalid username or password",
                details: info?.message || "Please check your credentials and try again"
            });
        }

        try {
            logger.info(`Login successful for user: ${user.username}`);

            // ==================== SINGLE USER ENFORCEMENT ====================
            // CRITICAL: This is a single-user app - when ANY new user logs in,
            // ALL other active sessions (from ALL users) must be invalidated
            // This ensures only ONE user can be logged in at a time
            logger.info(`🔒 Enforcing single-user policy: ${user.username} is logging in - invalidating all other sessions`);

            // ==================== CREATE NEW DATABASE SESSION FIRST ====================
            // CRITICAL: Create the new session BEFORE invalidating old ones
            // This ensures the new session token is available to exclude from force-logout
            const newSessionToken = crypto.randomBytes(32).toString("hex");

            const newSession = sessionRepository.create({
                sessionToken: newSessionToken,
                userId: user.id,
                deviceInfo: req.headers["user-agent"] || "Unknown Device",
                ipAddress: req.ip || "Unknown IP",
                lastActivity: new Date(),
                isActive: true
            });

            await sessionRepository.save(newSession);
            logger.info(`✅ New database session created: ${newSession.id} (token: ${newSessionToken.substring(0, 8)}...)`);

            // Find ALL active sessions from ALL users (not just this user)
            // This ensures complete single-user enforcement
            const allActiveSessions = await sessionRepository.find({
                where: { isActive: true }
            });

            // Filter out the new session we just created
            const sessionsToInvalidate = allActiveSessions.filter(
                session => session.id !== newSession.id
            );

            if (sessionsToInvalidate.length > 0) {
                logger.warn(`⚠️ Found ${sessionsToInvalidate.length} active session(s) from other users - invalidating all for single-user enforcement`);

                // Invalidate all other active sessions (from all users)
                for (const session of sessionsToInvalidate) {
                    session.isActive = false;
                    await sessionRepository.save(session);
                    logger.info(`   ❌ Invalidated session: ${session.id} (user: ${session.userId})`);
                }

                // Broadcast force-logout event to all connected displays via Socket.IO
                // This will immediately disconnect all other logged-in sessions
                // IMPORTANT: Include the new session token so the newly logged-in user can ignore it
                logger.info(`📡 Broadcasting force-logout event to all domains (excluding new session)`);
                socketManager.broadcastUpdate({
                    type: "force-reload",
                    domain: "all", // Broadcast to all domains
                    timestamp: Date.now(),
                    source: "AuthSystem",
                    data: {
                        reason: "new_login",
                        message: "Another user has logged in. This session has been terminated.",
                        userId: user.id,
                        username: user.username,
                        newSessionToken: newSessionToken // Include so new session can ignore this event
                    }
                });

                logger.info(`✅ All other sessions invalidated - single-user enforcement complete`);
            } else {
                logger.info(`✅ No other active sessions found - proceeding with new session`);
            }

            // Generate JWT token for the new session
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || "your-secret-key",
                { expiresIn: "1d" }
            );

            logger.info(`✅ Login complete for user: ${user.username}`);

            res.json({
                message: "Login successful",
                token,
                sessionToken: newSession.sessionToken,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        } catch (sessionError) {
            logger.error(`Error during session cleanup: ${sessionError}`);
            // Still allow login even if session cleanup fails
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || "your-secret-key",
                { expiresIn: "1d" }
            );

            res.json({
                message: "Login successful (with session cleanup warning)",
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        }
    })(req, res, next);
});

// Get current user
router.get("/me", isAuthenticated, async (req, res) => {
    try {
        const user = await userRepository.findOne({
            where: { id: (req.user as User).id }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user.id,
            username: user.username
        });
    } catch (error) {
        logger.error(`Get user error: ${error}`);
        res.status(500).json({ message: "Error fetching user data" });
    }
});

export default router; 