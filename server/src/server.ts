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

// Load environment variables
config();

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