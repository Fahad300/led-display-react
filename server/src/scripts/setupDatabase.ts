import mysql from "mysql2/promise";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { runMigrations } from "../config/migrate";
import { seedDatabase } from "../config/seed";

/**
 * Database Setup Script
 * Complete MySQL database setup and migration from SQLite
 */
const setupDatabase = async (): Promise<void> => {
    try {
        logger.info("Starting complete database setup...");

        // Step 1: Create database and user
        await createDatabaseAndUser();

        // Step 2: Run migrations
        await runMigrations();

        // Step 3: Seed initial data
        await seedDatabase();

        logger.info("Database setup completed successfully!");

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database setup failed: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
};

/**
 * Create MySQL database and user
 */
const createDatabaseAndUser = async (): Promise<void> => {
    try {
        logger.info("Creating MySQL database and user...");

        // Connect to MySQL as root (you'll need root credentials)
        const rootConnection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: "root", // You'll need to provide root password via environment
            password: process.env.MYSQL_ROOT_PASSWORD || ""
        });

        try {
            // Create database if it doesn't exist
            await rootConnection.execute(
                `CREATE DATABASE IF NOT EXISTS \`${config.database.database}\` 
                 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            logger.info(`Database '${config.database.database}' created or already exists`);

            // Create user if it doesn't exist
            await rootConnection.execute(
                `CREATE USER IF NOT EXISTS '${config.database.username}'@'%' 
                 IDENTIFIED BY '${config.database.password}'`
            );
            logger.info(`User '${config.database.username}' created or already exists`);

            // Grant privileges to user
            await rootConnection.execute(
                `GRANT ALL PRIVILEGES ON \`${config.database.database}\`.* 
                 TO '${config.database.username}'@'%'`
            );
            await rootConnection.execute("FLUSH PRIVILEGES");
            logger.info(`Privileges granted to '${config.database.username}'`);

        } finally {
            await rootConnection.end();
        }

    } catch (error) {
        if (error instanceof Error) {
            logger.warn(`Database/user creation warning: ${error.message}`);
            logger.info("You may need to create the database and user manually:");
            logger.info(`CREATE DATABASE ${config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            logger.info(`CREATE USER '${config.database.username}'@'%' IDENTIFIED BY '${config.database.password}';`);
            logger.info(`GRANT ALL PRIVILEGES ON ${config.database.database}.* TO '${config.database.username}'@'%';`);
            logger.info("FLUSH PRIVILEGES;");
        }
    }
};

/**
 * Verify database connection
 */
const verifyConnection = async (): Promise<void> => {
    try {
        logger.info("Verifying database connection...");

        const connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password,
            database: config.database.database
        });

        try {
            const [rows] = await connection.execute("SELECT 1 as test");
            logger.info("Database connection verified successfully");

            // Test performance
            const startTime = Date.now();
            await connection.execute("SELECT 1");
            const queryTime = Date.now() - startTime;
            logger.info(`Database query response time: ${queryTime}ms`);

        } finally {
            await connection.end();
        }

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database connection verification failed: ${error.message}`);
            throw error;
        }
    }
};

/**
 * Display setup instructions
 */
const displayInstructions = (): void => {
    logger.info("\n=== MySQL Database Setup Instructions ===");
    logger.info("1. Install MySQL Server on your system");
    logger.info("2. Set up environment variables in .env file:");
    logger.info("   DB_HOST=localhost");
    logger.info("   DB_PORT=3306");
    logger.info("   DB_USERNAME=led_display_user");
    logger.info("   DB_PASSWORD=your_secure_password");
    logger.info("   DB_DATABASE=led_display_db");
    logger.info("   MYSQL_ROOT_PASSWORD=your_root_password");
    logger.info("3. Run: npm run migrate");
    logger.info("4. Run: npm run seed");
    logger.info("5. Start the server: npm run dev");
    logger.info("==========================================\n");
};

// Run setup if this file is executed directly
if (require.main === module) {
    displayInstructions();

    setupDatabase()
        .then(async () => {
            await verifyConnection();
            logger.info("Database setup script completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            logger.error(`Database setup script failed: ${error}`);
            process.exit(1);
        });
}

export { setupDatabase, createDatabaseAndUser, verifyConnection }; 