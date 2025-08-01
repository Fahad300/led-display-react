import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Display } from "../models/Display";
import { Session } from "../models/Session";
import { File } from "../models/File";
import { config } from "./env";
import { logger } from "../utils/logger";

/**
 * MySQL Database Configuration for Production
 * Provides better scalability, performance, and concurrent access compared to SQLite
 */
export const AppDataSource = new DataSource({
    type: "mysql",
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    synchronize: config.database.synchronize, // Set to false in production
    logging: false, // Disable verbose SQL query logging
    entities: [User, Display, Session, File],
    migrations: ["src/migrations/*.ts"],
    subscribers: [],
    charset: "utf8mb4",
    // Connection pool settings for better performance
    extra: {
        connectionLimit: 10
    }
});

/**
 * Initialize database connection
 */
export const connectDB = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        logger.info("✅ MySQL Database Connected");

        // Verify database state
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();
        logger.info(`📊 Database ready - ${userCount} users found`);

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`❌ Database connection failed: ${error.message}`);
        }
        process.exit(1);
    }
};

/**
 * Close database connection gracefully
 */
export const closeDB = async (): Promise<void> => {
    try {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info("Database connection closed successfully");
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error closing database connection: ${error.message}`);
        }
    }
}; 