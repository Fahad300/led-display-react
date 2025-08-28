import { AppDataSource } from "../config/database";

/**
 * Run database migrations with clean output
 */
const runMigrations = async (): Promise<void> => {
    try {
        console.log("🔄 Starting database migrations...");

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Database connected");
        }

        // Get pending migrations
        const pendingMigrations = await AppDataSource.showMigrations();

        if (pendingMigrations) {
            console.log("📋 Found pending migrations, running them now...");

            // Temporarily suppress console output during migrations
            const originalLog = console.log;
            const originalInfo = console.info;
            const originalWarn = console.warn;
            const originalError = console.error;

            console.log = () => { };
            console.info = () => { };
            console.warn = () => { };
            console.error = () => { };

            try {
                // Run migrations
                const result = await AppDataSource.runMigrations();

                // Restore console output
                console.log = originalLog;
                console.info = originalInfo;
                console.warn = originalWarn;
                console.error = originalError;

                if (result && result.length > 0) {
                    console.log(`✅ Successfully ran ${result.length} migration(s)`);
                }
            } catch (migrationError) {
                // Restore console output on error
                console.log = originalLog;
                console.info = originalInfo;
                console.warn = originalWarn;
                console.error = originalError;
                throw migrationError;
            }
        } else {
            console.log("✅ No pending migrations");
        }

        console.log("🎉 Migration process completed successfully!");

    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Migration failed: ${error.message}`);
        } else {
            console.error("❌ Migration failed with unknown error:", error);
        }
        process.exit(1);
    } finally {
        // Close database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log("🔌 Database connection closed");
        }
    }
};

// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations();
}

export { runMigrations };
