"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const database_1 = require("./database");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const DEFAULT_ADMIN = {
    username: "admin",
    password: "admin123"
};
const initializeDatabase = async () => {
    try {
        // Initialize the database connection
        await database_1.AppDataSource.initialize();
        logger_1.logger.info("Database connection initialized");
        // Check if admin user exists
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const adminExists = await userRepository.findOne({
            where: { username: DEFAULT_ADMIN.username }
        });
        if (!adminExists) {
            // Create admin user
            const adminUser = userRepository.create({
                username: DEFAULT_ADMIN.username,
                password: DEFAULT_ADMIN.password
            });
            await adminUser.hashPassword();
            await userRepository.save(adminUser);
            logger_1.logger.info("Default admin user created");
        }
        else {
            logger_1.logger.info("Admin user already exists");
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Database initialization error: ${error.message}`);
        }
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
