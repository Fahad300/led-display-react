"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyConnection = exports.createDatabaseAndUser = exports.setupDatabase = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const migrate_1 = require("../config/migrate");
const seed_1 = require("../config/seed");
/**
 * Database Setup Script
 * Complete MySQL database setup and migration from SQLite
 */
const setupDatabase = async () => {
    try {
        logger_1.logger.info("Starting complete database setup...");
        // Step 1: Create database and user
        await createDatabaseAndUser();
        // Step 2: Run migrations
        await (0, migrate_1.runMigrations)();
        // Step 3: Seed initial data
        await (0, seed_1.seedDatabase)();
        logger_1.logger.info("Database setup completed successfully!");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Database setup failed: ${error.message}`);
            logger_1.logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
};
exports.setupDatabase = setupDatabase;
/**
 * Create MySQL database and user
 */
const createDatabaseAndUser = async () => {
    try {
        logger_1.logger.info("Creating MySQL database and user...");
        // Connect to MySQL as root (you'll need root credentials)
        const rootConnection = await promise_1.default.createConnection({
            host: env_1.config.database.host,
            port: env_1.config.database.port,
            user: "root", // You'll need to provide root password via environment
            password: process.env.MYSQL_ROOT_PASSWORD || ""
        });
        try {
            // Create database if it doesn't exist
            await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${env_1.config.database.database}\` 
                 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            logger_1.logger.info(`Database '${env_1.config.database.database}' created or already exists`);
            // Create user if it doesn't exist
            await rootConnection.execute(`CREATE USER IF NOT EXISTS '${env_1.config.database.username}'@'%' 
                 IDENTIFIED BY '${env_1.config.database.password}'`);
            logger_1.logger.info(`User '${env_1.config.database.username}' created or already exists`);
            // Grant privileges to user
            await rootConnection.execute(`GRANT ALL PRIVILEGES ON \`${env_1.config.database.database}\`.* 
                 TO '${env_1.config.database.username}'@'%'`);
            await rootConnection.execute("FLUSH PRIVILEGES");
            logger_1.logger.info(`Privileges granted to '${env_1.config.database.username}'`);
        }
        finally {
            await rootConnection.end();
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.warn(`Database/user creation warning: ${error.message}`);
            logger_1.logger.info("You may need to create the database and user manually:");
            logger_1.logger.info(`CREATE DATABASE ${env_1.config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            logger_1.logger.info(`CREATE USER '${env_1.config.database.username}'@'%' IDENTIFIED BY '${env_1.config.database.password}';`);
            logger_1.logger.info(`GRANT ALL PRIVILEGES ON ${env_1.config.database.database}.* TO '${env_1.config.database.username}'@'%';`);
            logger_1.logger.info("FLUSH PRIVILEGES;");
        }
    }
};
exports.createDatabaseAndUser = createDatabaseAndUser;
/**
 * Verify database connection
 */
const verifyConnection = async () => {
    try {
        logger_1.logger.info("Verifying database connection...");
        const connection = await promise_1.default.createConnection({
            host: env_1.config.database.host,
            port: env_1.config.database.port,
            user: env_1.config.database.username,
            password: env_1.config.database.password,
            database: env_1.config.database.database
        });
        try {
            const [rows] = await connection.execute("SELECT 1 as test");
            logger_1.logger.info("Database connection verified successfully");
            // Test performance
            const startTime = Date.now();
            await connection.execute("SELECT 1");
            const queryTime = Date.now() - startTime;
            logger_1.logger.info(`Database query response time: ${queryTime}ms`);
        }
        finally {
            await connection.end();
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Database connection verification failed: ${error.message}`);
            throw error;
        }
    }
};
exports.verifyConnection = verifyConnection;
/**
 * Display setup instructions
 */
const displayInstructions = () => {
    logger_1.logger.info("\n=== MySQL Database Setup Instructions ===");
    logger_1.logger.info("1. Install MySQL Server on your system");
    logger_1.logger.info("2. Set up environment variables in .env file:");
    logger_1.logger.info("   DB_HOST=localhost");
    logger_1.logger.info("   DB_PORT=3306");
    logger_1.logger.info("   DB_USERNAME=led_display_user");
    logger_1.logger.info("   DB_PASSWORD=your_secure_password");
    logger_1.logger.info("   DB_DATABASE=led_display_db");
    logger_1.logger.info("   MYSQL_ROOT_PASSWORD=your_root_password");
    logger_1.logger.info("3. Run: npm run migrate");
    logger_1.logger.info("4. Run: npm run seed");
    logger_1.logger.info("5. Start the server: npm run dev");
    logger_1.logger.info("==========================================\n");
};
// Run setup if this file is executed directly
if (require.main === module) {
    displayInstructions();
    setupDatabase()
        .then(async () => {
        await verifyConnection();
        logger_1.logger.info("Database setup script completed successfully");
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error(`Database setup script failed: ${error}`);
        process.exit(1);
    });
}
