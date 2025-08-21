import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Display } from "../models/Display";
import { Session } from "../models/Session";
import { logger } from "../utils/logger";
import bcrypt from "bcrypt";

/**
 * Simple database seeding script
 * Adds basic sample data for development
 */
const seedDatabase = async (): Promise<void> => {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        logger.info("Database connection initialized");

        // Seed users
        await seedUsers();

        // Seed displays
        await seedDisplays();

        // Seed sessions
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
            username: "admin",
            password: await bcrypt.hash("admin123", 10)
        },
        {
            username: "user1",
            password: await bcrypt.hash("user123", 10)
        }
    ];

    for (const userData of users) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        logger.info(`Created user: ${userData.username}`);
    }
};

/**
 * Seed displays table with sample data
 */
const seedDisplays = async (): Promise<void> => {
    const displayRepository = AppDataSource.getRepository(Display);
    const userRepository = AppDataSource.getRepository(User);

    // Check if displays already exist
    const existingDisplays = await displayRepository.count();
    if (existingDisplays > 0) {
        logger.info("Displays already exist, skipping display seeding");
        return;
    }

    // Get the first user to use as created_by
    const firstUser = await userRepository.findOne({ where: { username: "admin" } });
    if (!firstUser) {
        logger.warn("No admin user found, skipping display seeding");
        return;
    }

    // Create sample displays
    const displays = [
        {
            name: "Main Display",
            description: "Primary LED display in the lobby",
            type: "slider" as const,
            content: {
                sliderConfig: {
                    speed: 5000,
                    direction: "horizontal" as const,
                    transition: "fade" as const
                }
            },
            settings: {
                width: 1920,
                height: 1080,
                backgroundColor: "#000000",
                textColor: "#ffffff",
                fontSize: 24,
                fontFamily: "Arial",
                animation: "fade"
            },
            isActive: true,
            createdBy: firstUser
        },
        {
            name: "Conference Room Display",
            description: "Display in conference room A",
            type: "text" as const,
            content: {
                text: "Welcome to Conference Room A"
            },
            settings: {
                width: 1920,
                height: 1080,
                backgroundColor: "#1a1a1a",
                textColor: "#ffffff",
                fontSize: 32,
                fontFamily: "Arial",
                animation: "slide"
            },
            isActive: true,
            createdBy: firstUser
        }
    ];

    for (const displayData of displays) {
        const display = displayRepository.create(displayData);
        await displayRepository.save(display);
        logger.info(`Created display: ${displayData.name}`);
    }
};

/**
 * Seed sessions table with sample data
 */
const seedSessions = async (): Promise<void> => {
    const sessionRepository = AppDataSource.getRepository(Session);
    const userRepository = AppDataSource.getRepository(User);

    // Check if sessions already exist
    const existingSessions = await sessionRepository.count();
    if (existingSessions > 0) {
        logger.info("Sessions already exist, skipping session seeding");
        return;
    }

    // Get the first user
    const firstUser = await userRepository.findOne({ where: { username: "admin" } });
    if (!firstUser) {
        logger.warn("No admin user found, skipping session seeding");
        return;
    }

    // Create sample session
    const session = sessionRepository.create({
        sessionToken: "sample-session-token-123",
        userId: firstUser.id,
        displaySettings: JSON.stringify({ theme: "default", language: "en" }),
        slideData: JSON.stringify({ currentSlide: 0, slides: [] }),
        appSettings: JSON.stringify({ notifications: true, autoPlay: true }),
        isActive: true,
        deviceInfo: "Sample Device",
        ipAddress: "127.0.0.1"
    });

    await sessionRepository.save(session);
    logger.info("Created sample session");
};

// Run the seeding
seedDatabase();
