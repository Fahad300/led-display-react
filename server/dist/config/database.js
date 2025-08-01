"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const Display_1 = require("../models/Display");
const Session_1 = require("../models/Session");
const File_1 = require("../models/File");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * MySQL Database Configuration for Production
 * Provides better scalability, performance, and concurrent access compared to SQLite
 */
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: env_1.config.database.host,
    port: env_1.config.database.port,
    username: env_1.config.database.username,
    password: env_1.config.database.password,
    database: env_1.config.database.database,
    synchronize: env_1.config.database.synchronize, // Set to false in production
    logging: false, // Disable verbose SQL query logging
    entities: [User_1.User, Display_1.Display, Session_1.Session, File_1.File],
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
const connectDB = async () => {
    try {
        await exports.AppDataSource.initialize();
        logger_1.logger.info("✅ MySQL Database Connected");
        // Verify database state
        const userRepository = exports.AppDataSource.getRepository(User_1.User);
        const userCount = await userRepository.count();
        logger_1.logger.info(`📊 Database ready - ${userCount} users found`);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`❌ Database connection failed: ${error.message}`);
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
/**
 * Close database connection gracefully
 */
const closeDB = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            logger_1.logger.info("Database connection closed successfully");
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Error closing database connection: ${error.message}`);
        }
    }
};
exports.closeDB = closeDB;
