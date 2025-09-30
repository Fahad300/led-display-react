import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
// Display routes removed - using unified slideshow data instead
import sessionsRoutes from "./routes/sessions";
import filesRoutes from "./routes/files";
import proxyRoutes from "./routes/proxy";
import mainRoutes from "./routes/main";
import { initializePassport } from "./config/passport";

// Load environment variables
import fs from "fs";
import path from "path";

const envPath = path.resolve('./.env');

// Try multiple encoding methods
let envContent: string | null = null;

try {
    // Try UTF-8 first (most common)
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    try {
        // Try UTF-16 LE
        envContent = fs.readFileSync(envPath, 'utf16le');
    } catch (error2) {
        // Fallback to dotenv
        config({ path: './.env' });
    }
}

if (envContent) {
    // Parse the content manually and set environment variables
    const lines = envContent.split(/\r?\n/); // Handle both \r\n and \n line endings
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex).trim();
                const value = trimmedLine.substring(equalIndex + 1).trim();
                process.env[key] = value;
            }
        }
    });
} else {
    // Fallback to dotenv
    config({ path: './.env' });
}

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());



// Initialize passport
initializePassport();

// Static file serving for uploads (optimized for local development)
app.use("/static/uploads", express.static(path.join(__dirname, "../uploads"), {
    // Enable range requests for video streaming
    acceptRanges: true,
    // Cache static files for 1 hour
    maxAge: '1h',
    // Set proper headers for video files
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
// Display routes removed - using unified slideshow data instead
app.use("/api/sessions", sessionsRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/proxy", proxyRoutes);
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