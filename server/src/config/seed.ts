import { AppDataSource } from "./database";
import { User } from "../models/User";
import { Display } from "../models/Display";
import { Session } from "../models/Session";
import { File } from "../models/File";
import { logger } from "../utils/logger";
import bcrypt from "bcrypt";

/**
 * Get current year for dynamic title
 */
const getCurrentYear = (): number => {
    return new Date().getFullYear();
};

/**
 * Database Seeding Script
 * Populates the MySQL database with initial data
 */
const seedDatabase = async (): Promise<void> => {
    try {
        logger.info("Starting database seeding...");

        // Initialize database connection
        await AppDataSource.initialize();
        logger.info("Database connection established");

        // Seed users
        await seedUsers();

        // Seed displays
        await seedDisplays();

        // Seed sessions
        await seedSessions();

        logger.info("Database seeding completed successfully");

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Seeding failed: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
};

/**
 * Seed initial users
 */
const seedUsers = async (): Promise<void> => {
    try {
        const userRepository = AppDataSource.getRepository(User);

        // Check if users already exist
        const existingUsers = await userRepository.count();
        if (existingUsers > 0) {
            logger.info(`👥 Users ready - ${existingUsers} users found`);
            return;
        }

        // Create default admin user
        const adminUser = new User();
        adminUser.username = "admin";
        adminUser.password = await bcrypt.hash("admin123", 10);

        await userRepository.save(adminUser);

        // Create demo user
        const demoUser = new User();
        demoUser.username = "demo";
        demoUser.password = await bcrypt.hash("demo123", 10);

        await userRepository.save(demoUser);
        logger.info("👥 Default users created - admin/admin123, demo/demo123");

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`User seeding error: ${error.message}`);
        }
    }
};

/**
 * Seed initial displays
 */
const seedDisplays = async (): Promise<void> => {
    try {
        const displayRepository = AppDataSource.getRepository(Display);
        const userRepository = AppDataSource.getRepository(User);

        // Check if displays already exist
        const existingDisplays = await displayRepository.count();
        if (existingDisplays > 0) {
            logger.info(`📺 Displays ready - ${existingDisplays} displays found`);
            return;
        }

        // Get admin user for created_by reference
        const adminUser = await userRepository.findOne({ where: { username: "admin" } });
        if (!adminUser) {
            logger.warn("Admin user not found, skipping display seeding");
            return;
        }

        // Create sample displays
        const currentYear = getCurrentYear();
        const sampleDisplays = [
            {
                name: "Main Lobby Display",
                description: "Primary display for the main lobby area",
                type: "slider" as const,
                content: {
                    images: ["/uploads/sample1.jpg", "/uploads/sample2.jpg"],
                    sliderConfig: {
                        speed: 3000,
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
                    fontFamily: "Arial, sans-serif",
                    animation: "fade"
                },
                isActive: true,
                createdBy: adminUser
            },
            {
                name: "Current Escalations Display",
                description: "Real-time escalation monitoring display",
                type: "current-escalations" as const,
                content: {
                    escalations: [
                        { ticketCategory: "Code Blue", teamName: "Data Extraction", clientName: "Mclaren", ticketSummary: "Data extraction failed due to timeout", averageResponseTime: "Prompt Response", ticketStatus: "Resolved on CM Portal", curtentStatus: "Resolved" },
                        { ticketCategory: "Code Red", teamName: "Data Extraction", clientName: "Mclaren", ticketSummary: "Data extraction failed due to timeout", averageResponseTime: "Prompt Response", ticketStatus: "Open", curtentStatus: "Open" },
                        { ticketCategory: "Code Yellow", teamName: "Data Extraction", clientName: "Mclaren", ticketSummary: "Data extraction failed due to timeout", averageResponseTime: "Prompt Response", ticketStatus: "Resolved on Admin Portal", curtentStatus: "Resolved" },
                        { ticketCategory: "Code Green", teamName: "Data Extraction", clientName: "Mclaren", ticketSummary: "Data extraction failed due to timeout", averageResponseTime: "Prompt Response", ticketStatus: "Pending", curtentStatus: "Pending" }
                    ]
                },
                settings: {
                    width: 1920,
                    height: 1080,
                    backgroundColor: "#1a1a1a",
                    textColor: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Arial, sans-serif",
                    animation: "slide"
                },
                isActive: true,
                createdBy: adminUser
            },
            {
                name: `Team Wise Data ${currentYear}`,
                description: "Visual graph comparing escalation volumes across teams",
                type: "graph" as const,
                content: {
                    graphData: {
                        title: `Team Wise Data ${currentYear}`,
                        description: "A visual graph comparing escalation volumes and types across teams.",
                        graphType: "bar",
                        timeRange: "monthly",
                        lastUpdated: new Date().toISOString(),
                        categories: ["Critical", "High", "Medium", "Low"],
                        data: [
                            { teamName: "Team Alpha", dataPoints: [{ date: "", value: 12, category: "Critical" }, { date: "", value: 18, category: "High" }, { date: "", value: 25, category: "Medium" }, { date: "", value: 30, category: "Low" }] },
                            { teamName: "Team Beta", dataPoints: [{ date: "", value: 8, category: "Critical" }, { date: "", value: 15, category: "High" }, { date: "", value: 20, category: "Medium" }, { date: "", value: 28, category: "Low" }] },
                            { teamName: "Team Gamma", dataPoints: [{ date: "", value: 10, category: "Critical" }, { date: "", value: 14, category: "High" }, { date: "", value: 22, category: "Medium" }, { date: "", value: 26, category: "Low" }] }
                        ]
                    }
                },
                settings: {
                    width: 1920,
                    height: 1080,
                    backgroundColor: "#1a1a1a",
                    textColor: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Arial, sans-serif",
                    animation: "slide"
                },
                isActive: true,
                createdBy: adminUser
            },
            {
                name: "Team Performance Comparison",
                description: "Team performance metrics and comparison",
                type: "team-comparison" as const,
                content: {
                    teamComparison: {
                        teams: [
                            { teamName: "Data Extraction", totalTickets: 42, cLevelEscalations: 2, omegaEscalations: 5, codeBlueEscalations: 8, averageResponseTime: "2h 15m", averageLeadTime: "1d 4h" },
                            { teamName: "Data Processing", totalTickets: 35, cLevelEscalations: 1, omegaEscalations: 3, codeBlueEscalations: 6, averageResponseTime: "1h 45m", averageLeadTime: "18h 30m" },
                            { teamName: "Data Quality", totalTickets: 28, cLevelEscalations: 0, omegaEscalations: 2, codeBlueEscalations: 4, averageResponseTime: "1h 15m", averageLeadTime: "12h 45m" },
                            { teamName: "Infrastructure", totalTickets: 19, cLevelEscalations: 3, omegaEscalations: 1, codeBlueEscalations: 2, averageResponseTime: "3h 10m", averageLeadTime: "1d 8h" },
                            { teamName: "Frontend", totalTickets: 15, cLevelEscalations: 0, omegaEscalations: 0, codeBlueEscalations: 1, averageResponseTime: "45m", averageLeadTime: "8h 20m" }
                        ],
                        lastUpdated: new Date().toISOString()
                    }
                },
                settings: {
                    width: 1920,
                    height: 1080,
                    backgroundColor: "#1a1a1a",
                    textColor: "#ffffff",
                    fontSize: 24,
                    fontFamily: "Arial, sans-serif",
                    animation: "slide"
                },
                isActive: true,
                createdBy: adminUser
            }
        ];

        for (const displayData of sampleDisplays) {
            const display = new Display();
            Object.assign(display, displayData);
            await displayRepository.save(display);
        }

        logger.info(`📺 Sample displays created - ${sampleDisplays.length} displays added`);

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Display seeding error: ${error.message}`);
        }
    }
};

/**
 * Seed initial sessions
 */
const seedSessions = async (): Promise<void> => {
    try {
        const sessionRepository = AppDataSource.getRepository(Session);
        const userRepository = AppDataSource.getRepository(User);

        // Check if sessions already exist
        const existingSessions = await sessionRepository.count();
        if (existingSessions > 0) {
            logger.info(`🔐 Sessions ready - ${existingSessions} sessions found`);
            return;
        }

        // Get admin user for session reference
        const adminUser = await userRepository.findOne({ where: { username: "admin" } });
        if (!adminUser) {
            logger.warn("Admin user not found, skipping session seeding");
            return;
        }

        // Create sample session
        const sampleSession = new Session();
        sampleSession.sessionToken = "sample-session-token-" + Date.now();
        sampleSession.userId = adminUser.id;
        sampleSession.user = adminUser;
        sampleSession.displaySettings = JSON.stringify({
            theme: "dark",
            autoRefresh: true,
            refreshInterval: 30000
        });
        sampleSession.slideData = JSON.stringify([
            {
                id: "slide1",
                type: "text",
                content: "Welcome to LED Display System",
                duration: 5000
            }
        ]);
        sampleSession.appSettings = JSON.stringify({
            language: "en",
            timezone: "UTC",
            notifications: true
        });
        sampleSession.isActive = true;
        sampleSession.lastActivity = new Date();
        sampleSession.deviceInfo = "Chrome/120.0.0.0 Windows 11";
        sampleSession.ipAddress = "127.0.0.1";

        await sessionRepository.save(sampleSession);
        logger.info("🔐 Sample session created");

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Session seeding error: ${error.message}`);
        }
    }
};

/**
 * Verify seeded data
 */
const verifySeededData = async (): Promise<void> => {
    try {
        const userCount = await AppDataSource.getRepository(User).count();
        const displayCount = await AppDataSource.getRepository(Display).count();
        const sessionCount = await AppDataSource.getRepository(Session).count();

        logger.info("Seeded data verification:");
        logger.info(`- Users: ${userCount}`);
        logger.info(`- Displays: ${displayCount}`);
        logger.info(`- Sessions: ${sessionCount}`);

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Data verification error: ${error.message}`);
        }
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(async () => {
            // Verify seeded data
            await AppDataSource.initialize();
            await verifySeededData();
            await AppDataSource.destroy();

            logger.info("Seeding script completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error(`Seeding script failed: ${error}`);
            process.exit(1);
        });
}

export { seedDatabase, verifySeededData }; 