import { AppDataSource } from "./database";
import { User } from "../models/User";
import { Display } from "../models/Display";
import { Session } from "../models/Session";
import { logger } from "../utils/logger";
import { config } from "./env";

/**
 * Database Migration Script
 * Handles the transition from SQLite to MySQL
 */
const runMigrations = async (): Promise<void> => {
    try {
        logger.info("Starting database migration...");

        // Initialize database connection
        await AppDataSource.initialize();
        logger.info("Database connection established");

        // Create database if it doesn't exist
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            await queryRunner.createDatabase(config.database.database, true);
            logger.info(`Database '${config.database.database}' created or already exists`);
        } catch (error) {
            logger.warn(`Database creation error (may already exist): ${error}`);
        } finally {
            await queryRunner.release();
        }

        // Run TypeORM migrations
        const migrations = await AppDataSource.runMigrations();
        logger.info(`Executed ${migrations.length} migrations`);

        // Verify tables exist
        const tables = ["users", "displays", "sessions"];
        let existingTables = 0;
        for (const table of tables) {
            const tableExists = await AppDataSource.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = '${config.database.database}' 
                 AND table_name = '${table}'`
            );

            if (tableExists[0].count > 0) {
                existingTables++;
            }
        }
        logger.info(`📋 Database schema ready - ${existingTables}/${tables.length} tables verified`);

        // Create indexes for better performance
        await createIndexes();

        logger.info("Database migration completed successfully");

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Migration failed: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
};

/**
 * Create database indexes for better performance
 */
const createIndexes = async (): Promise<void> => {
    try {
        logger.info("Creating database indexes...");

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
                const indexExists = await AppDataSource.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.statistics 
                    WHERE table_schema = '${config.database.database}' 
                    AND table_name = '${index.name.split('_')[1]}s' 
                    AND index_name = '${index.name}'
                `);

                if (indexExists[0].count === 0) {
                    await AppDataSource.query(index.query);
                    createdIndexes++;
                }
            } catch (error) {
                logger.warn(`⚠️  Index creation skipped: ${index.name}`);
            }
        }

        if (createdIndexes > 0) {
            logger.info(`⚡ Performance indexes created: ${createdIndexes} new indexes`);
        } else {
            logger.info(`⚡ Performance indexes ready - all indexes exist`);
        }

    } catch (error) {
        if (error instanceof Error) {
            logger.warn(`Index creation warning: ${error.message}`);
        }
    }
};

/**
 * Data migration from SQLite to MySQL (if needed)
 */
const migrateData = async (): Promise<void> => {
    try {
        logger.info("Starting data migration...");

        // This would be used if you need to migrate existing SQLite data
        // For now, we'll just verify the database structure

        const userCount = await AppDataSource.getRepository(User).count();
        const displayCount = await AppDataSource.getRepository(Display).count();
        const sessionCount = await AppDataSource.getRepository(Session).count();

        logger.info(`Current data counts:`);
        logger.info(`- Users: ${userCount}`);
        logger.info(`- Displays: ${displayCount}`);
        logger.info(`- Sessions: ${sessionCount}`);

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Data migration error: ${error.message}`);
        }
    }
};

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            logger.info("Migration script completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error(`Migration script failed: ${error}`);
            process.exit(1);
        });
}

export { runMigrations, migrateData }; 