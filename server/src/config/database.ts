import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Display } from "../models/Display";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

const dbPath = path.join(__dirname, "../../database.sqlite");

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: dbPath,
    synchronize: true,
    logging: true, // Enable logging in all environments for debugging
    entities: [User, Display],
    migrations: [],
    subscribers: []
});

export const connectDB = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        logger.info("SQLite Database Connected...");

        // Verify database state
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();
        logger.info(`Current user count in database: ${userCount}`);

        // Log database path
        logger.info(`Database file location: ${dbPath}`);

        // Check if database file exists
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            logger.info(`Database file size: ${stats.size} bytes`);
        } else {
            logger.warn("Database file does not exist yet. It will be created on first write.");
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database connection error: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
}; 