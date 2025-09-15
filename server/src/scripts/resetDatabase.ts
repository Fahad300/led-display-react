import { AppDataSource } from "../config/database";
import { config } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Reset Database Script
 * Drops all tables and recreates them using clean migrations
 */
const resetDatabase = async (): Promise<void> => {
    try {
        logger.info("🔄 Starting database reset...");

        // Initialize database connection
        await AppDataSource.initialize();
        logger.info("✅ Database connection established");

        // Create database if it doesn't exist
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            await queryRunner.createDatabase(config.database.database, true);
            logger.info(`✅ Database '${config.database.database}' created or already exists`);
        } catch (error) {
            logger.warn(`⚠️  Database creation warning: ${error}`);
        } finally {
            await queryRunner.release();
        }

        // Drop all existing tables (in reverse order due to foreign keys)
        logger.info("🗑️  Dropping existing tables...");
        await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
        await queryRunner.query("DROP TABLE IF EXISTS files");
        await queryRunner.query("DROP TABLE IF EXISTS sessions");
        await queryRunner.query("DROP TABLE IF EXISTS users");
        await queryRunner.query("DROP TABLE IF EXISTS migrations");
        await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");
        logger.info("✅ All tables dropped");

        // Run clean migrations
        logger.info("🏗️  Running clean migrations...");
        const migrations = await AppDataSource.runMigrations();
        logger.info(`✅ Executed ${migrations.length} clean migrations`);

        // Close the connection
        await AppDataSource.destroy();
        logger.info("✅ Database connection closed");

        logger.info("🎉 Database reset completed successfully!");
        logger.info("📋 Created tables:");
        logger.info("   - users (authentication)");
        logger.info("   - sessions (user sessions with unified slideshow data)");
        logger.info("   - files (media storage)");
        logger.info("   - migrations (migration history)");

        process.exit(0);
    } catch (error) {
        logger.error("❌ Database reset failed:", error);
        process.exit(1);
    }
};

// Run the reset if this file is executed directly
if (require.main === module) {
    resetDatabase();
}

export { resetDatabase };