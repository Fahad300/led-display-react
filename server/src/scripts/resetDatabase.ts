import { AppDataSource } from "../config/database";
import { config } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Reset Database Script
 * Drops all tables and recreates them using migrations
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

        // Drop all existing tables
        logger.info("🗑️  Dropping existing tables...");
        await AppDataSource.dropDatabase();
        logger.info("✅ All tables dropped");

        // Run migrations in order
        logger.info("🔄 Running migrations...");
        const migrations = await AppDataSource.runMigrations();
        logger.info(`✅ Executed ${migrations.length} migrations`);

        // Verify tables exist
        const expectedTables = ["users", "displays", "sessions", "files"];
        let existingTables = 0;

        for (const table of expectedTables) {
            const tableExists = await AppDataSource.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = '${config.database.database}' 
                 AND table_name = '${table}'`
            );

            if (tableExists[0].count > 0) {
                existingTables++;
                logger.info(`✅ Table '${table}' exists`);
            } else {
                logger.error(`❌ Table '${table}' missing`);
            }
        }

        logger.info(`📊 Database reset complete - ${existingTables}/${expectedTables.length} tables verified`);

        if (existingTables === expectedTables.length) {
            logger.info("🎉 Database reset successful!");
        } else {
            logger.error("❌ Database reset failed - some tables are missing");
            process.exit(1);
        }

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`❌ Database reset failed: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
};

// Run reset if this file is executed directly
if (require.main === module) {
    resetDatabase()
        .then(() => {
            logger.info("Database reset script completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error(`Database reset script failed: ${error}`);
            process.exit(1);
        });
}

export { resetDatabase };
