import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { logger } from "../utils/logger";
import crypto from "crypto";

/**
 * Production Database Seeding Script
 * 
 * Seeds the database with production-ready user accounts:
 * - admin@persivia.com (System Administrator)
 * - hr@persivia.com (HR Administrator)
 * 
 * This script should be run once during initial setup.
 * It will skip seeding if users already exist.
 * 
 * Usage:
 *   npm run seed
 *   OR
 *   npx ts-node src/scripts/seedDatabase.ts
 */
const seedDatabase = async (): Promise<void> => {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        logger.info("Database connection initialized");

        // Seed users
        await seedUsers();

        // Seed sessions (optional - for testing)
        await seedSessions();

        // Close the connection
        await AppDataSource.destroy();
        logger.info("Database connection closed");

        logger.info("Database seeding completed successfully");
        process.exit(0);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database seeding error: ${error.message}`);
        }
        process.exit(1);
    }
};

/**
 * Seed users table with production accounts
 * 
 * PRODUCTION USERS:
 * - admin@persivia.com (Admin account for system management)
 * - hr@persivia.com (HR account for HR admin tasks)
 * 
 * Both accounts use the same secure password for initial setup.
 * Users should change their passwords after first login.
 */
const seedUsers = async (): Promise<void> => {
    const userRepository = AppDataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
        logger.info("Users already exist, skipping user seeding");
        return;
    }

    // Create production users
    const users = [
        {
            id: "550e8400-e29b-41d4-a716-446655440001",
            username: "admin@persivia.com",
            password: "Persivia@2296"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440002",
            username: "hr@persivia.com",
            password: "Persivia@2296"
        }
    ];

    for (const userData of users) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        logger.info(`✅ Created production user: ${user.username}`);
    }

    logger.info("✅ Production user seeding completed");
    logger.info("📧 Admin account: admin@persivia.com");
    logger.info("📧 HR account: hr@persivia.com");
};

/**
 * Seed sessions table with initial session for admin user
 * 
 * Creates a default session with initial slide configuration.
 * This ensures the display has slides to show on first run.
 */
const seedSessions = async (): Promise<void> => {
    const sessionRepository = AppDataSource.getRepository(Session);

    // Check if sessions already exist
    const existingSessions = await sessionRepository.count();
    if (existingSessions > 0) {
        logger.info("Sessions already exist, skipping session seeding");
        return;
    }

    // Get the admin user
    const userRepository = AppDataSource.getRepository(User);
    const adminUser = await userRepository.findOne({ where: { username: "admin@persivia.com" } });

    if (!adminUser) {
        logger.warn("Admin user not found, skipping session seeding");
        return;
    }

    // Create default slides for the seeded session
    // All slides start as inactive (active: false) - user must manually activate them
    const defaultSlides = [
        {
            id: "current-escalations-1",
            name: "Current Escalations",
            type: "current-esc-slide",
            active: false, // User must manually activate this slide
            duration: 10,
            dataSource: "api", // Using API data
            data: {
                escalations: [] // Empty array - data comes from API
            }
        },
        {
            id: "team-comparison-1",
            name: "Team Performance Comparison",
            type: "comparison-slide",
            active: false, // User must manually activate this slide
            duration: 15,
            dataSource: "api",
            data: {
                teams: [],
                lastUpdated: new Date().toISOString()
            }
        },
        {
            id: "graph-1",
            name: "Team Wise Data",
            type: "graph-slide",
            active: false, // User must manually activate this slide
            duration: 12,
            dataSource: "api",
            data: {
                title: "Team Wise Data",
                description: "Performance metrics by team",
                graphType: "bar",
                data: [],
                timeRange: "daily",
                lastUpdated: new Date().toISOString(),
                categories: []
            }
        }
    ];

    // Create a sample session
    const session = sessionRepository.create({
        sessionToken: crypto.randomBytes(32).toString("hex"),
        userId: adminUser.id,
        slideshowData: JSON.stringify({
            slides: defaultSlides,
            displaySettings: {
                swiperEffect: "slide",
                showDateStamp: true,
                hidePagination: false,
                hideArrows: false,
                hidePersiviaLogo: false
            },
            lastUpdated: new Date().toISOString(),
            version: "1.0.0"
        }),
        isActive: true,
        lastActivity: new Date(),
        deviceInfo: "Sample Device (Seeded)",
        ipAddress: "127.0.0.1"
    });

    await sessionRepository.save(session);
    logger.info("Created sample session for admin user");

    logger.info("Session seeding completed");
};

// Run the seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

export { seedDatabase };