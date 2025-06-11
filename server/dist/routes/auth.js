"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
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
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "1d" });
        res.status(201).json({
            message: "User registered successfully",
            token
        });
    }
    catch (error) {
        logger_1.logger.error(`Registration error: ${error}`);
        res.status(500).json({ message: "Error registering user" });
    }
});
// Login
router.post("/login", (req, res, next) => {
    logger_1.logger.info(`Login attempt for username: ${req.body.username}`);
    passport_1.default.authenticate("local", { session: false }, (err, user, info) => {
        if (err) {
            logger_1.logger.error(`Login error: ${err}`);
            logger_1.logger.error(`Stack trace: ${err.stack}`);
            return res.status(500).json({ message: "Error during login", error: err.message });
        }
        if (!user) {
            logger_1.logger.error(`Login failed: ${info?.message || "Invalid credentials"}`);
            logger_1.logger.error(`Login attempt details - Username: ${req.body.username}`);
            return res.status(401).json({
                message: "Invalid username or password",
                details: info?.message || "Please check your credentials and try again"
            });
        }
        logger_1.logger.info(`Login successful for user: ${user.username}`);
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "1d" });
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
router.get("/me", auth_1.isAuthenticated, async (req, res) => {
    try {
        const user = await userRepository.findOne({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            id: user.id,
            username: user.username
        });
    }
    catch (error) {
        logger_1.logger.error(`Get user error: ${error}`);
        res.status(500).json({ message: "Error fetching user data" });
    }
});
exports.default = router;
