import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { logger } from "../utils/logger";
import crypto from "crypto";

/**
 * Clean database seeding script
 * Adds basic sample data for development - only necessary tables
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
 * Seed users table with sample data
 */
const seedUsers = async (): Promise<void> => {
    const userRepository = AppDataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
        logger.info("Users already exist, skipping user seeding");
        return;
    }

    // Create sample users
    const users = [
        {
            id: "550e8400-e29b-41d4-a716-446655440001",
            username: "admin",
            password: "admin123"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440002",
            username: "user1",
            password: "password123"
        }
    ];

    for (const userData of users) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        logger.info(`Created user: ${user.username}`);
    }

    logger.info("User seeding completed");
};

/**
 * Seed sessions table with sample data (optional)
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
    const adminUser = await userRepository.findOne({ where: { username: "admin" } });

    if (!adminUser) {
        logger.warn("Admin user not found, skipping session seeding");
        return;
    }

    // Create default slides for the seeded session
    const defaultSlides = [
        {
            id: "current-escalations-1",
            name: "Current Escalations",
            type: "current-esc-slide",
            active: true,
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
            active: true,
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
            active: false,
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