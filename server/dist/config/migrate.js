"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateData = exports.runMigrations = void 0;
const database_1 = require("./database");
const User_1 = require("../models/User");
const Display_1 = require("../models/Display");
const Session_1 = require("../models/Session");
const logger_1 = require("../utils/logger");
const env_1 = require("./env");
/**
 * Database Migration Script
 * Handles the transition from SQLite to MySQL
 */
const runMigrations = async () => {
    try {
        logger_1.logger.info("Starting database migration...");
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        logger_1.logger.info("Database connection established");
        // Create database if it doesn't exist
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.createDatabase(env_1.config.database.database, true);
            logger_1.logger.info(`Database '${env_1.config.database.database}' created or already exists`);
        }
        catch (error) {
            logger_1.logger.warn(`Database creation error (may already exist): ${error}`);
        }
        finally {
            await queryRunner.release();
        }
        // Run TypeORM migrations
        const migrations = await database_1.AppDataSource.runMigrations();
        logger_1.logger.info(`Executed ${migrations.length} migrations`);
        // Verify tables exist
        const tables = ["users", "displays", "sessions"];
        let existingTables = 0;
        for (const table of tables) {
            const tableExists = await database_1.AppDataSource.query(`SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = '${env_1.config.database.database}' 
                 AND table_name = '${table}'`);
            if (tableExists[0].count > 0) {
                existingTables++;
            }
        }
        logger_1.logger.info(`📋 Database schema ready - ${existingTables}/${tables.length} tables verified`);
        // Create indexes for better performance
        await createIndexes();
        logger_1.logger.info("Database migration completed successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Migration failed: ${error.message}`);
            logger_1.logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
};
exports.runMigrations = runMigrations;
/**
 * Create database indexes for better performance
 */
const createIndexes = async () => {
    try {
        logger_1.logger.info("Creating database indexes...");
        // Check if indexes exist before creating them
        const indexQueries = [
            {
                name: "idx_users_username",
                query: "CREATE INDEX idx_users_username ON users(username)"
            },
            {
                name: "idx_displays_created_by",
                query: "CREATE INDEX idx_displays_created_by ON displays(created_by)"
            },
            {
                name: "idx_displays_is_active",
                query: "CREATE INDEX idx_displays_is_active ON displays(isActive)"
            },
            {
                name: "idx_sessions_user_id",
                query: "CREATE INDEX idx_sessions_user_id ON sessions(userId)"
            },
            {
                name: "idx_sessions_token",
                query: "CREATE INDEX idx_sessions_token ON sessions(sessionToken)"
            },
            {
                name: "idx_sessions_is_active",
                query: "CREATE INDEX idx_sessions_is_active ON sessions(isActive)"
            }
        ];
        let createdIndexes = 0;
        for (const index of indexQueries) {
            try {
                // Check if index already exists
                const indexExists = await database_1.AppDataSource.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.statistics 
                    WHERE table_schema = '${env_1.config.database.database}' 
                    AND table_name = '${index.name.split('_')[1]}s' 
                    AND index_name = '${index.name}'
                `);
                if (indexExists[0].count === 0) {
                    await database_1.AppDataSource.query(index.query);
                    createdIndexes++;
                }
            }
            catch (error) {
                logger_1.logger.warn(`⚠️  Index creation skipped: ${index.name}`);
            }
        }
        if (createdIndexes > 0) {
            logger_1.logger.info(`⚡ Performance indexes created: ${createdIndexes} new indexes`);
        }
        else {
            logger_1.logger.info(`⚡ Performance indexes ready - all indexes exist`);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.warn(`Index creation warning: ${error.message}`);
        }
    }
};
/**
 * Data migration from SQLite to MySQL (if needed)
 */
const migrateData = async () => {
    try {
        logger_1.logger.info("Starting data migration...");
        // This would be used if you need to migrate existing SQLite data
        // For now, we'll just verify the database structure
        const userCount = await database_1.AppDataSource.getRepository(User_1.User).count();
        const displayCount = await database_1.AppDataSource.getRepository(Display_1.Display).count();
        const sessionCount = await database_1.AppDataSource.getRepository(Session_1.Session).count();
        logger_1.logger.info(`Current data counts:`);
        logger_1.logger.info(`- Users: ${userCount}`);
        logger_1.logger.info(`- Displays: ${displayCount}`);
        logger_1.logger.info(`- Sessions: ${sessionCount}`);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Data migration error: ${error.message}`);
        }
    }
};
exports.migrateData = migrateData;
// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
        logger_1.logger.info("Migration script completed");
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error(`Migration script failed: ${error}`);
        process.exit(1);
    });
}
