"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySeededData = exports.seedDatabase = void 0;
const database_1 = require("./database");
const User_1 = require("../models/User");
const Display_1 = require("../models/Display");
const Session_1 = require("../models/Session");
const logger_1 = require("../utils/logger");
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Database Seeding Script
 * Populates the MySQL database with initial data
 */
const seedDatabase = async () => {
    try {
        logger_1.logger.info("Starting database seeding...");
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        logger_1.logger.info("Database connection established");
        // Seed users
        await seedUsers();
        // Seed displays
        await seedDisplays();
        // Seed sessions
        await seedSessions();
        logger_1.logger.info("Database seeding completed successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Seeding failed: ${error.message}`);
            logger_1.logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
};
exports.seedDatabase = seedDatabase;
/**
 * Seed initial users
 */
const seedUsers = async () => {
    try {
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        // Check if users already exist
        const existingUsers = await userRepository.count();
        if (existingUsers > 0) {
            logger_1.logger.info(`👥 Users ready - ${existingUsers} users found`);
            return;
        }
        // Create default admin user
        const adminUser = new User_1.User();
        adminUser.username = "admin";
        adminUser.password = await bcrypt_1.default.hash("admin123", 10);
        await userRepository.save(adminUser);
        // Create demo user
        const demoUser = new User_1.User();
        demoUser.username = "demo";
        demoUser.password = await bcrypt_1.default.hash("demo123", 10);
        await userRepository.save(demoUser);
        logger_1.logger.info("👥 Default users created - admin/admin123, demo/demo123");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`User seeding error: ${error.message}`);
        }
    }
};
/**
 * Seed initial displays
 */
const seedDisplays = async () => {
    try {
        const displayRepository = database_1.AppDataSource.getRepository(Display_1.Display);
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        // Check if displays already exist
        const existingDisplays = await displayRepository.count();
        if (existingDisplays > 0) {
            logger_1.logger.info(`📺 Displays ready - ${existingDisplays} displays found`);
            return;
        }
        // Get admin user for created_by reference
        const adminUser = await userRepository.findOne({ where: { username: "admin" } });
        if (!adminUser) {
            logger_1.logger.warn("Admin user not found, skipping display seeding");
            return;
        }
        // Create sample displays
        const sampleDisplays = [
            {
                name: "Main Lobby Display",
                description: "Primary display for the main lobby area",
                type: "slider",
                content: {
                    images: ["/uploads/sample1.jpg", "/uploads/sample2.jpg"],
                    sliderConfig: {
                        speed: 3000,
                        direction: "horizontal",
                        transition: "fade"
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
                type: "current-escalations",
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
                name: "Escalation Trend Graph",
                description: "Visual graph comparing escalation volumes across teams",
                type: "graph",
                content: {
                    graphData: {
                        title: "Escalation Trend Graph",
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
                type: "team-comparison",
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
            const display = new Display_1.Display();
            Object.assign(display, displayData);
            await displayRepository.save(display);
        }
        logger_1.logger.info(`📺 Sample displays created - ${sampleDisplays.length} displays added`);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Display seeding error: ${error.message}`);
        }
    }
};
/**
 * Seed initial sessions
 */
const seedSessions = async () => {
    try {
        const sessionRepository = database_1.AppDataSource.getRepository(Session_1.Session);
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        // Check if sessions already exist
        const existingSessions = await sessionRepository.count();
        if (existingSessions > 0) {
            logger_1.logger.info(`🔐 Sessions ready - ${existingSessions} sessions found`);
            return;
        }
        // Get admin user for session reference
        const adminUser = await userRepository.findOne({ where: { username: "admin" } });
        if (!adminUser) {
            logger_1.logger.warn("Admin user not found, skipping session seeding");
            return;
        }
        // Create sample session
        const sampleSession = new Session_1.Session();
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
        logger_1.logger.info("🔐 Sample session created");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Session seeding error: ${error.message}`);
        }
    }
};
/**
 * Verify seeded data
 */
const verifySeededData = async () => {
    try {
        const userCount = await database_1.AppDataSource.getRepository(User_1.User).count();
        const displayCount = await database_1.AppDataSource.getRepository(Display_1.Display).count();
        const sessionCount = await database_1.AppDataSource.getRepository(Session_1.Session).count();
        logger_1.logger.info("Seeded data verification:");
        logger_1.logger.info(`- Users: ${userCount}`);
        logger_1.logger.info(`- Displays: ${displayCount}`);
        logger_1.logger.info(`- Sessions: ${sessionCount}`);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Data verification error: ${error.message}`);
        }
    }
};
exports.verifySeededData = verifySeededData;
// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(async () => {
        // Verify seeded data
        await database_1.AppDataSource.initialize();
        await verifySeededData();
        await database_1.AppDataSource.destroy();
        logger_1.logger.info("Seeding script completed");
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error(`Seeding script failed: ${error}`);
        process.exit(1);
    });
}
