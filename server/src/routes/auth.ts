import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { isAuthenticated } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

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

    passport.authenticate("local", { session: false }, (
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

        logger.info(`Login successful for user: ${user.username}`);
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
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