import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import displayRoutes from "./routes/display";
import sessionsRoutes from "./routes/sessions";
import filesRoutes from "./routes/files";
import mainRoutes from "./routes/main";
import { initializePassport } from "./config/passport";

// Load environment variables with UTF-16 support
import fs from "fs";
import path from "path";

const envPath = path.resolve('./.env');
try {
    // Try to read as UTF-16 first
    const envContent = fs.readFileSync(envPath, 'utf16le');
    console.log('server.ts: Reading .env file as UTF-16');

    // Parse the content manually and set environment variables
    const lines = envContent.split('\n');
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex);
                const value = trimmedLine.substring(equalIndex + 1);
                process.env[key] = value;
            }
        }
    });
} catch (error) {
    console.log('server.ts: Error reading .env file as UTF-16, trying dotenv:', error);
    // Fallback to dotenv
    config({ path: './.env' });
}
console.log('Environment variables loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_DATABASE: process.env.DB_DATABASE,
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
});

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());



// Initialize passport
initializePassport();

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/display", displayRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/files", filesRoutes);
app.use("/", mainRoutes);

// Global error handler
app.use(errorHandler);

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.info("Database connection established");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info("✅ Database-based file storage enabled");
        });
    })
    .catch((error) => {
        logger.error("Error during database initialization:", error);
    }); 