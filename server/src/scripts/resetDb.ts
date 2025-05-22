import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

const resetDatabase = async (): Promise<void> => {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        logger.info("Database connection initialized");

        // Drop all tables
        await AppDataSource.dropDatabase();
        logger.info("Database dropped");

        // Close the connection
        await AppDataSource.destroy();
        logger.info("Database connection closed");

        // Delete the SQLite file
        const dbPath = path.join(__dirname, "../../database.sqlite");
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            logger.info("SQLite file deleted");
        }

        logger.info("Database reset completed successfully");
        process.exit(0);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database reset error: ${error.message}`);
        }
        process.exit(1);
    }
};

// Run the reset
resetDatabase(); 